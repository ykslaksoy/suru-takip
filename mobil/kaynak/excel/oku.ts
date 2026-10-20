/** Seçilen dosyayı (xlsx / csv) metin tablosuna çevirir */
import { csvOku } from './csv';
import { xlsxOku } from './xlsx';

export type OkunanDosya = { sayfaAdi: string | null; tablo: string[][]; digerSayfalar: string[] };

export function xlsxMi(veri: Uint8Array): boolean {
  return veri.length > 4 && veri[0] === 0x50 && veri[1] === 0x4b && veri[2] === 0x03 && veri[3] === 0x04;
}

export function metneCevir(veri: Uint8Array): string {
  const utf = new TextDecoder('utf-8').decode(veri);
  if (!utf.includes('\uFFFD')) return utf;
  // Eski Türkçe Excel CSV'si (Windows-1254)
  try {
    return new TextDecoder('windows-1254').decode(veri);
  } catch {
    return utf;
  }
}

function bosKirp(t: string[][]): string[][] {
  return t.filter((r) => r && r.some((h) => (h ?? '').trim() !== '')).map((r) => r.map((h) => h ?? ''));
}

export function dosyaOku(veri: Uint8Array, sayfa?: string): OkunanDosya {
  if (xlsxMi(veri)) {
    const sayfalar = xlsxOku(veri).map((s) => ({ ...s, satirlar: bosKirp(s.satirlar) }));
    const secilen = (sayfa && sayfalar.find((s) => s.ad === sayfa)) || sayfalar.find((s) => s.satirlar.length > 0) || sayfalar[0];
    return {
      sayfaAdi: secilen?.ad ?? null,
      tablo: secilen?.satirlar ?? [],
      digerSayfalar: sayfalar.map((s) => s.ad),
    };
  }
  return { sayfaAdi: null, tablo: bosKirp(csvOku(metneCevir(veri))), digerSayfalar: [] };
}
