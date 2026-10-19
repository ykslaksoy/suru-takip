/** Uygulama geneli işlem günlüğü + çöp kutusu (yerel cihaz) */
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import type { CopKaydi, Islem } from './tipler';

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
export async function islemKaydet(i: Omit<Islem, 'id' | 'zaman' | 'kim'> & { kim?: string }): Promise<void> {
  try {
    const l = await getIslemler();
    l.unshift({ ...i, kim: i.kim ?? KIM_VARSAYILAN, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, zaman: new Date().toISOString() });
    await kaliciSetItem(KEY_GUNLUK, JSON.stringify(l.slice(0, MAKS)));
  } catch {
    /* günlük yazılamadı — kayıt yine geçerli */
  }
}

export async function getCopKutusu(): Promise<CopKaydi[]> {
  return oku<CopKaydi>(KEY_COP);
}

export async function copeAt(k: Omit<CopKaydi, 'silinme'>): Promise<void> {
  const l = await getCopKutusu();
  l.unshift({ ...k, silinme: new Date().toISOString() });
  await kaliciSetItem(KEY_COP, JSON.stringify(l.slice(0, 200)));
}

export async function coptenCikar(id: string): Promise<CopKaydi | null> {
  const l = await getCopKutusu();
  const k = l.find((x) => x.id === id) ?? null;
  await kaliciSetItem(KEY_COP, JSON.stringify(l.filter((x) => x.id !== id)));
  return k;
}
