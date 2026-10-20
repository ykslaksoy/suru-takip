/** Uygulama geneli işlem günlüğü + çöp kutusu (yerel cihaz) */
import { yetkiGerekli } from '@/kaynak/ekip/kapi';
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import type { CopKaydi, Islem } from './tipler';
import { copSuresiDolanlar } from './cop';

const KEY_GUNLUK = 'sy_islem_gunlugu_v1';
const KEY_COP = 'sy_cop_kutusu_v1';
const MAKS = 500;
export const KIM_VARSAYILAN = 'Bu cihaz';

async function oku<T>(k: string): Promise<T[]> {
  const raw = await kaliciGetItem(k);
  if (!raw) return [];
  try {
    const l = JSON.parse(raw) as T[];
    return Array.isArray(l) ? l : [];
  } catch {
    return [];
  }
}

export async function getIslemler(): Promise<Islem[]> {
  return oku<Islem>(KEY_GUNLUK);
}

/** Günlüğe ekle — hata uygulamayı durdurmaz */
let kimAdi: () => string = () => KIM_VARSAYILAN;
/** Roller: aktif kullanıcı adı sağlayıcısı */
export function setGunlukKimSaglayici(f: () => string): void {
  kimAdi = f;
}
export function gunlukKim(): string {
  return kimAdi();
}

export async function islemKaydet(i: Omit<Islem, 'id' | 'zaman' | 'kim'> & { kim?: string }): Promise<void> {
  try {
    const l = await getIslemler();
    l.unshift({ ...i, kim: i.kim ?? kimAdi(), id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, zaman: new Date().toISOString() });
    await kaliciSetItem(KEY_GUNLUK, JSON.stringify(l.slice(0, MAKS)));
  } catch {
    /* günlük yazılamadı — kayıt yine geçerli */
  }
}

/** 30 günü dolanlar okurken kalıcı silinir */
export async function getCopKutusu(): Promise<CopKaydi[]> {
  const l = await oku<CopKaydi>(KEY_COP);
  const { kalan, dolan } = copSuresiDolanlar(l);
  if (dolan.length) await kaliciSetItem(KEY_COP, JSON.stringify(kalan));
  return kalan;
}

export async function copeAt(k: Omit<CopKaydi, 'silinme' | 'kim'> & { kim?: string }): Promise<void> {
  yetkiGerekli('silme');
  const l = await getCopKutusu();
  l.unshift({ ...k, kim: k.kim ?? kimAdi(), silinme: new Date().toISOString() });
  await kaliciSetItem(KEY_COP, JSON.stringify(l.slice(0, 500)));
}

export async function coptenCikar(id: string): Promise<CopKaydi | null> {
  const l = await getCopKutusu();
  const k = l.find((x) => x.id === id) ?? null;
  await kaliciSetItem(KEY_COP, JSON.stringify(l.filter((x) => x.id !== id)));
  return k;
}
