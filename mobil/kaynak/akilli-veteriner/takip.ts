import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { HastalikTeshis } from './teshis';
import type { VetCevaplar } from './netlestirme';
import type { VakaFotografi } from './fotograf';

const KEY = 'sy_hastalik_takip_v1';

export type TakipAsama =
  | 'teshis'
  | 'vet_bekliyor'
  | 'tedavi'
  | 'kontrol_bekliyor'
  | 'takip'
  | 'taburcu';

export type TakipGuncelleme = {
  tarih: string;
  not: string;
  durum: 'iyilesiyor' | 'ayni' | 'kotulesti';
  fotoSayisi: number;
  fotograflar?: VakaFotografi[];
};

export type HastalikTakip = {
  id: string;
  animalId: string | null;
  earTag: string;
  paddock: string;
  teshis: HastalikTeshis;
  baglamMetni: string;
  cevaplar: VetCevaplar;
  baslangic: string;
  etkiBitis: string;
  sonrakiKontrol: string;
  asama: TakipAsama;
  vetDanisildi: boolean;
  tedaviUygulandi: boolean;
  karantinaYapildi: boolean;
  karantinaPadok: string | null;
  /** Karantina öncesi padok — taburcuda geri */
  oncekiPadok: string | null;
  suruTedaviYapildi: boolean;
  suruTedaviHedef: 'ayni_padok' | 'tum_kuzular' | null;
  guncellemeler: TakipGuncelleme[];
  fotograflar: VakaFotografi[];
};

async function oku(): Promise<HastalikTakip[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as HastalikTakip[];
    return list.map((t) => ({
      ...t,
      oncekiPadok: t.oncekiPadok ?? null,
    }));
  } catch {
    return [];
  }
}

async function yaz(list: HastalikTakip[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function getAktifTakipler(): Promise<HastalikTakip[]> {
  return (await oku())
    .filter((t) => t.asama !== 'taburcu')
    .sort((a, b) => a.sonrakiKontrol.localeCompare(b.sonrakiKontrol));
}

export async function getTakip(id: string): Promise<HastalikTakip | null> {
  return (await oku()).find((t) => t.id === id) ?? null;
}

export async function baslatTakip(input: {
  animalId: string | null;
  earTag: string;
  paddock: string;
  teshis: HastalikTeshis;
  baglamMetni: string;
  cevaplar: VetCevaplar;
  fotograflar: VakaFotografi[];
}): Promise<HastalikTakip> {
  const baslangic = new Date();
  const etkiBitis = new Date(baslangic.getTime() + input.teshis.etkiSuresiGun * 86400000);
  const kayit: HastalikTakip = {
    id: uuidv4(),
    animalId: input.animalId,
    earTag: input.earTag,
    paddock: input.paddock,
    teshis: input.teshis,
    baglamMetni: input.baglamMetni,
    cevaplar: input.cevaplar,
    baslangic: baslangic.toISOString(),
    etkiBitis: etkiBitis.toISOString(),
    sonrakiKontrol: etkiBitis.toISOString(),
    asama: input.teshis.vetDanisma === 'zorunlu' ? 'vet_bekliyor' : 'teshis',
    vetDanisildi: false,
    tedaviUygulandi: false,
    karantinaYapildi: false,
    karantinaPadok: null,
    oncekiPadok: null,
    suruTedaviYapildi: false,
    suruTedaviHedef: null,
    guncellemeler: [],
    fotograflar: input.fotograflar,
  };
  const list = await oku();
  list.unshift(kayit);
  await yaz(list);
  return kayit;
}

export async function takipGuncelle(
  id: string,
  patch: Partial<HastalikTakip>
): Promise<HastalikTakip | null> {
  const list = await oku();
  const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch };
  await yaz(list);
  return list[idx];
}

export async function vetDanisildiIsaretle(id: string): Promise<void> {
  await takipGuncelle(id, { vetDanisildi: true, asama: 'teshis' });
}

export async function tedaviUygulandiIsaretle(id: string): Promise<void> {
  const t = await getTakip(id);
  if (!t) return;
  await takipGuncelle(id, {
    tedaviUygulandi: true,
    asama: 'kontrol_bekliyor',
    sonrakiKontrol: t.etkiBitis,
  });
}

export async function karantinaYapildiIsaretle(
  id: string,
  padokAd: string,
  oncekiPadok?: string | null
): Promise<void> {
  await takipGuncelle(id, {
    karantinaYapildi: true,
    karantinaPadok: padokAd,
    oncekiPadok: oncekiPadok ?? null,
    asama: 'takip',
  });
}

export async function suruTedaviIsaretle(
  id: string,
  hedef: 'ayni_padok' | 'tum_kuzular'
): Promise<void> {
  await takipGuncelle(id, { suruTedaviYapildi: true, suruTedaviHedef: hedef });
}

export function kontrolZamaniGeldi(t: HastalikTakip): boolean {
  return Date.now() >= new Date(t.sonrakiKontrol).getTime();
}

/** Kontrol zamanı geldiyse en az 1 foto zorunlu */
export function kontrolFotoGerekli(t: HastalikTakip): boolean {
  return (
    (t.asama === 'kontrol_bekliyor' || t.asama === 'takip') &&
    kontrolZamaniGeldi(t)
  );
}

export async function kontrolGuncelle(
  id: string,
  guncelleme: Omit<TakipGuncelleme, 'tarih'> & {
    tarih?: string;
    fotograflar?: VakaFotografi[];
  }
): Promise<{ ok: boolean; message: string; takip?: HastalikTakip }> {
  const t = await getTakip(id);
  if (!t) return { ok: false, message: 'Takip yok' };

  const fotolar = guncelleme.fotograflar ?? [];
  if (kontrolFotoGerekli(t) && fotolar.length === 0 && (guncelleme.fotoSayisi ?? 0) === 0) {
    return { ok: false, message: 'Kontrol fotoğrafı zorunlu — en az 1 foto ekleyin.' };
  }

  const kayit: TakipGuncelleme = {
    not: guncelleme.not,
    durum: guncelleme.durum,
    fotoSayisi: fotolar.length || guncelleme.fotoSayisi || 0,
    fotograflar: fotolar.length ? fotolar : undefined,
    tarih: guncelleme.tarih ?? new Date().toISOString(),
  };
  const guncellemeler = [...t.guncellemeler, kayit];
  const tumFotolar = fotolar.length ? [...t.fotograflar, ...fotolar] : t.fotograflar;

  let asama: TakipAsama = 'takip';
  let sonrakiKontrol = t.sonrakiKontrol;
  const iyilesen = guncellemeler.filter((g) => g.durum === 'iyilesiyor').length;

  if (kayit.durum === 'kotulesti') {
    asama = 'vet_bekliyor';
  } else if (kayit.durum === 'iyilesiyor' && iyilesen >= 2) {
    asama = 'taburcu';
  } else if (kayit.durum === 'ayni') {
    asama = 'takip';
    sonrakiKontrol = new Date(Date.now() + 2 * 86400000).toISOString();
  } else if (kayit.durum === 'iyilesiyor') {
    asama = 'takip';
    sonrakiKontrol = new Date(Date.now() + 3 * 86400000).toISOString();
  }

  const guncel = await takipGuncelle(id, {
    guncellemeler,
    asama,
    sonrakiKontrol,
    fotograflar: tumFotolar,
  });
  return {
    ok: true,
    message:
      asama === 'taburcu'
        ? 'İyileşme onaylandı — taburcu.'
        : asama === 'vet_bekliyor'
          ? 'Kötüleşme — veteriner danışması gerekli.'
          : 'Durum kaydedildi.',
    takip: guncel ?? undefined,
  };
}

export function asamaEtiket(a: TakipAsama): string {
  const map: Record<TakipAsama, string> = {
    teshis: 'Teşhis — tedavi bekliyor',
    vet_bekliyor: 'Veteriner danışması bekleniyor',
    tedavi: 'Tedavi uygulanacak',
    kontrol_bekliyor: 'Etki süresi — kontrol bekleniyor',
    takip: 'Takip modunda',
    taburcu: 'Taburcu',
  };
  return map[a];
}

export async function taburcuEt(id: string): Promise<{
  ok: boolean;
  message: string;
  oncekiPadok: string | null;
}> {
  const t = await getTakip(id);
  if (!t) return { ok: false, message: 'Takip yok', oncekiPadok: null };
  await takipGuncelle(id, { asama: 'taburcu' });
  return {
    ok: true,
    message: `${t.earTag} taburcu edildi`,
    oncekiPadok: t.oncekiPadok,
  };
}
