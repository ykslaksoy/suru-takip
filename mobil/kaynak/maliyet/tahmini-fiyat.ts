/**
 * Fiyat çözümü — saf mantık (test edilebilir).
 * Sıra: kullanıcının girdiği gerçek fiyat → referans tablodan tahmini fiyat → yok.
 * Tahmini fiyat onay beklemeden maliyete girer; kullanıcı istediği an gerçek fiyatla değiştirir.
 */
import type { StockItem } from '@/kaynak/cekirdek/tipler';
import { katalogAdNormalize, katalogEsles } from '@/kaynak/stok/katalog';
import { CANLI_KUZU_KG, FIYAT_REFERANS, type ReferansFiyat } from './fiyat-referans';

export type FiyatTur = 'gercek' | 'tahmini' | 'yok';

export type FiyatDurum = {
  stockId: string;
  ad: string;
  birim: string;
  tur: FiyatTur;
  /** TL / stok birimi */
  fiyat: number | null;
  ref: ReferansFiyat | null;
};

const BIRIM_ESLESME: Record<string, string> = {
  kilo: 'kg',
  kilogram: 'kg',
  kg: 'kg',
  ton: 'ton',
  g: 'g',
  gr: 'g',
  gram: 'g',
  ml: 'ml',
  lt: 'lt',
  l: 'lt',
  litre: 'lt',
  doz: 'doz',
  adet: 'adet',
  flakon: 'flakon',
};

function birimNorm(b: string): string {
  const n = katalogAdNormalize(b).replace(/\./g, '');
  return BIRIM_ESLESME[n] ?? n;
}

/** Referans birimini stok birimine çevir (kg↔ton↔g, ml↔lt). Uyumsuzsa null. */
export function birimCevir(fiyat: number, refBirim: string, stokBirim: string): number | null {
  const a = birimNorm(refBirim);
  const b = birimNorm(stokBirim);
  if (a === b) return fiyat;
  const kat: Record<string, Record<string, number>> = {
    kg: { ton: 1000, g: 0.001 },
    ton: { kg: 0.001, g: 0.000001 },
    g: { kg: 1000, ton: 1000000 },
    ml: { lt: 1000 },
    lt: { ml: 0.001 },
  };
  const k = kat[a]?.[b];
  return k == null ? null : Math.round(fiyat * k * 10000) / 10000;
}

/** Stok kalemine uyan referans satırı (katalog id → ad → anahtar kelime). */
export function referansBul(ad: string, tablo: ReferansFiyat[] = FIYAT_REFERANS): ReferansFiyat | null {
  const kat = katalogEsles(ad);
  if (kat) {
    const byId = tablo.find((t) => t.id === kat.id);
    if (byId) return byId;
  }
  const n = katalogAdNormalize(ad);
  const byAd = tablo.find((t) => katalogAdNormalize(t.ad) === n);
  if (byAd) return byAd;
  let enIyi: { t: ReferansFiyat; uz: number } | null = null;
  for (const t of tablo) {
    for (const a of t.anahtarlar ?? []) {
      const an = katalogAdNormalize(a);
      if (an.length >= 3 && n.includes(an) && (!enIyi || an.length > enIyi.uz)) enIyi = { t, uz: an.length };
    }
  }
  return enIyi?.t ?? null;
}

export function birimFiyatCoz(
  item: Pick<StockItem, 'id' | 'name' | 'unit'>,
  gercek: Record<string, number>,
  tablo: ReferansFiyat[] = FIYAT_REFERANS,
): FiyatDurum {
  const g = gercek[item.id];
  const ref = referansBul(item.name, tablo);
  if (g != null && Number.isFinite(g) && g > 0) {
    return { stockId: item.id, ad: item.name, birim: item.unit, tur: 'gercek', fiyat: g, ref };
  }
  if (ref?.fiyat != null) {
    const f = birimCevir(ref.fiyat, ref.birim, item.unit);
    if (f != null) return { stockId: item.id, ad: item.name, birim: item.unit, tur: 'tahmini', fiyat: f, ref };
  }
  return { stockId: item.id, ad: item.name, birim: item.unit, tur: 'yok', fiyat: null, ref };
}

/** Maliyette kullanılacak fiyatlar (gerçek + tahmini) ve kalem bazında durum. */
export function etkinFiyatlar(
  items: Pick<StockItem, 'id' | 'name' | 'unit'>[],
  gercek: Record<string, number>,
  tablo: ReferansFiyat[] = FIYAT_REFERANS,
): { fiyatlar: Record<string, number>; durumlar: FiyatDurum[] } {
  const fiyatlar: Record<string, number> = {};
  const durumlar = items.map((it) => birimFiyatCoz(it, gercek, tablo));
  for (const d of durumlar) if (d.fiyat != null) fiyatlar[d.stockId] = d.fiyat;
  return { fiyatlar, durumlar };
}

/** Önerilen değer metni (yer tutucu): "15,03" */
export function oneriMetni(d: Pick<FiyatDurum, 'ref' | 'birim'>): string {
  if (!d.ref?.fiyat) return '';
  const f = birimCevir(d.ref.fiyat, d.ref.birim, d.birim);
  return f == null ? '' : f.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

/** Alış fiyatı yoksa: canlı kuzu ₺/kg × ilk tartım kg (tartım yoksa tahmin yok). */
export function alisTahmini(ilkKg: number | null | undefined, ref: ReferansFiyat = CANLI_KUZU_KG): number | null {
  if (!ilkKg || ilkKg <= 0 || ref.fiyat == null) return null;
  return Math.round(ilkKg * ref.fiyat);
}

/** Kullanıcı metninden fiyat: "1.250,5" → 1250.5; boş/geçersiz → null */
export function fiyatMetniOku(metin: string): number | null {
  const t = metin.trim();
  if (!t) return null;
  const n = parseFloat(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
  return Number.isFinite(n) && n > 0 ? n : null;
}
