/**
 * Besi motoru Faz 2 — ufka göre zaman dilimleri ve rasyon bağlantısı.
 */

import { HAZIR_RASYONLAR } from '@/kaynak/rasyon/formul';
import { normalizeBesiUfukGun } from './ufuk';

export type BesiRasyonDilim = {
  id: string;
  baslik: string;
  gunBas: number;
  gunBitis: number;
  rasyonId: string;
  rasyonAd: string;
  aciklama: string;
  /** Günlük yem kg/baş (tahmini) */
  kgBasGun: number;
  href: string;
};

const KG_BAS: Record<string, number> = {
  'besi-baslangic': 1.1,
  'besi-buyutme': 1.45,
  'besi-bitirme': 1.65,
};

function rasyonAd(id: string): string {
  return HAZIR_RASYONLAR.find((r) => r.id === id)?.ad ?? id;
}

/** 0–5 alıştırma, 6–30 büyütme, 31–ufuk bitirme */
export function besiRasyonDilimleri(ufukGun: number): BesiRasyonDilim[] {
  const ufuk = normalizeBesiUfukGun(ufukGun);
  const bitirmeBas = 31;
  const dilimler: Array<{ id: string; baslik: string; bas: number; bit: number; rasyonId: string; not: string }> = [
    { id: 'alistirma', baslik: 'Alıştırma', bas: 0, bit: Math.min(5, ufuk), rasyonId: 'besi-baslangic', not: 'İlk hafta — yem geçişi' },
    { id: 'buyutme', baslik: 'Büyütme', bas: 6, bit: Math.min(30, ufuk), rasyonId: 'besi-buyutme', not: 'Orta dönem ADG' },
    {
      id: 'bitirme',
      baslik: 'Bitirme',
      bas: bitirmeBas,
      bit: ufuk,
      rasyonId: 'besi-bitirme',
      not: `Kesim öncesi · ${ufuk} gün ufuk`,
    },
  ];
  return dilimler
    .filter((d) => d.bas <= ufuk)
    .map((d) => ({
      id: d.id,
      baslik: d.baslik,
      gunBas: d.bas,
      gunBitis: d.bit,
      rasyonId: d.rasyonId,
      rasyonAd: rasyonAd(d.rasyonId),
      aciklama: d.not,
      kgBasGun: KG_BAS[d.rasyonId] ?? 1.2,
      href: '/(tabs)/rasyon',
    }));
}

export function dilimGunSayisi(d: BesiRasyonDilim): number {
  if (d.gunBitis < d.gunBas) return 0;
  return d.gunBitis - d.gunBas + 1;
}
