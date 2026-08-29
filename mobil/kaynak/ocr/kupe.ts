/**
 * Küpe / etiket OCR yardımcıları.
 * Gerçek ML yok — kullanıcı veya foto etiketinden gelen metni normalize eder.
 * Aynı API ileride ML Kit / bulut OCR’ye bağlanır.
 */

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
 * “OCR” simülasyonu — foto URI’si kullanılmaz; etiket seçimine göre örnek metin.
 * Gerçek OCR bağlandığında URI burada işlenir.
 */
export async function ocrKupeFotodan(opts: {
  uri?: string;
  /** Kullanıcının girdiği / yapıştırdığı metin */
  metin?: string;
  tur?: 'yara' | 'ayak' | 'diski' | 'agiz' | 'genel' | 'etiket';
}): Promise<OcrKupeSonuc> {
  if (opts.metin?.trim()) {
    return ocrKupeNormalize(opts.metin);
  }
  // Simülasyon: rastgele küpe (geliştirme)
  await new Promise((r) => setTimeout(r, 400));
  const n = String(Math.floor(100000 + Math.random() * 899999));
  const ornek = `TR-34-${n}`;
  return {
    ok: true,
    ham: ornek,
    earTag: ornek,
    message: opts.uri
      ? `Simüle OCR (foto var) → ${ornek}. Gerçek OCR bağlanınca etiket okunur.`
      : `Simüle OCR → ${ornek}`,
  };
}
