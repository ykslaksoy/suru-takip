/** Ekip deposu — bellekte önbellek + dinleyiciler; denetim ve işlem günlüğüne aktif kişiyi verir */
import { v4 as uuidv4 } from 'uuid';
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { denetimYaz, setDenetimKimSaglayici } from '@/kaynak/cekirdek/denetim';
import { setGunlukKimSaglayici } from '@/kaynak/gecmis/gunluk';
import { setYetkiDenetleyici } from './kapi';
import {
  ekipOnar,
  ekipYonetebilir,
  kisiDogrula,
  kisiEtiket,
  kisiSilinebilir,
  pinDogru,
  pinGecerli,
  pinOzeti,
  ROL_ETIKET,
  VARSAYILAN_YETKI,
  varsayilanEkip,
  yetkiMesaji,
  yetkiVar,
  YETKI_ETIKET,
  type EkipDurumu,
  type Kisi,
  type Rol,
  type Yetki,
} from './hesap';

const KEY = 'sy_ekip_v1';
let durum: EkipDurumu = varsayilanEkip();
let yuklendi = false;
const dinleyiciler = new Set<() => void>();

function bildir() {
  for (const f of dinleyiciler) f();
}

export function ekipDinle(f: () => void): () => void {
  dinleyiciler.add(f);
  return () => dinleyiciler.delete(f);
}

export function ekipAnlik(): EkipDurumu {
  return durum;
}

export function aktifKisi(): Kisi {
  return durum.kisiler.find((k) => k.id === durum.aktifId) ?? durum.kisiler[0];
}

setDenetimKimSaglayici(() => {
  const k = aktifKisi();
  return { id: k.id, ad: kisiEtiket(k) };
});
setGunlukKimSaglayici(() => kisiEtiket(aktifKisi()));
setYetkiDenetleyici((y) => (yetkiVar(aktifKisi(), y) ? null : yetkiMesaji(y, aktifKisi())));

export async function ekipYukle(): Promise<EkipDurumu> {
  const raw = await kaliciGetItem(KEY);
  try {
    durum = ekipOnar(raw ? JSON.parse(raw) : null);
  } catch {
    durum = varsayilanEkip();
  }
  yuklendi = true;
  bildir();
  return durum;
}

export function ekipYuklendi(): boolean {
  return yuklendi;
}

async function kaydet(d: EkipDurumu) {
  durum = ekipOnar(d);
  await kaliciSetItem(KEY, JSON.stringify(durum));
  bildir();
}

/** Aktif kullanıcının yetkisi */
export function yetki(y: Yetki): boolean {
  return yetkiVar(aktifKisi(), y);
}

/** Yetki yoksa hata atar (veri katmanı korumaları) */
export function yetkiGerekli(y: Yetki): void {
  if (!yetki(y)) throw new Error(yetkiMesaji(y, aktifKisi()));
}

function sahipGerekli() {
  if (!ekipYonetebilir(aktifKisi())) throw new Error('Ekibi ve yetkileri yalnız Sahip değiştirebilir.');
}

export async function kullaniciDegistir(id: string, pin = ''): Promise<void> {
  const k = durum.kisiler.find((x) => x.id === id);
  if (!k) throw new Error('Kişi bulunamadı');
  if (!pinDogru(k, pin)) throw new Error('PIN yanlış');
  await kaydet({ ...durum, aktifId: id });
  denetimYaz({ eylem: 'guncelleme', tablo: 'ekip', kayitId: id, ozet: `Aktif kullanıcı: ${kisiEtiket(k)}` });
}

export async function kisiKaydet(input: { id?: string; ad: string; rol: Rol; yetkiler?: Partial<Record<Yetki, boolean>> }): Promise<Kisi> {
  sahipGerekli();
  const eski = input.id ? durum.kisiler.find((x) => x.id === input.id) : undefined;
  const k: Kisi = {
    id: eski?.id ?? uuidv4(),
    ad: input.ad.trim(),
    rol: input.rol,
    yetkiler: { ...(eski && eski.rol === input.rol ? eski.yetkiler : VARSAYILAN_YETKI[input.rol]), ...(input.yetkiler ?? {}) },
    pinOzet: eski?.pinOzet,
    olusturma: eski?.olusturma ?? new Date().toISOString(),
  };
  const hata = kisiDogrula(durum.kisiler, k);
  if (hata) throw new Error(hata);
  await kaydet({ ...durum, kisiler: eski ? durum.kisiler.map((x) => (x.id === k.id ? k : x)) : [...durum.kisiler, k] });
  denetimYaz({
    eylem: eski ? 'guncelleme' : 'ekleme',
    tablo: 'ekip',
    kayitId: k.id,
    ozet: `${kisiEtiket(k)}`,
    degisiklikler: eski && eski.rol !== k.rol ? [{ alan: 'Rol', eski: ROL_ETIKET[eski.rol], yeni: ROL_ETIKET[k.rol] }] : undefined,
  });
  return k;
}

export async function yetkiAyarla(id: string, y: Yetki, acik: boolean): Promise<void> {
  sahipGerekli();
  const k = durum.kisiler.find((x) => x.id === id);
  if (!k || k.rol === 'sahip') return;
  await kaydet({ ...durum, kisiler: durum.kisiler.map((x) => (x.id === id ? { ...x, yetkiler: { ...x.yetkiler, [y]: acik } } : x)) });
  denetimYaz({ eylem: 'guncelleme', tablo: 'ekip', kayitId: id, ozet: `${kisiEtiket(k)} · ${YETKI_ETIKET[y]}`, degisiklikler: [{ alan: YETKI_ETIKET[y], eski: acik ? 'kapalı' : 'açık', yeni: acik ? 'açık' : 'kapalı' }] });
}

export async function pinAyarla(id: string, pin: string | null): Promise<void> {
  const k = durum.kisiler.find((x) => x.id === id);
  if (!k) return;
  // Sahip herkesinkini; diğerleri yalnız kendi PIN'ini
  if (!ekipYonetebilir(aktifKisi()) && aktifKisi().id !== id) throw new Error('Yalnız kendi PIN’ini değiştirebilirsin');
  if (pin != null && !pinGecerli(pin)) throw new Error('PIN 4–6 rakam olmalı');
  await kaydet({ ...durum, kisiler: durum.kisiler.map((x) => (x.id === id ? { ...x, pinOzet: pin ? pinOzeti(pin, id) : undefined } : x)) });
  denetimYaz({ eylem: 'guncelleme', tablo: 'ekip', kayitId: id, ozet: `${kisiEtiket(k)} · PIN ${pin ? 'kondu' : 'kaldırıldı'}` });
}

export async function kisiSil(id: string): Promise<void> {
  sahipGerekli();
  const h = kisiSilinebilir(durum.kisiler, id, durum.aktifId);
  if (h) throw new Error(h);
  const k = durum.kisiler.find((x) => x.id === id)!;
  await kaydet({ ...durum, kisiler: durum.kisiler.filter((x) => x.id !== id) });
  denetimYaz({ eylem: 'silme', tablo: 'ekip', kayitId: id, ozet: kisiEtiket(k) });
}
