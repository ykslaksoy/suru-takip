export type GozlemBeslemeBaglam = {
  gozlemAdi: boolean;
  padokNotu: string;
  karantina: boolean;
  otomatikOneriYok: boolean;
  uyari: string | null;
};

/** Gözlem adı eşlemesi — padok modülüne bağımlılık yok (test) */
export function gozlemPadokAdiMu(ad: string | null | undefined): boolean {
  const n = (ad ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');
  return n === 'gozlem' || n === 'gozetleme' || n.includes('gozlem') || n.includes('gozetleme');
}

/** Padok adı tek başına diyet/reçete atamaz; yalnız bağlam ve eksik veri uyarır */
export function gozlemBeslemeBaglam(
  padokAd: string,
  padok?: { not: string; karantina: boolean } | null,
): GozlemBeslemeBaglam {
  const gozlemAdi = gozlemPadokAdiMu(padokAd);
  const padokNotu = padok?.not?.trim() ?? '';
  const karantina = Boolean(padok?.karantina);
  const otomatikOneriYok = gozlemAdi;
  const uyari = gozlemAdi
    ? 'Gözlem padoku: otomatik starter yok. İsteğe bağlı «Varış ve uyum beslemesi» planını siz kaydedin; tüm hayvanlara otomatik atanmaz. Karantina ≠ besleme adaptasyonu.'
    : null;
  return { gozlemAdi, padokNotu, karantina, otomatikOneriYok, uyari };
}

export function padokAdaptasyonMetni(baglam: GozlemBeslemeBaglam): string | null {
  if (!baglam.padokNotu) return 'Önceki diyet / adaptasyon bilgisi girilmedi.';
  return `Padok notu (bilgi): ${baglam.padokNotu}`;
}
