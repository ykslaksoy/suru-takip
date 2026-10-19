-- SuperKuzu bulut senkron şeması (Supabase / Postgres)
-- Supabase SQL Editor'da bir kez çalıştırın. Tekrar çalıştırmak güvenlidir (idempotent).

-- gen_random_uuid() Postgres 13+ çekirdeğinde var

-- Çiftlik (tenant)
create table if not exists public.ciftlik (
  id uuid primary key default gen_random_uuid(),
  ad text not null default 'Çiftliğim',
  sahip_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Üyeler + roller (sunucu tarafı yetki kaynağı)
create table if not exists public.ciftlik_uye (
  ciftlik_id uuid not null references public.ciftlik(id) on delete cascade,
  kullanici_id uuid not null references auth.users(id) on delete cascade,
  ad text not null default '',
  rol text not null check (rol in ('sahip','ortak','bakici','veteriner')),
  finans boolean not null default false,   -- para / maliyet verisini görebilir mi
  duzenle boolean not null default true,
  sil boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (ciftlik_id, kullanici_id)
);

-- Davet kodları (Sahip üretir, link veya 8 haneli kod ile paylaşılır)
create table if not exists public.ciftlik_davet (
  kod text primary key,
  ciftlik_id uuid not null references public.ciftlik(id) on delete cascade,
  rol text not null check (rol in ('ortak','bakici','veteriner')),
  finans boolean not null default false,
  olusturan uuid not null references auth.users(id),
  son_kullanma timestamptz not null default now() + interval '7 days',
  kullanildi_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Belge senkronu: her yerel koleksiyon (sy_* anahtarı) bir satır. LWW + soft delete.
create table if not exists public.belge (
  ciftlik_id uuid not null references public.ciftlik(id) on delete cascade,
  anahtar text not null,
  deger jsonb,
  finans boolean not null default false,
  silindi boolean not null default false,
  updated_at timestamptz not null,           -- istemci değişiklik zamanı (LWW)
  sunucu_zamani timestamptz not null default now(), -- çekme imleci
  degistiren uuid references auth.users(id),
  primary key (ciftlik_id, anahtar)
);
create index if not exists belge_imlec on public.belge (ciftlik_id, sunucu_zamani);

-- Fotoğraf metası (dosyalar Storage 'kuzu-foto' kovasında: {ciftlik_id}/{foto_id}.jpg)
create table if not exists public.foto (
  ciftlik_id uuid not null references public.ciftlik(id) on delete cascade,
  id text not null,
  yol text not null,
  silindi boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (ciftlik_id, id)
);

-- Yardımcı fonksiyonlar (security definer: RLS döngüsünü önler)
create or replace function public.uye_mi(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from ciftlik_uye where ciftlik_id = c and kullanici_id = auth.uid());
$$;

create or replace function public.finans_gorur(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from ciftlik_uye where ciftlik_id = c and kullanici_id = auth.uid()
                and (rol in ('sahip','ortak') or finans));
$$;

create or replace function public.yazabilir(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from ciftlik_uye where ciftlik_id = c and kullanici_id = auth.uid()
                and (rol in ('sahip','ortak') or duzenle));
$$;

create or replace function public.sahip_mi(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from ciftlik_uye where ciftlik_id = c and kullanici_id = auth.uid() and rol = 'sahip');
$$;

-- Çiftlik oluştur: oluşturan Sahip olur
create or replace function public.ciftlik_olustur(p_ad text) returns uuid
language plpgsql security definer set search_path = public as $$
declare yeni uuid;
begin
  if auth.uid() is null then raise exception 'giriş gerekli'; end if;
  insert into ciftlik(ad, sahip_id) values (coalesce(nullif(p_ad,''),'Çiftliğim'), auth.uid()) returning id into yeni;
  insert into ciftlik_uye(ciftlik_id, kullanici_id, rol, finans, duzenle, sil) values (yeni, auth.uid(), 'sahip', true, true, true);
  return yeni;
end $$;

-- Davet oluştur (yalnız Sahip)
create or replace function public.davet_olustur(p_ciftlik uuid, p_rol text, p_finans boolean default false) returns text
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  if not sahip_mi(p_ciftlik) then raise exception 'yalnız sahip davet edebilir'; end if;
  k := upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into ciftlik_davet(kod, ciftlik_id, rol, finans, olusturan) values (k, p_ciftlik, p_rol, p_finans and p_rol <> 'bakici', auth.uid());
  return k;
end $$;

create or replace function public.kullanici_id_bos(u uuid) returns boolean
language sql immutable as $$ select u is null $$;

-- Davete katıl
create or replace function public.davet_kabul(p_kod text, p_ad text default '') returns uuid
language plpgsql security definer set search_path = public as $$
declare d ciftlik_davet;
begin
  if auth.uid() is null then raise exception 'giriş gerekli'; end if;
  select * into d from ciftlik_davet where kod = upper(trim(p_kod)) and kullanici_id_bos(kullanildi_by) and son_kullanma > now();
  if d.kod is null then raise exception 'davet geçersiz veya süresi dolmuş'; end if;
  insert into ciftlik_uye(ciftlik_id, kullanici_id, ad, rol, finans, duzenle, sil)
    values (d.ciftlik_id, auth.uid(), coalesce(p_ad,''), d.rol, d.finans, d.rol <> 'veteriner', false)
    on conflict (ciftlik_id, kullanici_id) do nothing;
  update ciftlik_davet set kullanildi_by = auth.uid() where kod = d.kod;
  return d.ciftlik_id;
end $$;

-- Bakıcı finans=true olamaz (sunucu kuralı)
create or replace function public.uye_kural() returns trigger language plpgsql as $$
begin
  if new.rol = 'bakici' then new.finans := false; end if;
  return new;
end $$;
drop trigger if exists uye_kural_t on public.ciftlik_uye;
create trigger uye_kural_t before insert or update on public.ciftlik_uye for each row execute function public.uye_kural();

-- Sunucu zamanı her yazımda güncellenir (çekme imleci güvenilir olsun)
create or replace function public.belge_zaman() returns trigger language plpgsql as $$
begin
  new.sunucu_zamani := now();
  new.degistiren := auth.uid();
  return new;
end $$;
drop trigger if exists belge_zaman_t on public.belge;
create trigger belge_zaman_t before insert or update on public.belge for each row execute function public.belge_zaman();

-- LWW sunucuda da korunur: daha eski updated_at ile gelen yazım yok sayılır
create or replace function public.belge_lww() returns trigger language plpgsql as $$
begin
  if new.updated_at < old.updated_at then return null; end if;
  return new;
end $$;
drop trigger if exists belge_lww_t on public.belge;
create trigger belge_lww_t before update on public.belge for each row execute function public.belge_lww();

-- RLS
alter table public.ciftlik enable row level security;
alter table public.ciftlik_uye enable row level security;
alter table public.ciftlik_davet enable row level security;
alter table public.belge enable row level security;
alter table public.foto enable row level security;

drop policy if exists ciftlik_oku on public.ciftlik;
create policy ciftlik_oku on public.ciftlik for select using (uye_mi(id));
drop policy if exists ciftlik_guncelle on public.ciftlik;
create policy ciftlik_guncelle on public.ciftlik for update using (sahip_mi(id));

drop policy if exists uye_oku on public.ciftlik_uye;
create policy uye_oku on public.ciftlik_uye for select using (uye_mi(ciftlik_id));
drop policy if exists uye_sahip_yaz on public.ciftlik_uye;
create policy uye_sahip_yaz on public.ciftlik_uye for update using (sahip_mi(ciftlik_id));
drop policy if exists uye_sahip_sil on public.ciftlik_uye;
create policy uye_sahip_sil on public.ciftlik_uye for delete using (sahip_mi(ciftlik_id) and rol <> 'sahip');

drop policy if exists davet_sahip on public.ciftlik_davet;
create policy davet_sahip on public.ciftlik_davet for select using (sahip_mi(ciftlik_id));

-- Finans belgeleri yalnız finans yetkisi olana gider (Bakıcı hiç almaz)
drop policy if exists belge_oku on public.belge;
create policy belge_oku on public.belge for select using (uye_mi(ciftlik_id) and (not finans or finans_gorur(ciftlik_id)));
drop policy if exists belge_ekle on public.belge;
create policy belge_ekle on public.belge for insert with check (yazabilir(ciftlik_id) and (not finans or finans_gorur(ciftlik_id)));
drop policy if exists belge_guncelle on public.belge;
create policy belge_guncelle on public.belge for update using (yazabilir(ciftlik_id) and (not finans or finans_gorur(ciftlik_id)));

drop policy if exists foto_oku on public.foto;
create policy foto_oku on public.foto for select using (uye_mi(ciftlik_id));
drop policy if exists foto_yaz on public.foto;
create policy foto_yaz on public.foto for insert with check (yazabilir(ciftlik_id));
drop policy if exists foto_guncelle on public.foto;
create policy foto_guncelle on public.foto for update using (yazabilir(ciftlik_id));

-- Storage kovası (özel) + politikalar: yol ilk klasörü = ciftlik_id
insert into storage.buckets (id, name, public) values ('kuzu-foto','kuzu-foto', false) on conflict (id) do nothing;
drop policy if exists kuzu_foto_oku on storage.objects;
create policy kuzu_foto_oku on storage.objects for select
  using (bucket_id = 'kuzu-foto' and public.uye_mi(((storage.foldername(name))[1])::uuid));
drop policy if exists kuzu_foto_yaz on storage.objects;
create policy kuzu_foto_yaz on storage.objects for insert
  with check (bucket_id = 'kuzu-foto' and public.yazabilir(((storage.foldername(name))[1])::uuid));
drop policy if exists kuzu_foto_guncelle on storage.objects;
create policy kuzu_foto_guncelle on storage.objects for update
  using (bucket_id = 'kuzu-foto' and public.yazabilir(((storage.foldername(name))[1])::uuid));

grant execute on function public.ciftlik_olustur(text), public.davet_olustur(uuid,text,boolean), public.davet_kabul(text,text) to authenticated;
