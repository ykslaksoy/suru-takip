import { v4 as uuidv4 } from 'uuid';
import { yetkiGerekli } from '@/kaynak/ekip/kapi';
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { adimlariTemizle, VARSAYILAN_SABLONLAR, type KayitSablonu, type SablonAdim } from './hesap';

const KEY = 'sy_kayit_sablonlari_v1';

export async function getSablonlar(): Promise<KayitSablonu[]> {
  const raw = await kaliciGetItem(KEY);
  if (raw == null) return VARSAYILAN_SABLONLAR.map((s) => ({ ...s, adimlar: [...s.adimlar] }));
  try {
    const l = JSON.parse(raw) as KayitSablonu[];
    return Array.isArray(l) ? l : [];
  } catch {
    return [];
  }
}

async function yaz(l: KayitSablonu[]): Promise<void> {
  await kaliciSetItem(KEY, JSON.stringify(l));
}

export async function sablonKaydet(g: { id?: string; ad: string; adimlar: SablonAdim[] }): Promise<KayitSablonu> {
  yetkiGerekli('duzenleme');
  const l = await getSablonlar();
  const now = new Date().toISOString();
  const eski = g.id ? l.find((s) => s.id === g.id) : undefined;
  const s: KayitSablonu = {
    id: eski?.id ?? uuidv4(),
    ad: g.ad.trim(),
    adimlar: adimlariTemizle(g.adimlar),
    varsayilan: eski?.varsayilan,
    createdAt: eski?.createdAt ?? now,
    updatedAt: now,
  };
  await yaz(eski ? l.map((x) => (x.id === s.id ? s : x)) : [...l, s]);
  return s;
}

export async function sablonSil(id: string): Promise<KayitSablonu | null> {
  const l = await getSablonlar();
  const s = l.find((x) => x.id === id) ?? null;
  await yaz(l.filter((x) => x.id !== id));
  return s;
}

export async function sablonGeriYukle(s: KayitSablonu): Promise<void> {
  const l = await getSablonlar();
  await yaz([...l.filter((x) => x.id !== s.id), s]);
}

/** Sabit id'li şablonu ekle/güncelle (ör. sağlık programından türetilen “Program: giriş günü”). */
export async function sablonYerlestir(g: { id: string; ad: string; adimlar: SablonAdim[] }): Promise<void> {
  const l = await getSablonlar();
  const now = new Date().toISOString();
  const eski = l.find((s) => s.id === g.id);
  const s: KayitSablonu = { id: g.id, ad: g.ad, adimlar: adimlariTemizle(g.adimlar), varsayilan: true, createdAt: eski?.createdAt ?? now, updatedAt: now };
  await yaz(eski ? l.map((x) => (x.id === g.id ? s : x)) : [...l, s]);
}
