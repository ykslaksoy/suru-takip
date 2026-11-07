import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { v4 as uuidv4 } from 'uuid';
import { uyumKayitDogrula, type UyumBeslemeKayit } from './uyum-besleme';

const KEY = 'sy_uyum_besleme_v1';

async function oku(): Promise<UyumBeslemeKayit[]> {
  const raw = await kaliciGetItem(KEY);
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as UyumBeslemeKayit[]) : [];
  } catch {
    return [];
  }
}

async function yaz(v: UyumBeslemeKayit[]): Promise<void> {
  await kaliciSetItem(KEY, JSON.stringify(v));
}

export async function uyumKayitlariniOku(): Promise<UyumBeslemeKayit[]> {
  return oku();
}

/** Yalnız kullanıcı kaydettiğinde yazar; gözlem padokuna otomatik atama yok */
export async function uyumKaydet(
  g: Omit<UyumBeslemeKayit, 'id' | 'kayitZaman'> & { id?: string },
): Promise<UyumBeslemeKayit> {
  const hata = uyumKayitDogrula(g);
  if (hata) throw new Error(hata);
  const l = await oku();
  const kayit: UyumBeslemeKayit = {
    id: g.id ?? uuidv4(),
    padok: g.padok.trim(),
    rasyonId: g.rasyonId,
    baslangic: g.baslangic,
    gunSayisi: g.gunSayisi,
    kayitZaman: new Date().toISOString(),
    gozlem: g.gozlem,
    incelemeOnay: g.incelemeOnay,
  };
  await yaz([kayit, ...l.filter((x) => x.id !== kayit.id)]);
  return kayit;
}

export async function uyumIncelemeKaydet(
  id: string,
  gozlem: UyumBeslemeKayit['gozlem'],
  incelemeOnay: boolean,
): Promise<UyumBeslemeKayit | null> {
  const l = await oku();
  const i = l.findIndex((x) => x.id === id);
  if (i < 0) return null;
  const yeni = {
    ...l[i],
    gozlem: { ...gozlem, onayZaman: incelemeOnay ? new Date().toISOString() : undefined },
    incelemeOnay,
  };
  l[i] = yeni;
  await yaz(l);
  return yeni;
}
