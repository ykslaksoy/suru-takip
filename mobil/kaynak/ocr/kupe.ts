/**
 * Küpe / etiket OCR yardımcıları.
 * Metin normalizasyonu + gerçek OCR (motor.ts) ile fotoğraftan okuma.
 */

import { ocrMetinOku } from './motor';

export type OcrKupeSonuc = {
  ok: boolean;
  ham: string;
  earTag: string;
  message: string;
};

/** Ham metinden küpe no çıkar (TR-34-001234, TR34001234, 34001234…) */
export function ocrKupeNormalize(ham: string): OcrKupeSonuc {
  const raw = ham.trim();
  if (!raw) return { ok: false, ham: '', earTag: '', message: 'Metin boş' };

  const upper = raw.toUpperCase().replace(/[–—]/g, '-');
  // TR-34-001234
  const m1 = upper.match(/TR[-\s]?(\d{2})[-\s]?(\d{4,8})/);
  if (m1) {
    const earTag = `TR-${m1[1]}-${m1[2]}`;
    return { ok: true, ham: raw, earTag, message: `Küpe: ${earTag}` };
  }
  // TR340012345678901 tarzı uzun
  const m2 = upper.match(/TR(\d{10,17})/);
  if (m2) {
    const d = m2[1];
    const earTag = `TR-${d.slice(0, 2)}-${d.slice(-6)}`;
    return { ok: true, ham: raw, earTag, message: `Küpe önerisi: ${earTag}` };
  }
  // Saf rakam
  const digits = upper.replace(/\D/g, '');
  if (digits.length >= 6) {
    const earTag = `TR-${digits.slice(0, 2) || '00'}-${digits.slice(-6)}`;
    return { ok: true, ham: raw, earTag, message: `Küpe önerisi: ${earTag}` };
  }

  return { ok: false, ham: raw, earTag: '', message: 'Küpe numarası çıkarılamadı — elle düzeltin' };
}

/**
 * Fotoğraftan küpe oku — gerçek OCR motoru (ocr/motor.ts). Metin verilirse doğrudan normalize eder.
 */
export async function ocrKupeFotodan(opts: { uri?: string; metin?: string }): Promise<OcrKupeSonuc> {
  if (opts.metin?.trim()) return ocrKupeNormalize(opts.metin);
  if (!opts.uri) return { ok: false, ham: '', earTag: '', message: 'Küpe fotoğrafı çekin veya metni yazın.' };
  const r = await ocrMetinOku(opts.uri);
  if (!r.ok) return { ok: false, ham: '', earTag: '', message: r.message };
  const n = ocrKupeNormalize(r.metin);
  return { ...n, message: `${n.message} (${r.motor})` };
}
