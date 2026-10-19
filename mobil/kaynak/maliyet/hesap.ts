/**
 * Besi maliyet ve kâr — saf hesap (parti = padok).
 * Alış: hayvan bazlı alış fiyatı (girilmişse) yoksa parti baş fiyatı, yoksa hayvan notundaki "Alım 9.000 ₺".
 * Yem: yem stok çıkışları × son birim alış fiyatı; çıkış notunda padok adı varsa o partiye, yoksa baş sayısına göre paylaştırılır.
 * İlaç/aşı: yem dışı stok çıkışları × birim fiyat; notta küpe geçiyorsa o kuzunun partisine, yoksa baş sayısına göre.
 */
import type { Animal, StockItem, StockMovement } from '@/kaynak/cekirdek/tipler';

export type PartiAyar = { alisBasFiyat?: number; satisKgFiyat?: number; gercekSatisTutar?: number };
export type MaliyetAyar = { partiler: Record<string, PartiAyar>; hayvanAlis: Record<string, number> };

export type PartiMaliyet = {
  parti: string;
  bas: number;
  alis: number;
  alisEksikBas: number;
  yem: number;
  ilac: number;
  toplam: number;
  basBasi: number | null;
  toplamKg: number;
  kgBasi: number | null;
  tahminiSatis: number | null;
  tahminiKar: number | null;
  gercekSatis: number | null;
  gercekKar: number | null;
};

/** "Alım 9.000 ₺" / "Alım tartımı · 9000 ₺" → 9000 */
export function nottanAlisFiyati(not: string): number | null {
  const m = not.match(/Al[ıi]m[^0-9₺]{0,20}([\d.,]+)\s*₺/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function yuvarla(n: number): number {
  return Math.round(n);
}

export function partiMaliyetleri(opts: {
  animals: Animal[];
  sonKg: Record<string, number | null>;
  alimNotlari?: Record<string, string>;
  items: StockItem[];
  movements: StockMovement[];
  fiyatlar: Record<string, number>;
  ayar: MaliyetAyar;
}): PartiMaliyet[] {
  const aktif = opts.animals.filter((a) => a.status !== 'dead' && a.paddock);
  const partiAdlari = [...new Set(aktif.map((a) => a.paddock))].sort((a, b) => a.localeCompare(b, 'tr'));
  const basSayisi: Record<string, number> = {};
  for (const a of aktif) basSayisi[a.paddock] = (basSayisi[a.paddock] ?? 0) + 1;
  const toplamBas = aktif.length || 1;
  const itemById = new Map(opts.items.map((i) => [i.id, i]));

  const yem: Record<string, number> = {};
  const ilac: Record<string, number> = {};
  const paylastir = (hedef: Record<string, number>, tutar: number) => {
    for (const p of partiAdlari) hedef[p] = (hedef[p] ?? 0) + (tutar * (basSayisi[p] ?? 0)) / toplamBas;
  };
  for (const m of opts.movements) {
    if (m.movementType !== 'out') continue;
    const item = itemById.get(m.stockId);
    const fiyat = opts.fiyatlar[m.stockId];
    if (!item || !fiyat) continue;
    const tutar = m.quantity * fiyat;
    const not = (m.notes ?? '').toLocaleLowerCase('tr-TR');
    if (item.type === 'feed') {
      const p = partiAdlari.find((x) => not.includes(x.toLocaleLowerCase('tr-TR')));
      if (p) yem[p] = (yem[p] ?? 0) + tutar;
      else paylastir(yem, tutar);
    } else {
      const a = aktif.find((x) => x.earTag && not.includes(x.earTag.toLocaleLowerCase('tr-TR')));
      if (a) ilac[a.paddock] = (ilac[a.paddock] ?? 0) + tutar;
      else paylastir(ilac, tutar);
    }
  }

  return partiAdlari.map((p) => {
    const hayvanlar = aktif.filter((a) => a.paddock === p);
    const pa = opts.ayar.partiler[p] ?? {};
    let alis = 0;
    let alisEksikBas = 0;
    let toplamKg = 0;
    for (const a of hayvanlar) {
      const f =
        opts.ayar.hayvanAlis[a.id] ??
        pa.alisBasFiyat ??
        nottanAlisFiyati(`${a.notes} ${opts.alimNotlari?.[a.id] ?? ''}`);
      if (f != null) alis += f;
      else alisEksikBas += 1;
      if (a.status !== 'sold') toplamKg += opts.sonKg[a.id] ?? 0;
    }
    const toplam = alis + (yem[p] ?? 0) + (ilac[p] ?? 0);
    const tahminiSatis = pa.satisKgFiyat && toplamKg ? toplamKg * pa.satisKgFiyat : null;
    const gercekSatis = pa.gercekSatisTutar ?? null;
    return {
      parti: p,
      bas: hayvanlar.length,
      alis: yuvarla(alis),
      alisEksikBas,
      yem: yuvarla(yem[p] ?? 0),
      ilac: yuvarla(ilac[p] ?? 0),
      toplam: yuvarla(toplam),
      basBasi: hayvanlar.length ? yuvarla(toplam / hayvanlar.length) : null,
      toplamKg: Math.round(toplamKg * 10) / 10,
      kgBasi: toplamKg ? Math.round((toplam / toplamKg) * 10) / 10 : null,
      tahminiSatis: tahminiSatis == null ? null : yuvarla(tahminiSatis),
      tahminiKar: tahminiSatis == null ? null : yuvarla(tahminiSatis - toplam),
      gercekSatis,
      gercekKar: gercekSatis == null ? null : yuvarla(gercekSatis - toplam),
    };
  });
}

export function tl(n: number | null): string {
  if (n == null) return '—';
  return `${n.toLocaleString('tr-TR')} ₺`;
}
