import type { Gorev, GorevKaynak } from '@/kaynak/gorevler/liste';
import { getGorevler, gorevleriSirala } from '@/kaynak/gorevler/liste';
import { gunEtiket } from '@/kaynak/akilli-veteriner/hizli-besi-plani';

/** Öncelik sırası — üstten alta */
export type GorevKategoriId = 'asi' | 'yem' | 'tartim' | 'stok' | 'saglik';

export type GorevKategoriMeta = {
  id: GorevKategoriId;
  label: string;
  icon: string;
  href: string;
};

export const GOREV_KATEGORI_SIRASI: GorevKategoriMeta[] = [
  { id: 'asi', label: 'Aşı', icon: '💉', href: '/(tabs)/saglik' },
  { id: 'yem', label: 'Yem', icon: '🌾', href: '/(tabs)/rasyon' },
  { id: 'tartim', label: 'Tartım', icon: '⚖️', href: '/(tabs)/suru' },
  { id: 'stok', label: 'Stok', icon: '📦', href: '/(tabs)/stok' },
  { id: 'saglik', label: 'Sağlık', icon: '💊', href: '/(tabs)/saglik' },
];

export type GorevGrup = GorevKategoriMeta & {
  adet: number;
  gorevler: Gorev[];
};

export type GorevGunGrup = {
  gun: number;
  baslik: string;
  gorevler: Gorev[];
};

export type GorevGruplarSonuc = {
  gruplar: GorevGrup[];
  diger: Gorev[];
};

/** Görevi ana kategorilerden birine veya “diğer”e ayırır */
export function gorevKategorisi(g: Gorev): GorevKategoriId | 'diger' {
  if (g.kaynak === 'yem' || g.id.startsWith('yem-ozet-')) return 'yem';
  if (g.id.startsWith('takviye-ozet-vitamin-')) return 'asi';
  // Alım tartımı (gün 1) aşı gün-gün listesinde — önce tartı, sonra doz
  if (g.id === 'takviye-ozet-tartim-tartim-giris') return 'asi';
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

/** Aşı listesini giriş gününe göre grupla */
export function asiGorevleriniGuneGore(gorevler: Gorev[]): GorevGunGrup[] {
  const sirali = gorevleriSirala(gorevler);
  const map = new Map<number, Gorev[]>();
  const digger: Gorev[] = [];
  for (const g of sirali) {
    if (g.planGun != null) {
      const list = map.get(g.planGun) ?? [];
      list.push(g);
      map.set(g.planGun, list);
    } else {
      digger.push(g);
    }
  }
  const out: GorevGunGrup[] = [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([gun, gs]) => ({ gun, baslik: gunEtiket(gun), gorevler: gs }));
  if (digger.length > 0) {
    out.push({ gun: -1, baslik: 'Diğer aşı görevleri', gorevler: digger });
  }
  return out;
}

export async function getGorevGruplari(): Promise<GorevGruplarSonuc> {
  const tum = await getGorevler();
  const buckets: Record<GorevKategoriId, Gorev[]> = {
    asi: [],
    yem: [],
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
