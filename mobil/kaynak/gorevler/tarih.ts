/** YYYY-MM-DD çıkarır; ISO veya tarih-saat dizilerinden. Geçersizse null. */
export function tarihGunKismi(ham?: string | null): string | null {
  const t = (ham ?? '').trim();
  if (!t) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(t);
  if (!m) return null;
  const gun = m[1];
  const d = new Date(`${gun}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return gun;
}

/** Sıralama / karşılaştırma için zaman damgası (geçersiz → 0). */
export function tarihZamani(ham?: string | null): number {
  const gun = tarihGunKismi(ham);
  if (gun) return new Date(`${gun}T12:00:00`).getTime();
  const parsed = Date.parse((ham ?? '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}
