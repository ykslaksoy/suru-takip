/** Yönlendirme yardımcıları — RN/veritabanı bağımlılığı yok (test + UI). */
export type BesiSekli = 'ic' | 'dis' | 'karisik';

/** Aşı modu ile aynı Türkçe etiketler (tek UX). */
export const BESI_SECENEKLER: { id: BesiSekli; label: string }[] = [
  { id: 'ic', label: 'İç mekân / ahır besi' },
  { id: 'dis', label: 'Açık alan / mera' },
  { id: 'karisik', label: 'Hem içerde hem dışarda' },
];

export function icBesiModu(sekil: BesiSekli): boolean {
  return sekil === 'ic';
}

export function meraHaritasiUygun(sekil: BesiSekli): boolean {
  return sekil === 'dis' || sekil === 'karisik';
}

export function haritaGirisEtiketi(sekil: BesiSekli): string {
  return icBesiModu(sekil) ? 'Padok planı' : 'Mera haritası';
}

export function haritaGirisIpucu(sekil: BesiSekli): string {
  return icBesiModu(sekil)
    ? 'Kapalı ahır besi — padok doluluk ve kapasite; GPS/mera otlatma yok.'
    : 'Mera ve otlatma haritası; padok konumları işaretlenebilir.';
}

export type HaritaHedef = { pathname: '/padok-plani' | '/mera'; params?: { padok?: string } };

export function haritaHedefRotasi(sekil: BesiSekli, padok?: string | null): HaritaHedef {
  const p = padok?.trim();
  if (icBesiModu(sekil)) {
    return p ? { pathname: '/padok-plani', params: { padok: p } } : { pathname: '/padok-plani' };
  }
  return p ? { pathname: '/mera', params: { padok: p } } : { pathname: '/mera' };
}
