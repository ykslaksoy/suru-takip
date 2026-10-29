/**
 * Gerçek OCR motoru (web): kamera/galeri fotoğrafından metin okur.
 *  1) Tarayıcıda Shape Detection `TextDetector` varsa (Chrome Android) onu kullanır.
 *  2) Yoksa Tesseract.js (WASM, `eng` modeli) çalışma anında CDN’den yüklenir.
 * Native build için ML Kit modülü yok → açık hata döner, elle giriş.
 * Simülasyon / rastgele sonuç YOK.
 */
export const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

export type OcrMotorSonuc =
  | { ok: true; metin: string; motor: 'TextDetector' | 'Tesseract' }
  | { ok: false; message: string };

type TesseractGlobal = {
  recognize(img: string, lang: string, opts?: unknown): Promise<{ data: { text: string } }>;
};

let tesseractYukleme: Promise<TesseractGlobal> | null = null;

function tesseractYukle(): Promise<TesseractGlobal> {
  const w = globalThis as unknown as { Tesseract?: TesseractGlobal };
  if (w.Tesseract) return Promise.resolve(w.Tesseract);
  if (tesseractYukleme) return tesseractYukleme;
  tesseractYukleme = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TESSERACT_CDN;
    s.async = true;
    s.onload = () => (w.Tesseract ? resolve(w.Tesseract) : reject(new Error('Tesseract yüklenemedi')));
    s.onerror = () => {
      tesseractYukleme = null;
      reject(new Error('OCR motoru indirilemedi (internet gerekli)'));
    };
    document.head.appendChild(s);
  });
  return tesseractYukleme;
}

export function ocrMotorDestekleniyor(): boolean {
  return typeof document !== 'undefined' && typeof document.createElement === 'function';
}

/** Fotoğraf URI’sinden (blob:/data:/https:) metin çıkar */
export async function ocrMetinOku(uri: string): Promise<OcrMotorSonuc> {
  if (!uri) return { ok: false, message: 'Fotoğraf yok' };
  if (!ocrMotorDestekleniyor()) {
    return { ok: false, message: 'Bu cihazda fotoğraf OCR yok — numarayı elle yazın veya web uygulamasını kullanın.' };
  }
  try {
    const TD = (
      globalThis as unknown as {
        TextDetector?: new () => { detect(b: ImageBitmap): Promise<{ rawValue: string }[]> };
      }
    ).TextDetector;
    if (TD && typeof createImageBitmap === 'function') {
      const blob = await (await fetch(uri)).blob();
      const bmp = await createImageBitmap(blob);
      const r = await new TD().detect(bmp);
      const metin = r.map((x) => x.rawValue).join('\n').trim();
      if (metin) return { ok: true, metin, motor: 'TextDetector' };
    }
    const T = await tesseractYukle();
    const { data } = await T.recognize(uri, 'eng');
    const metin = (data.text ?? '').trim();
    if (!metin) return { ok: false, message: 'Fotoğrafta okunabilir metin bulunamadı — daha yakından, net çekin.' };
    return { ok: true, metin, motor: 'Tesseract' };
  } catch (e) {
    return { ok: false, message: `OCR hatası: ${e instanceof Error ? e.message : String(e)}` };
  }
}
