import type { CariIslem, CariIslemTur } from './tipler';

/** Pozitif: cari size borçlu; negatif: siz cariye borçlusunuz. Vade satırı bakiyeyi değiştirmez. */
export function islemBakiyeEtkisi(tur: CariIslemTur, tutar: number): number {
  const t = Math.abs(tutar);
  switch (tur) {
    case 'borc':
      return t;
    case 'tahsilat':
      return -t;
    case 'alis':
      return -t;
    case 'odeme':
      return t;
    case 'vade':
      return 0;
    default:
      return 0;
  }
}

export function cariNetBakiye(islemler: CariIslem[]): number {
  return islemler.reduce((s, i) => s + islemBakiyeEtkisi(i.tur, i.tutar), 0);
}

export function bakiyeEtiket(bakiye: number): string {
  if (Math.abs(bakiye) < 0.01) return 'Kapalı';
  if (bakiye > 0) return `${bakiye.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺ alacak`;
  return `${Math.abs(bakiye).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺ borç`;
}
