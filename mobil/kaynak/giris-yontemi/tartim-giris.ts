/** Tartım kilo ayıklama — ses / metin */

export function kiloAyikla(metin: string): number | null {
  const m = metin.match(/(\d+(?:[.,]\d+)?)\s*(?:kilo|kg|kilogram)?/i);
  if (!m) return null;
  const val = parseFloat(m[1].replace(',', '.'));
  return Number.isFinite(val) && val > 0 && val < 500 ? val : null;
}

export function kiloMetinFormat(kg: number): string {
  return String(kg).replace('.', ',');
}
