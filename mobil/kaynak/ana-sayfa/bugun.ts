import { getBugunGorevleri } from '@/kaynak/gorevler/liste';

export type BugunSeviye = 'uyari' | 'sira' | 'bilgi';

export type BugunMadde = {
  id: string;
  seviye: BugunSeviye;
  baslik: string;
  aciklama: string;
  href: string;
  cta: string;
};

function seviyeDonustur(s: 'uyari' | 'sira' | 'plan' | 'bilgi'): BugunSeviye {
  if (s === 'uyari') return 'uyari';
  if (s === 'bilgi') return 'bilgi';
  return 'sira';
}

/** Ana sayfa “Bugün” — en fazla 3 günlük görev */
export async function getBugunMaddeleri(): Promise<BugunMadde[]> {
  const list = await getBugunGorevleri(3);
  return list.map((g) => ({
    id: g.id,
    seviye: seviyeDonustur(g.seviye),
    baslik: g.baslik,
    aciklama: g.aciklama,
    href: g.href,
    cta: g.cta,
  }));
}
