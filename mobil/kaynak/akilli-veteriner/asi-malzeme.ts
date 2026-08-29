import { ASI_PROGRAMI, asiDozEtiketi, type AsiProgramKalemi } from '@/kaynak/cekirdek/asi-programi';
import type { StockItem } from '@/kaynak/cekirdek/tipler';
import { getStockItems } from '@/kaynak/cekirdek/veritabani';
import { getKuzular, planOku, type AsiPlani, type AsiTercih } from './asi-modu';

function normalize(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');
}

function eslesir(metin: string, anahtarlar: string[]): boolean {
  const n = normalize(metin);
  return anahtarlar.some((k) => n.includes(normalize(k)));
}

function programBul(id: string): AsiProgramKalemi | undefined {
  return ASI_PROGRAMI.find((p) => p.id === id);
}

function stokBul(program: AsiProgramKalemi, stock: StockItem[]): StockItem | null {
  const vaccines = stock.filter((s) => s.type === 'vaccine');
  return (
    vaccines.find((s) => eslesir(s.name, [program.koruma, program.ad, ...program.stokAnahtarlar])) ??
    stock.find((s) => eslesir(s.name, [program.koruma, program.ad, ...program.stokAnahtarlar])) ??
    null
  );
}

function formatMl(n: number): string {
  return String(n).replace('.', ',');
}

export type AsiMalzemeSatiri = {
  programId: string;
  koruma: string;
  asiAdi: string;
  mlEtiket: string;
  hayvanSayisi: number;
  /** Hayvan başına ml (null = çizik / kg) */
  mlHayvan: number | null;
  /** Toplam ml ihtiyacı */
  toplamMl: number | null;
  /** Toplam doz (şişe dozu) */
  toplamDoz: number;
  stokMiktar: number;
  stokAdi: string | null;
  eksikDoz: number;
  eksikMl: number | null;
  devletNotu?: string;
  /** Plan tarihi (varsa) */
  tarih?: string;
  durumMetni: string;
};

export type AsiMalzemeListesi = {
  kuzuSayisi: number;
  kaynak: 'plan' | 'tercih';
  satirlar: AsiMalzemeSatiri[];
  /** Enjeksiyon sayısı (şırınga tahmini) */
  siringaAdedi: number;
  ozet: string;
};

type KaynakSatir = {
  programId: string;
  hayvanSayisi: number;
  tarih?: string;
};

/**
 * Planlanan (bekleyen) aşılara göre malzeme; yoksa aktif tercihler × kuzu.
 */
export async function olusturAsiMalzemeListesi(tercihler?: AsiTercih[]): Promise<AsiMalzemeListesi> {
  const [kuzular, planlar, stock] = await Promise.all([getKuzular(), planOku(), getStockItems()]);
  const kuzuSayisi = kuzular.length;

  const bekleyen = planlar.filter((p) => !p.uygulandi);
  let kaynak: AsiMalzemeListesi['kaynak'] = 'plan';
  let kaynakSatirlar: KaynakSatir[] = [];

  if (bekleyen.length > 0) {
    // Aynı program birden fazla planlanırsa birleştir
    const map = new Map<string, KaynakSatir>();
    for (const p of bekleyen) {
      const onceki = map.get(p.programId);
      const sayi = Math.max(p.hayvanSayisi, kuzuSayisi);
      if (!onceki) {
        map.set(p.programId, { programId: p.programId, hayvanSayisi: sayi, tarih: p.tarih });
      } else {
        onceki.hayvanSayisi = Math.max(onceki.hayvanSayisi, sayi);
        if (p.tarih && (!onceki.tarih || p.tarih < onceki.tarih)) onceki.tarih = p.tarih;
      }
    }
    kaynakSatirlar = [...map.values()];
  } else {
    kaynak = 'tercih';
    const aktif = (tercihler ?? []).filter((t) => t.aktif);
    kaynakSatirlar = aktif.map((t) => ({
      programId: t.programId,
      hayvanSayisi: kuzuSayisi,
    }));
  }

  const satirlar: AsiMalzemeSatiri[] = [];
  let siringaAdedi = 0;

  for (const k of kaynakSatirlar) {
    const program = programBul(k.programId);
    if (!program) continue;

    const hayvanSayisi = k.hayvanSayisi > 0 ? k.hayvanSayisi : kuzuSayisi;
    const toplamDoz = hayvanSayisi * program.dozHayvan;
    const toplamMl =
      program.mlHayvan != null ? Math.round(program.mlHayvan * hayvanSayisi * 100) / 100 : null;
    const item = stokBul(program, stock);
    const stokMiktar = item?.quantity ?? 0;
    const eksikDoz = Math.max(0, toplamDoz - stokMiktar);
    const eksikMl =
      program.mlHayvan != null && eksikDoz > 0
        ? Math.round(program.mlHayvan * eksikDoz * 100) / 100
        : null;

    // Çizik / hap / oral parazit hariç şırınga
    if (program.mlHayvan != null) {
      siringaAdedi += hayvanSayisi;
    }

    let durumMetni: string;
    if (toplamMl != null) {
      durumMetni = `${hayvanSayisi} kuzu × ${formatMl(program.mlHayvan!)} ml = ${formatMl(toplamMl)} ml · ${toplamDoz} doz`;
    } else {
      durumMetni = `${hayvanSayisi} kuzu · ${asiDozEtiketi(program)} · ${toplamDoz} doz`;
    }

    satirlar.push({
      programId: program.id,
      koruma: program.koruma,
      asiAdi: program.ad,
      mlEtiket: asiDozEtiketi(program),
      hayvanSayisi,
      mlHayvan: program.mlHayvan,
      toplamMl,
      toplamDoz,
      stokMiktar,
      stokAdi: item?.name ?? null,
      eksikDoz,
      eksikMl,
      devletNotu: program.devletNotu,
      tarih: k.tarih,
      durumMetni,
    });
  }

  const ozet =
    satirlar.length === 0
      ? 'Malzeme yok — önce aşı seçin veya plan oluşturun.'
      : `${satirlar.length} aşı · ${kuzuSayisi} kuzu · ~${siringaAdedi} şırınga`;

  return { kuzuSayisi, kaynak, satirlar, siringaAdedi, ozet };
}

/** Paylaşılabilir düz metin */
export function asiMalzemeMetni(liste: AsiMalzemeListesi): string {
  const baslik =
    liste.kaynak === 'plan'
      ? `Aşı malzeme listesi (planlanan) · ${liste.kuzuSayisi} kuzu`
      : `Aşı malzeme listesi (seçilen) · ${liste.kuzuSayisi} kuzu`;

  const satirlar = liste.satirlar.map((s) => {
    const stok =
      s.eksikDoz > 0
        ? `eksik ${s.eksikDoz} doz` + (s.eksikMl != null ? ` (~${formatMl(s.eksikMl)} ml)` : '')
        : s.stokAdi
          ? `stok yeterli (${s.stokMiktar})`
          : 'stok kaydı yok';
    return `• ${s.koruma} (${s.asiAdi}) ${s.mlEtiket}\n  ${s.durumMetni}\n  → ${stok}`;
  });

  return [baslik, ...satirlar, `Şırınga tahmini: ${liste.siringaAdedi} adet`].join('\n');
}
