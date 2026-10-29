/**
 * Sırt / padok no OCR — metin normalizasyonu.
 */

import { ocrMetinOku } from './motor';

export type OcrSirtSonuc = {
  ok: boolean;
  ham: string;
  sirtNo: string;
  message: string;
};

export function ocrSirtNormalize(ham: string): OcrSirtSonuc {
  const raw = ham.trim();
  if (!raw) return { ok: false, ham: '', sirtNo: '', message: 'Metin boş' };
  const m = raw.toUpperCase().match(/(?:SIRT|NO|#)?\s*([A-Z]?\d{1,4})/);
  if (m) {
    return { ok: true, ham: raw, sirtNo: m[1], message: `Sırt no: ${m[1]}` };
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length > 0) {
    return { ok: true, ham: raw, sirtNo: digits.slice(0, 4), message: `Sırt no: ${digits.slice(0, 4)}` };
  }
  return { ok: false, ham: raw, sirtNo: '', message: 'Sırt numarası bulunamadı' };
}

export async function ocrSirtFotodan(opts: { metin?: string; uri?: string }): Promise<OcrSirtSonuc> {
  if (opts.metin?.trim()) return ocrSirtNormalize(opts.metin);
  if (!opts.uri) return { ok: false, ham: '', sirtNo: '', message: 'Sırt fotoğrafı çekin veya numarayı yazın.' };
  const r = await ocrMetinOku(opts.uri);
  if (!r.ok) return { ok: false, ham: '', sirtNo: '', message: r.message };
  return ocrSirtNormalize(r.metin);
}
