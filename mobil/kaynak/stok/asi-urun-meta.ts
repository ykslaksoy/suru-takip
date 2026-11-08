/**
 * Fiziksel aşı ürünü meta — etiketten elle girilir; uydurma marka/kapsam yok.
 * Katalog satırı = şablon (karma, klostridiyal grubu); stok kalemi = partili ürün.
 */
import type { StockItem } from '@/kaynak/cekirdek/tipler';

export type MetaKaynak = 'bilinmiyor' | 'etiket_manuel';

export type AsiStokMeta = {
  v: 1;
  /** Katalog şablon id (karma, clostridial) — ürün kimliği değil */
  sablonKatalogId: string | null;
  marka: string | null;
  urunAdi: string | null;
  etiketKapsam: string | null;
  etiketKapsamKaynak: MetaKaynak;
  siseHacim: number | null;
  siseHacimBirim: string | null;
  partiLot: string | null;
  etiketDoz: string | null;
  etiketDozKaynak: MetaKaynak;
  etiketUygunluk: string | null;
};

const META_PREFIX = '\x1esy_asi_v1:';

const BOS: AsiStokMeta = {
  v: 1,
  sablonKatalogId: null,
  marka: null,
  urunAdi: null,
  etiketKapsam: null,
  etiketKapsamKaynak: 'bilinmiyor',
  siseHacim: null,
  siseHacimBirim: null,
  partiLot: null,
  etiketDoz: null,
  etiketDozKaynak: 'bilinmiyor',
  etiketUygunluk: null,
};

export function bosAsiStokMeta(sablonKatalogId: string | null = null): AsiStokMeta {
  return { ...BOS, sablonKatalogId };
}

export function asiMetaOku(item: Pick<StockItem, 'notes' | 'type'>): AsiStokMeta | null {
  if (item.type !== 'vaccine') return null;
  const raw = item.notes ?? '';
  const ix = raw.indexOf(META_PREFIX);
  if (ix < 0) return null;
  const json = raw.slice(ix + META_PREFIX.length).split('\n')[0];
  try {
    const p = JSON.parse(json) as AsiStokMeta;
    if (p?.v !== 1) return null;
    return p;
  } catch {
    return null;
  }
}

export function kullaniciNotuAyikla(notes: string): string {
  const ix = notes.indexOf(META_PREFIX);
  if (ix < 0) return notes.trim();
  const after = notes.slice(ix);
  const nl = after.indexOf('\n');
  if (nl < 0) return notes.slice(0, ix).trim();
  return (notes.slice(0, ix) + after.slice(nl + 1)).trim();
}

export function asiMetaYaz(notes: string, meta: AsiStokMeta | null): string {
  const kullanici = kullaniciNotuAyikla(notes);
  if (!meta) return kullanici;
  const satir = `${META_PREFIX}${JSON.stringify(meta)}`;
  return kullanici ? `${kullanici}\n${satir}` : satir;
}

/** Şablon satırına bağlı markalı/partili ürün — katalog placeholder değil */
export function markaliAsiUrunuMu(item: Pick<StockItem, 'notes' | 'type' | 'name'>): boolean {
  const m = asiMetaOku(item);
  if (!m) return false;
  return Boolean(m.marka?.trim() || m.urunAdi?.trim() || m.partiLot?.trim());
}

export function stokGorunenAd(item: Pick<StockItem, 'name' | 'notes' | 'type'>): string {
  const m = asiMetaOku(item);
  if (!m) return item.name;
  const parca = [m.marka, m.urunAdi].filter((x) => x?.trim()).join(' · ');
  if (parca) return m.partiLot ? `${parca} (Lot ${m.partiLot})` : parca;
  return item.name;
}

export function asiUrunDogrula(meta: AsiStokMeta, unit: string): { uyari: string[]; etiketEksik: boolean } {
  const uyari: string[] = [];
  if (!meta.marka?.trim() && !meta.urunAdi?.trim()) {
    uyari.push('Marka veya ürün adı girilmedi — fiziksel ürün etiketiyle eşleşmeyebilir.');
  }
  if (meta.etiketKapsamKaynak === 'bilinmiyor' && !meta.etiketKapsam?.trim()) {
    uyari.push('Etiket kapsam/antijen bilinmiyor — otomatik denklik yapılmaz.');
  }
  if (meta.etiketDozKaynak === 'bilinmiyor' && !meta.etiketDoz?.trim()) {
    uyari.push('Etiket dozu/uygulama bilinmiyor — program varsayılan dozu kullanılmaz.');
  }
  if (meta.siseHacim != null && meta.siseHacim <= 0) uyari.push('Şişe hacmi geçersiz.');
  if (meta.siseHacim != null && !meta.siseHacimBirim?.trim()) uyari.push('Şişe hacim birimi girilmedi.');
  if (unit !== 'doz' && unit !== 'ml' && unit !== 'adet') {
    uyari.push(`Birim "${unit}" — partide doz/ml ile izleme için doz veya ml önerilir.`);
  }
  const etiketEksik = meta.etiketDozKaynak === 'bilinmiyor' && !meta.etiketDoz?.trim();
  return { uyari, etiketEksik };
}

export function asiSaglikStokIzNotu(opts: {
  stockId: string;
  partiLot: string | null;
  miktar: number;
  birim: string;
  urunAd: string;
}): string {
  return [
    `stok:${opts.stockId}`,
    opts.partiLot ? `lot:${opts.partiLot}` : 'lot:?',
    `miktar:${opts.miktar} ${opts.birim}`,
    `urun:${opts.urunAd}`,
  ].join(';');
}

/** Aynı plan/hayvan için çift düşüm notu */
export function asiHareketIzAnahtar(planVeyaRef: string, stockId: string, partiLot: string | null): string {
  return `asi_ref:${planVeyaRef};stok:${stockId};lot:${partiLot ?? '-'}`;
}

export function hareketIzAnahtarVar(notes: string, anahtar: string): boolean {
  return notes.includes(anahtar);
}

export function asiStokDusumPlanla(
  mevcutMiktar: number,
  gereken: number,
  hareketNotlari: string[],
  izAnahtar: string,
): { dusulecek: number; ciftSayim: boolean; eksik: number } {
  if (hareketIzAnahtarVar(hareketNotlari.join('|'), izAnahtar)) {
    return { dusulecek: 0, ciftSayim: true, eksik: 0 };
  }
  if (mevcutMiktar <= 0) return { dusulecek: 0, ciftSayim: false, eksik: gereken };
  const dusulecek = Math.min(gereken, mevcutMiktar);
  return { dusulecek, ciftSayim: false, eksik: Math.max(0, gereken - dusulecek) };
}

export function sablonKatalogEslesir(meta: AsiStokMeta | null, programId: string, stokAdi: string, anahtarlar: string[]): boolean {
  if (meta?.sablonKatalogId === programId) return true;
  const n = stokAdi.toLocaleLowerCase('tr-TR');
  return anahtarlar.some((k) => n.includes(k.toLocaleLowerCase('tr-TR')));
}

/** Çoklu parti: tek partiden düş — SKT en yakın (deterministik) */
export function asiPartiSec(adaylar: StockItem[]): StockItem | null {
  if (!adaylar.length) return null;
  return [...adaylar].sort((a, b) => {
    const ea = a.expiryDate ?? '9999-12-31';
    const eb = b.expiryDate ?? '9999-12-31';
    if (ea !== eb) return ea.localeCompare(eb);
    return a.id.localeCompare(b.id);
  })[0];
}

export function asiDozEtiketiStok(
  programDozHayvan: number,
  item: StockItem | null,
): { birimDoz: number; etiket: string; bilinmiyor: boolean } {
  const m = item ? asiMetaOku(item) : null;
  if (m?.etiketDozKaynak === 'etiket_manuel' && m.etiketDoz?.trim()) {
    return { birimDoz: programDozHayvan, etiket: m.etiketDoz.trim(), bilinmiyor: false };
  }
  if (m?.etiketDozKaynak === 'bilinmiyor') {
    return { birimDoz: programDozHayvan, etiket: 'Etiket dozu girilmedi', bilinmiyor: true };
  }
  return { birimDoz: programDozHayvan, etiket: `Program dozu (etiket yok) · ${programDozHayvan} birim/hayvan`, bilinmiyor: false };
}

/** Eski kayıtlar — meta yok */
export function legacyAsiStokMu(item: StockItem): boolean {
  return item.type === 'vaccine' && !asiMetaOku(item);
}

export function asiStokAdaylari(programId: string, anahtarlar: string[], stock: StockItem[]): StockItem[] {
  return stock.filter((s) => {
    if (s.type !== 'vaccine') return false;
    if (s.quantity <= 0) return false;
    return sablonKatalogEslesir(asiMetaOku(s), programId, s.name, anahtarlar);
  });
}
