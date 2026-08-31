import type { Gorev, GorevKaynak } from '@/kaynak/gorevler/liste';
import { getGorevler, gorevleriSirala } from '@/kaynak/gorevler/liste';

/** Öncelik sırası — üstten alta */
export type GorevKategoriId = 'asi' | 'tartim' | 'stok' | 'saglik';

export type GorevKategoriMeta = {
  id: GorevKategoriId;
  label: string;
  icon: string;
  href: string;
};

export const GOREV_KATEGORI_SIRASI: GorevKategoriMeta[] = [
  { id: 'asi', label: 'Aşı', icon: '💉', href: '/(tabs)/saglik' },
  { id: 'tartim', label: 'Tartım', icon: '⚖️', href: '/(tabs)/suru' },
  { id: 'stok', label: 'Stok', icon: '📦', href: '/(tabs)/stok' },
  { id: 'saglik', label: 'Sağlık', icon: '💊', href: '/(tabs)/saglik' },
];

export type GorevGrup = GorevKategoriMeta & {
  adet: number;
  gorevler: Gorev[];
};

export type GorevGruplarSonuc = {
  gruplar: GorevGrup[];
  diger: Gorev[];
};

/** Görevi 4 ana kategoriden birine veya “diğer”e ayırır */
export function gorevKategorisi(g: Gorev): GorevKategoriId | 'diger' {
  if (g.kaynak === 'stok') return 'stok';
  if (g.kaynak === 'tartim') return 'tartim';
  if (g.kaynak === 'saglik' || g.kaynak === 'bekletme') return 'saglik';
  if (g.kaynak === 'asi') {
    if (
      g.id.includes('stok') ||
      g.id.includes('skt') ||
      /stok|skt/i.test(g.baslik)
    ) {
      return 'stok';
    }
    return 'asi';
  }
  if (g.kaynak === 'is-plani') return 'diger';
  return 'diger';
}

export async function getGorevGruplari(): Promise<GorevGruplarSonuc> {
  const tum = await getGorevler();
  const buckets: Record<GorevKategoriId, Gorev[]> = {
    asi: [],
    tartim: [],
    stok: [],
    saglik: [],
  };
  const diger: Gorev[] = [];

  for (const g of tum) {
    const k = gorevKategorisi(g);
    if (k === 'diger') diger.push(g);
    else buckets[k].push(g);
  }

  const gruplar: GorevGrup[] = [];
  for (const meta of GOREV_KATEGORI_SIRASI) {
    const gorevler = buckets[meta.id];
    if (gorevler.length === 0) continue;
    gruplar.push({ ...meta, adet: gorevler.length, gorevler: gorevleriSirala(gorevler) });
  }

  return { gruplar, diger: gorevleriSirala(diger) };
}
