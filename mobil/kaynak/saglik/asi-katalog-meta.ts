import { ASI_PROGRAMI, asiKategori, asiMlDozYerEtiketi } from '@/kaynak/cekirdek/asi-programi';
import {
  VITAMIN_PROGRAMI,
  vitaminMlDozYerEtiketi,
  vitaminTipEtiket,
} from '@/kaynak/akilli-veteriner/vitamin-programi';

export type TakviyeKatalogTip = 'asi' | 'parazit' | 'vitamin';

export type TakviyeKatalogMeta = {
  programId: string;
  tip: TakviyeKatalogTip;
  baslik: string;
  urunAdi: string;
  dozYerEtiket: string;
  devletNotu?: string;
  neZaman?: string;
};

export function takviyeKatalogIdGecerli(programId: string): boolean {
  return (
    ASI_PROGRAMI.some((p) => p.id === programId) || VITAMIN_PROGRAMI.some((v) => v.id === programId)
  );
}

export function takviyeKatalogMeta(programId: string): TakviyeKatalogMeta | null {
  const p = ASI_PROGRAMI.find((x) => x.id === programId);
  if (p) {
    const tip = asiKategori(p) === 'parazit' ? 'parazit' : 'asi';
    return {
      programId,
      tip,
      baslik: p.koruma,
      urunAdi: p.ad,
      dozYerEtiket: asiMlDozYerEtiketi(p),
      devletNotu: p.devletNotu,
    };
  }
  const v = VITAMIN_PROGRAMI.find((x) => x.id === programId);
  if (!v) return null;
  return {
    programId,
    tip: 'vitamin',
    baslik: v.detay,
    urunAdi: v.ad,
    dozYerEtiket: `${vitaminMlDozYerEtiketi(v)} · ${vitaminTipEtiket(v.uygulama)}`,
    neZaman: v.neZaman,
  };
}
