import type { SesKomutEylemi } from './tipler';

function normalize(metin: string): string {
  return metin.trim().replace(/\s+/g, ' ');
}

function parseKilo(raw: string): number | null {
  const m = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:kilo|kg|kilogram)?/i);
  if (!m) return null;
  const val = parseFloat(m[1].replace(',', '.'));
  return Number.isFinite(val) && val > 0 ? val : null;
}

function parseKupe(metin: string): string | null {
  const patterns = [
    /(?:küpe|kupe|kulak(?:\s*küpesi)?|tag)\s*(?:no|numara)?\s*[:\-]?\s*([a-z0-9\-./]+)/i,
    /\b(TR[\s\-]?\d[\d\-./]*)\b/i,
    /\b(\d{3,6})\b/,
  ];
  for (const p of patterns) {
    const m = metin.match(p);
    if (m?.[1]) return m[1].replace(/\s+/g, '').toUpperCase();
  }
  return null;
}

function parseTartim(metin: string): SesKomutEylemi | null {
  const kupe = parseKupe(metin);
  const kilo = parseKilo(metin);
  if (!kupe || kilo == null) return null;
  return { tur: 'tartim', kupeArama: kupe, kiloKg: kilo };
}

function parseAsi(metin: string): SesKomutEylemi | null {
  if (!/(aşı|asi|vaccine)/i.test(metin)) return null;
  const kupe = parseKupe(metin);
  const asiMatch = metin.match(/(?:aşı|asi)\s*[:\-]?\s*(.+?)(?:$|,|\.)/i);
  const asiAdi = asiMatch?.[1]?.trim();
  if (!kupe || !asiAdi) return null;
  return { tur: 'asi', kupeArama: kupe, asiAdi };
}

function parseStok(metin: string): SesKomutEylemi | null {
  const giris = /(?:stok\s*)?giriş|giris|ekle|artır|artir/i.test(metin);
  const cikis = /(?:stok\s*)?çıkış|cikis|düş|dus|azalt/i.test(metin);
  if (!giris && !cikis) return null;

  const miktarMatch = metin.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilo|doz|adet|flakon|litre|lt|ton)?/i);
  if (!miktarMatch) return null;

  const miktar = parseFloat(miktarMatch[1].replace(',', '.'));
  const birim = miktarMatch[2]?.toLowerCase() ?? 'adet';

  const stokAdiMatch = metin.match(
    /(?:stok|yem|aşı|asi|ilaç|ilac)\s*[:\-]?\s*(.+?)(?:\s+\d|$)/i
  );
  const stokAdi = stokAdiMatch?.[1]?.trim() ?? 'Stok';

  return {
    tur: 'stok',
    stokAdi,
    miktar,
    birim,
    yon: cikis ? 'cikis' : 'giris',
  };
}

/** Ham konuşma/metin → yapılandırılmış komut (henüz uygulanmaz) */
export function komutAyikla(metin: string): SesKomutEylemi | null {
  const n = normalize(metin);
  if (!n) return null;

  return parseTartim(n) ?? parseAsi(n) ?? parseStok(n);
}
