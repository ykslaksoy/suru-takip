/**
 * Kuzu kimlik ayıklama — ses / metin girişi
 */

export function kupeNumarasiAyikla(metin: string): string | null {
  const patterns = [
    /(?:küpe|kupe|kulak(?:\s*küpesi)?|tag|numara|sırt|sirt|no)\s*[:\-]?\s*([a-z0-9\-./]+)/i,
    /\b(TR[\s\-]?\d[\d\-./]*)\b/i,
    /\b(\d{2,6})\b/,
  ];
  for (const p of patterns) {
    const m = metin.match(p);
    if (m?.[1]) return m[1].replace(/\s+/g, '').toUpperCase();
  }
  return null;
}

export function sirtNumarasiAyikla(metin: string): string | null {
  const m = metin.match(/(?:sırt|sirt|numara|no)\s*[:\-]?\s*(\d{1,4})/i);
  if (m?.[1]) return m[1];
  const digits = metin.replace(/\D/g, '');
  return digits.length >= 1 && digits.length <= 4 ? digits : null;
}
