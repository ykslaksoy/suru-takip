import { v4 as uuidv4 } from 'uuid';
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { sayiCoz, tarihCoz, type PoliceGirdi, type SigortaPolice } from './hesap';

const KEY = 'sy_sigorta_policeler_v1';

export async function getPoliceler(): Promise<SigortaPolice[]> {
  const raw = await kaliciGetItem(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as SigortaPolice[];
    return Array.isArray(list) ? list.sort((a, b) => b.bitis.localeCompare(a.bitis)) : [];
  } catch {
    return [];
  }
}

async function yaz(list: SigortaPolice[]): Promise<void> {
  await kaliciSetItem(KEY, JSON.stringify(list));
}

/** Doğrulanmış girdiyi kaydeder (policeDogrula önce çağrılmalı) */
export async function policeEkle(g: PoliceGirdi): Promise<SigortaPolice> {
  const prim = g.prim?.trim() ? sayiCoz(g.prim) : null;
  const p: SigortaPolice = {
    id: uuidv4(),
    policeNo: g.policeNo.trim(),
    sirket: g.sirket?.trim() || undefined,
    baslangic: tarihCoz(g.baslangic)!,
    bitis: tarihCoz(g.bitis)!,
    prim: prim != null && prim > 0 ? prim : undefined,
    hayvanIds: [...new Set(g.hayvanIds)],
    createdAt: new Date().toISOString(),
  };
  const list = await getPoliceler();
  await yaz([...list, p]);
  return p;
}

export async function policeSil(id: string): Promise<void> {
  const list = await getPoliceler();
  await yaz(list.filter((p) => p.id !== id));
}

/** Geri dönüşüm kutusundan geri yükle (aynı id) */
export async function policeGeriYukle(p: SigortaPolice): Promise<void> {
  const list = await getPoliceler();
  await yaz([...list.filter((x) => x.id !== p.id), p]);
}
