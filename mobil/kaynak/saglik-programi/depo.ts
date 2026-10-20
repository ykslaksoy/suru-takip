/**
 * Sağlık programı kayıtları + mevcut sağlık planına aktarım.
 * Etkin program kendi planına (sy_saglik_plani_kendi_v1) ve zamanlamaya yazılır;
 * Görevler, alarmlar ve Takvim zaten bunları okuduğu için çift kayıt oluşmaz.
 */
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { getPlanZaman, saveKendiPlan, savePlanZaman } from '@/kaynak/gorevler/saglik-plani';
import { sablonYerlestir } from '@/kaynak/sablon/depo';
import {
  bosDuzenleme,
  etkinProgram,
  girisSablonAdimlari,
  plandanAktar,
  varsayilanProgram,
  type EtkinAdim,
  type ProgramDuzenleme,
  type UretimAyari,
} from './hesap';

const KEY_AYAR = 'sy_ciftlik_bolge_irk_v1';
const KEY_URETIM = 'sy_saglik_programi_uretim_v1';
const KEY_DUZ = 'sy_saglik_programi_duzenleme_v1';
const KEY_IDLER = 'sy_saglik_programi_idler_v1';
export const PROGRAM_SABLON_ID = 'sablon-saglik-programi-giris';

async function oku<T>(k: string): Promise<T | null> {
  const raw = await kaliciGetItem(k);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Çiftlik ayarı (bölge, il, ırk, parti ırkları) — modId ekranda aktif moddan gelir */
export async function getCiftlikAyar(): Promise<Omit<UretimAyari, 'modId'>> {
  return (await oku<Omit<UretimAyari, 'modId'>>(KEY_AYAR)) ?? { bolge: null, irk: null, partiIrk: {} };
}
export async function saveCiftlikAyar(a: Omit<UretimAyari, 'modId'>): Promise<void> {
  await kaliciSetItem(KEY_AYAR, JSON.stringify(a));
}

/** Programın üretildiği ayar (bölge/ırk değişince kullanıcı onayıyla güncellenir) */
export async function getUretimAyari(): Promise<UretimAyari | null> {
  return oku<UretimAyari>(KEY_URETIM);
}
export async function getDuzenleme(): Promise<ProgramDuzenleme> {
  const d = await oku<ProgramDuzenleme>(KEY_DUZ);
  return d ? { ...bosDuzenleme(), ...d } : bosDuzenleme();
}
export async function saveDuzenleme(d: ProgramDuzenleme): Promise<void> {
  await kaliciSetItem(KEY_DUZ, JSON.stringify(d));
}

/** Programı üret ve mevcut plana uygula. Kullanıcı düzenlemeleri korunur. */
export async function programUygula(u: UretimAyari, d: ProgramDuzenleme): Promise<EtkinAdim[]> {
  const adimlar = etkinProgram(varsayilanProgram(u), d);
  const { plan, zaman } = plandanAktar(adimlar);
  const [eskiZaman, eskiIdler] = await Promise.all([getPlanZaman(), oku<string[]>(KEY_IDLER)]);
  const yeniZaman = { ...eskiZaman };
  for (const id of eskiIdler ?? []) delete yeniZaman[id];
  Object.assign(yeniZaman, zaman);
  await Promise.all([
    kaliciSetItem(KEY_URETIM, JSON.stringify(u)),
    saveDuzenleme(d),
    saveKendiPlan(plan),
    savePlanZaman(yeniZaman),
    kaliciSetItem(KEY_IDLER, JSON.stringify(Object.keys(zaman))),
  ]);
  try {
    await sablonYerlestir({ id: PROGRAM_SABLON_ID, ad: 'Program: giriş günü', adimlar: girisSablonAdimlari(adimlar) as never });
  } catch {
    /* yetki yoksa şablon güncellenmez */
  }
  return adimlar;
}
