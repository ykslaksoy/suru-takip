import { v4 as uuidv4 } from 'uuid';
import { kaliciGetItem, kaliciRemoveItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import type { SayimGecmisKaydi, SayimKapsam, SayimOturumu } from './hesap';

const AKTIF = 'sy_sayim_aktif_v1';
const GECMIS = 'sy_sayim_gecmis_v1';

function oku<T>(raw: string | null, bos: T): T {
  if (!raw) return bos;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return bos;
  }
}

/** Yarım kalan sayım (ekrandan çıkınca kaybolmasın) */
export async function getAktifSayim(): Promise<SayimOturumu | null> {
  return oku<SayimOturumu | null>(await kaliciGetItem(AKTIF), null);
}

export async function sayimBaslat(kapsam: SayimKapsam): Promise<SayimOturumu> {
  const o: SayimOturumu = { id: uuidv4(), kapsam, baslangic: new Date().toISOString(), sayilan: [] };
  await kaliciSetItem(AKTIF, JSON.stringify(o));
  return o;
}

export async function aktifSayimKaydet(o: SayimOturumu): Promise<void> {
  await kaliciSetItem(AKTIF, JSON.stringify(o));
}

export async function aktifSayimSil(): Promise<void> {
  await kaliciRemoveItem(AKTIF);
}

export async function getSayimGecmisi(): Promise<SayimGecmisKaydi[]> {
  const list = oku<SayimGecmisKaydi[]>(await kaliciGetItem(GECMIS), []);
  return Array.isArray(list) ? list.sort((a, b) => b.bitis.localeCompare(a.bitis)) : [];
}

export async function sayimGecmiseEkle(k: SayimGecmisKaydi): Promise<void> {
  const list = await getSayimGecmisi();
  await kaliciSetItem(GECMIS, JSON.stringify([k, ...list.filter((x) => x.id !== k.id)].slice(0, 100)));
  await kaliciRemoveItem(AKTIF);
}
