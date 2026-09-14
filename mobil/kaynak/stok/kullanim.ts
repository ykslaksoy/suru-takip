import { kaliciGetItem, kaliciSetItem, kaliciRemoveItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { getStockItems, getStockMovements } from '@/kaynak/cekirdek/veritabani';
import type { StockItem, StockType } from '@/kaynak/cekirdek/tipler';
import {
  katalogAdNormalize,
  katalogByType,
  katalogEsles,
  type StokKatalogKalemi,
} from './katalog';

const KEY = 'sy_stok_katalog_kullanim';

export type StokListeSatiri = {
  key: string;
  katalogId: string | null;
  ad: string;
  type: StockType;
  birim: string;
  minMiktar: number;
  aciklama: string;
  /** Kayıtlı stok kalemi (yoksa henüz eklenmemiş) */
  item: StockItem | null;
  kullanim: number;
};

async function readKullanim(): Promise<Record<string, number>> {
  const raw = await kaliciGetItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

async function writeKullanim(map: Record<string, number>): Promise<void> {
  await kaliciSetItem(KEY, JSON.stringify(map));
}

export async function clearKatalogKullanim(): Promise<void> {
  await kaliciRemoveItem(KEY);
}

/** Katalogdan seçim / stok çıkışı → kullanım artar */
export async function kaydetKatalogKullanim(katalogIdOrAd: string, delta = 1): Promise<void> {
  const map = await readKullanim();
  const eslesen = katalogEsles(katalogIdOrAd);
  const key = eslesen?.id ?? katalogAdNormalize(katalogIdOrAd);
  map[key] = (map[key] ?? 0) + delta;
  await writeKullanim(map);
}

/**
 * Kullanım skoru: katalog tıklamaları + stok çıkış hareketleri (miktar ağırlıklı).
 */
export async function getKullanimSkorlari(): Promise<Record<string, number>> {
  const map = await readKullanim();
  const [items, movements] = await Promise.all([getStockItems(), getStockMovements()]);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  for (const m of movements) {
    if (m.movementType !== 'out') continue;
    const item = byId[m.stockId];
    if (!item) continue;
    const eslesen = katalogEsles(item.name);
    const key = eslesen?.id ?? katalogAdNormalize(item.name);
    map[key] = (map[key] ?? 0) + Math.max(1, Math.round(m.quantity));
  }
  return map;
}

function skor(map: Record<string, number>, kalem: StokKatalogKalemi | { ad: string; id?: string }): number {
  if (kalem.id && map[kalem.id] != null) return map[kalem.id];
  return map[katalogAdNormalize(kalem.ad)] ?? 0;
}

/** Tam katalog listesi — kullanımına göre üstte; stok kaydı birleştirilir */
export async function getSiraliStokListesi(type?: StockType | 'all'): Promise<StokListeSatiri[]> {
  const [katalog, items, kullanim] = await Promise.all([
    Promise.resolve(katalogByType(type)),
    getStockItems(type && type !== 'all' ? type : undefined),
    getKullanimSkorlari(),
  ]);

  const kullanilanAdlar = new Set<string>();
  const satirlar: StokListeSatiri[] = [];

  for (const k of katalog) {
    const n = katalogAdNormalize(k.ad);
    const item =
      items.find((i) => katalogAdNormalize(i.name) === n) ??
      items.find((i) => katalogAdNormalize(i.name).includes(n) || n.includes(katalogAdNormalize(i.name))) ??
      null;
    if (item) kullanilanAdlar.add(item.id);
    satirlar.push({
      key: k.id,
      katalogId: k.id,
      ad: k.ad,
      type: k.type,
      birim: k.birim,
      minMiktar: k.minMiktar,
      aciklama: k.aciklama,
      item,
      kullanim: skor(kullanim, k),
    });
  }

  // Katalogda olmayan özel stoklar
  for (const item of items) {
    if (kullanilanAdlar.has(item.id)) continue;
    if (type && type !== 'all' && item.type !== type) continue;
    satirlar.push({
      key: `custom-${item.id}`,
      katalogId: null,
      ad: item.name,
      type: item.type,
      birim: item.unit,
      minMiktar: item.minQuantity,
      aciklama: item.notes || 'Özel kalem',
      item,
      kullanim: skor(kullanim, { ad: item.name }),
    });
  }

  satirlar.sort((a, b) => {
    if (b.kullanim !== a.kullanim) return b.kullanim - a.kullanim;
    // Stokta olanlar aynı skorda biraz öne
    if (!!b.item !== !!a.item) return a.item ? -1 : 1;
    return a.ad.localeCompare(b.ad, 'tr');
  });

  return satirlar;
}

export function siralaKatalog(
  liste: StokKatalogKalemi[],
  kullanim: Record<string, number>
): StokKatalogKalemi[] {
  return [...liste].sort((a, b) => {
    const da = skor(kullanim, a);
    const db = skor(kullanim, b);
    if (db !== da) return db - da;
    return a.ad.localeCompare(b.ad, 'tr');
  });
}
