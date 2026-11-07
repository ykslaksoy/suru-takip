/**
 * Baskül ekranı OCR — küpe OCR’den ayrı; yalnızca kg sayısı ayıklanır.
 * Simülasyon yok; fotoğraf için gerçek OCR motoru (ocr/motor.ts).
 */
import { kiloAyikla } from '@/kaynak/giris-yontemi';
import { ocrMetinOku } from './motor';

export type OcrBaskulSonuc =
  | { ok: true; kg: number; ham: string }
  | { ok: false; durum: 'okunamadi' | 'belirsiz' | 'hata'; message: string; ham?: string; adaylar?: number[] };

function adayKilolar(ham: string): number[] {
  const temiz = ham.replace(/\s+/g, ' ');
  const bulunan: number[] = [];
  const re = /(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:kg|kilo|KG)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(temiz)) !== null) {
    const v = parseFloat(m[1].replace(',', '.'));
    if (Number.isFinite(v) && v > 0 && v <= 200) bulunan.push(Math.round(v * 100) / 100);
  }
  if (!bulunan.length) {
    const tek = kiloAyikla(temiz);
    if (tek != null) bulunan.push(Math.round(tek * 100) / 100);
  }
  return [...new Set(bulunan)];
}

export function ocrBaskulEkranNormalize(ham: string): OcrBaskulSonuc {
  const t = ham.trim();
  if (!t) return { ok: false, durum: 'okunamadi', message: 'Boş metin', ham: t };
  const adaylar = adayKilolar(t);
  if (!adaylar.length) {
    return { ok: false, durum: 'okunamadi', message: 'Ekranda okunaklı kilo bulunamadı — net çekin veya elle yazın.', ham: t };
  }
  if (adaylar.length > 1) {
    return {
      ok: false,
      durum: 'belirsiz',
      message: 'Birden fazla sayı okundu — doğru kiloyu seçin veya düzeltin.',
      ham: t,
      adaylar,
    };
  }
  return { ok: true, kg: adaylar[0], ham: t };
}

export async function ocrBaskulEkranFotodan(opts: { uri?: string; metin?: string }): Promise<OcrBaskulSonuc> {
  if (opts.metin?.trim()) return ocrBaskulEkranNormalize(opts.metin);
  if (!opts.uri) return { ok: false, durum: 'hata', message: 'Fotoğraf yok' };
  const r = await ocrMetinOku(opts.uri);
  if (!r.ok) return { ok: false, durum: 'hata', message: r.message };
  return ocrBaskulEkranNormalize(r.metin);
}
