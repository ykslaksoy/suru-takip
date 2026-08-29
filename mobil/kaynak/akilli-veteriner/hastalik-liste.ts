/**
 * Hastalık kataloğu + ilaç malzeme listesi.
 * Aşı listesi ile aynı mantık: ana isim (küçük detay) + ml doz.
 */

import type { StockItem } from '@/kaynak/cekirdek/tipler';
import { getStockItems } from '@/kaynak/cekirdek/veritabani';
import {
  formatMlTr,
  hesaplaDozFormul,
  hesaplaDozMetni,
  hesaplaToplamMl,
} from './doz-hesap';
import { getAktifTakipler } from './takip';
import { PROTOKOLLER, type IlacDoz } from './teshis';

/** Referans kuzu kilosu — katalog doz örneği. */
export const HASTALIK_REF_KG = 12;

export type HastalikIlacSatir = {
  id: string;
  /** Ana ad — çoban dili. */
  ilacAdi: string;
  /** Küçük parantez — uygulama tipi. */
  tipEtiket: string;
  tip: IlacDoz['tip'];
  doz: string;
  formul?: string;
  mlHayvan: number | null;
  siklik: string;
  uygulama: string;
  not?: string;
};

export type HastalikListeOgesi = {
  temaId: string;
  hastalikId: string;
  /** Ana ad — İshal */
  ad: string;
  /** Küçük parantez — Enterit */
  tibbiAd: string;
  aciklama: string;
  bulasici: boolean;
  karantina: boolean;
  etkiSuresiGun: number;
  baslangic: HastalikIlacSatir[];
  ileri: HastalikIlacSatir[];
  suru: HastalikIlacSatir[];
};

export type HastalikMalzemeSatir = {
  ilacAdi: string;
  tipEtiket: string;
  tip: IlacDoz['tip'];
  hayvanSayisi: number;
  mlHayvan: number | null;
  toplamMl: number | null;
  dozEtiket: string;
  siklik: string;
  teshisAdlari: string[];
  stokMiktar: number;
  stokAdi: string | null;
  eksikMl: number | null;
};

export type HastalikMalzemeListe = {
  aktifVaka: number;
  refKg: number;
  satirlar: HastalikMalzemeSatir[];
  toplamMl: number;
  siringaAdedi: number;
  ozet: string;
};

export function tipEtiket(tip: IlacDoz['tip']): string {
  if (tip === 'igne') return 'iğne';
  if (tip === 'asi') return 'aşı';
  if (tip === 'topikal') return 'dıştan';
  return 'ağızdan';
}

function normalize(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');
}

function stokBulIlac(ilacAdi: string, stock: StockItem[]): StockItem | null {
  const medicines = stock.filter((s) => s.type === 'medicine');
  const anahtar = normalize(ilacAdi).split(/[\s+/·,()-]+/).filter((w) => w.length > 3);
  const esles = (pool: StockItem[]) =>
    pool.find((s) => {
      const n = normalize(s.name);
      return anahtar.some((k) => n.includes(k)) || n.includes(normalize(ilacAdi).slice(0, 8));
    }) ?? null;
  return esles(medicines) ?? esles(stock);
}

function ilacSatir(ilac: IlacDoz, kg: number): HastalikIlacSatir {
  const ml = hesaplaToplamMl(ilac, kg);
  const formul = hesaplaDozFormul(ilac, kg) ?? undefined;
  return {
    id: ilac.id,
    ilacAdi: ilac.ilacAdi,
    tipEtiket: tipEtiket(ilac.tip),
    tip: ilac.tip,
    doz: hesaplaDozMetni(ilac, kg),
    formul,
    mlHayvan: ml,
    siklik: ilac.siklik,
    uygulama: ilac.uygulama,
    not: ilac.not,
  };
}

/** Tüm hastalık kataloğu — aşı programı gibi sabit liste. */
export function listeleHastaliklar(refKg = HASTALIK_REF_KG): HastalikListeOgesi[] {
  return (Object.keys(PROTOKOLLER) as Array<keyof typeof PROTOKOLLER>).map((temaId) => {
    const p = PROTOKOLLER[temaId];
    const suru = [...(p.suruBaslangic ?? []), ...(p.suruIleri ?? [])];
    return {
      temaId,
      hastalikId: p.id,
      ad: p.adTr,
      tibbiAd: p.tibbiAd,
      aciklama: p.aciklama,
      bulasici: p.bulasici,
      karantina: p.karantina,
      etkiSuresiGun: p.etkiSuresiGun,
      baslangic: p.baslangic.map((i) => ilacSatir(i, refKg)),
      ileri: p.ileri.map((i) => ilacSatir(i, refKg)),
      suru: suru.map((i) => ilacSatir(i, refKg)),
    };
  });
}

/**
 * Aktif takip vakalarından ilaç malzeme listesi.
 * Aynı ilaç birleştirilir; stokla karşılaştırılır.
 */
export async function olusturHastalikMalzemeListesi(
  refKg = HASTALIK_REF_KG,
): Promise<HastalikMalzemeListe> {
  const [aktif, stock] = await Promise.all([getAktifTakipler(), getStockItems()]);
  const map = new Map<string, HastalikMalzemeSatir & { _ilac: IlacDoz }>();

  for (const t of aktif) {
    const ilaclar = [...t.teshis.ilaclar, ...t.teshis.suruIlaclari];
    for (const ilac of ilaclar) {
      const key = normalize(ilac.ilacAdi);
      const ml = hesaplaToplamMl(ilac, refKg);
      const mevcut = map.get(key);
      if (mevcut) {
        mevcut.hayvanSayisi += 1;
        if (mevcut.mlHayvan != null) {
          mevcut.toplamMl = Math.round(mevcut.mlHayvan * mevcut.hayvanSayisi * 100) / 100;
          mevcut.dozEtiket = `${mevcut.hayvanSayisi} hayvan × ${formatMlTr(mevcut.mlHayvan)} ml = ${formatMlTr(mevcut.toplamMl)} ml`;
        }
        if (!mevcut.teshisAdlari.includes(t.teshis.hastalikAdiTr)) {
          mevcut.teshisAdlari.push(t.teshis.hastalikAdiTr);
        }
      } else {
        const stok = stokBulIlac(ilac.ilacAdi, stock);
        const toplamMl = ml;
        map.set(key, {
          ilacAdi: ilac.ilacAdi,
          tipEtiket: tipEtiket(ilac.tip),
          tip: ilac.tip,
          hayvanSayisi: 1,
          mlHayvan: ml,
          toplamMl,
          dozEtiket:
            ml != null
              ? `1 hayvan × ${formatMlTr(ml)} ml = ${formatMlTr(ml)} ml`
              : hesaplaDozMetni(ilac, refKg),
          siklik: ilac.siklik,
          teshisAdlari: [t.teshis.hastalikAdiTr],
          stokMiktar: stok?.quantity ?? 0,
          stokAdi: stok?.name ?? null,
          eksikMl: null,
          _ilac: ilac,
        });
      }
    }
  }

  const satirlar: HastalikMalzemeSatir[] = [...map.values()].map(({ _ilac, ...s }) => {
    let eksikMl: number | null = null;
    if (s.toplamMl != null && s.stokAdi) {
      // Stok birimi ml veya flakon — miktar ≈ kullanılabilir hacim varsayımı
      const kalan = s.stokMiktar - s.toplamMl;
      eksikMl = kalan < 0 ? Math.round(-kalan * 10) / 10 : 0;
    } else if (s.toplamMl != null && !s.stokAdi) {
      eksikMl = s.toplamMl;
    }
    return { ...s, eksikMl };
  });

  satirlar.sort((a, b) => a.ilacAdi.localeCompare(b.ilacAdi, 'tr'));
  const toplamMl =
    Math.round(satirlar.reduce((acc, s) => acc + (s.toplamMl ?? 0), 0) * 10) / 10;
  const siringaAdedi = satirlar
    .filter((s) => s.tip === 'igne' || s.tip === 'asi')
    .reduce((acc, s) => acc + s.hayvanSayisi, 0);

  const ozet =
    aktif.length === 0
      ? 'Aktif tedavi vakası yok — malzeme listesi boş.'
      : `${aktif.length} aktif vaka · ≈${formatMlTr(toplamMl)} ml ilaç · ≈${siringaAdedi} şırınga (${refKg} kg varsayılan)`;

  return {
    aktifVaka: aktif.length,
    refKg,
    satirlar,
    toplamMl,
    siringaAdedi,
    ozet,
  };
}

export function hastalikMalzemeMetni(liste: HastalikMalzemeListe): string {
  if (liste.satirlar.length === 0) {
    return ['SürüYön — İlaç malzeme listesi', '', liste.ozet].join('\n');
  }
  const satirlar = liste.satirlar
    .map((s) => {
      const stok =
        s.eksikMl != null && s.eksikMl > 0
          ? ` · eksik ≈${formatMlTr(s.eksikMl)} ml`
          : s.stokAdi
            ? ` · stok OK`
            : ` · stok kaydı yok`;
      return `• ${s.ilacAdi} (${s.tipEtiket}): ${s.dozEtiket} · ${s.siklik}${stok}`;
    })
    .join('\n');
  return [
    'SürüYön — İlaç malzeme listesi',
    `Aktif vaka: ${liste.aktifVaka}`,
    `Referans kilo: ${liste.refKg} kg`,
    '',
    satirlar,
    '',
    `Toplam: ≈${formatMlTr(liste.toplamMl)} ml`,
    `Şırınga tahmini: ≈${liste.siringaAdedi} adet`,
    '',
    'Veteriner onayından sonra uygula.',
  ].join('\n');
}
