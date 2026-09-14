import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'sy_is_plani_v1';

export type IsPlaniTur = 'kirpim' | 'tartim' | 'kuzu-alim' | 'kuzu-satim';

export type IsPlaniKaydi = {
  id: string;
  tur: IsPlaniTur;
  /** YYYY-MM-DD */
  tarih: string;
  not: string;
  /** Kuzu alım/satım adedi (opsiyonel) */
  adet: number | null;
  padok: string;
  tamam: boolean;
  createdAt: string;
};

export type IsPlaniTurMeta = {
  id: IsPlaniTur;
  label: string;
  icon: string;
  href: string;
  placeholder: string;
};

export const IS_PLANI_TURLER: IsPlaniTurMeta[] = [
  {
    id: 'kirpim',
    label: 'Kuzu kırpımı',
    icon: '✂️',
    href: '/(tabs)/suru',
    placeholder: 'Kaç kuzu, hangi padok?',
  },
  {
    id: 'tartim',
    label: 'Tartım',
    icon: '⚖️',
    href: '/(tabs)/suru',
    placeholder: 'Tüm sürü mü, padok mu?',
  },
  {
    id: 'kuzu-alim',
    label: 'Kuzu alımı',
    icon: '🛒',
    href: '/hayvan/ekle',
    placeholder: 'Kaç kuzu, nereden?',
  },
  {
    id: 'kuzu-satim',
    label: 'Kuzu satımı',
    icon: '💰',
    href: '/(tabs)/suru',
    placeholder: 'Kaç kuzu, pazar / kesim?',
  },
];

export const IS_PLANI_META = Object.fromEntries(IS_PLANI_TURLER.map((t) => [t.id, t])) as Record<
  IsPlaniTur,
  IsPlaniTurMeta
>;

async function oku(): Promise<IsPlaniKaydi[]> {
  const raw = await kaliciGetItem(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as IsPlaniKaydi[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function yaz(list: IsPlaniKaydi[]): Promise<void> {
  await kaliciSetItem(KEY, JSON.stringify(list));
}

export async function getIsPlaniKayitlari(): Promise<IsPlaniKaydi[]> {
  return (await oku())
    .filter((k) => !k.tamam)
    .sort((a, b) => a.tarih.localeCompare(b.tarih) || b.createdAt.localeCompare(a.createdAt));
}

export async function getTumIsPlaniKayitlari(): Promise<IsPlaniKaydi[]> {
  return (await oku()).sort((a, b) => a.tarih.localeCompare(b.tarih) || b.createdAt.localeCompare(a.createdAt));
}

export async function addIsPlaniKaydi(
  input: Omit<IsPlaniKaydi, 'id' | 'createdAt' | 'tamam'>
): Promise<IsPlaniKaydi> {
  const kayit: IsPlaniKaydi = {
    ...input,
    id: uuidv4(),
    not: input.not.trim(),
    padok: input.padok.trim(),
    adet: input.adet ?? null,
    tamam: false,
    createdAt: new Date().toISOString(),
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(kayit.tarih)) {
    kayit.tarih = new Date().toISOString().slice(0, 10);
  }
  const list = await oku();
  list.unshift(kayit);
  await yaz(list);
  return kayit;
}

export async function setIsPlaniTamam(id: string, tamam: boolean): Promise<void> {
  const list = await oku();
  const idx = list.findIndex((k) => k.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], tamam };
  await yaz(list);
}

export async function silIsPlaniKaydi(id: string): Promise<void> {
  await yaz((await oku()).filter((k) => k.id !== id));
}

export function isPlaniAciklama(k: IsPlaniKaydi): string {
  const parcalar: string[] = [];
  if (k.adet != null && k.adet > 0) parcalar.push(`${k.adet} adet`);
  if (k.padok) parcalar.push(k.padok);
  if (k.not) parcalar.push(k.not);
  return parcalar.length ? parcalar.join(' · ') : 'Detay eklenmedi';
}

export function isPlaniKalanGun(tarih: string, bugun = new Date().toISOString().slice(0, 10)): number {
  const a = new Date(tarih + 'T12:00:00').getTime();
  const b = new Date(bugun + 'T12:00:00').getTime();
  return Math.round((a - b) / 86400000);
}
