import type { VerimSutKayit } from './tipler';

export function sutToplamLitre(sabah: number | null, aksam: number | null, toplam?: number): number {
  const s = sabah ?? 0;
  const a = aksam ?? 0;
  if (s > 0 || a > 0) return Math.round((s + a) * 100) / 100;
  return Math.max(0, toplam ?? 0);
}

export function sutOrtLBas(toplamLitre: number, hayvanSayisi: number): number | null {
  if (!hayvanSayisi || hayvanSayisi < 1) return null;
  if (toplamLitre <= 0) return null;
  return Math.round((toplamLitre / hayvanSayisi) * 100) / 100;
}

export function yapagiOrtKg(toplamKg: number, bas: number): number | null {
  if (!bas || bas < 1 || toplamKg <= 0) return null;
  return Math.round((toplamKg / bas) * 100) / 100;
}

/** Mod 4/5/7 sağım kaydı ile uyumlu özet */
export function verimSutOzet(kayitlar: VerimSutKayit[]): { kayit: number; litre: number; ortLBas: number | null } {
  const litre = kayitlar.reduce((s, k) => s + k.toplamLitre, 0);
  const bas = kayitlar.reduce((s, k) => s + (k.hayvanSayisi || 0), 0);
  const ort = bas > 0 ? Math.round((litre / bas) * 100) / 100 : null;
  return { kayit: kayitlar.length, litre: Math.round(litre * 100) / 100, ortLBas: ort };
}
