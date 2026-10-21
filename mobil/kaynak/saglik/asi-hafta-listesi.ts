import type { AsiStokDurum } from '@/kaynak/cekirdek/asi-programi';

export type AsiBuHaftaSatir = {
  programId: string;
  koruma: string;
  asiAdi: string;
  mlEtiket: string;
  animalId: string;
  earTag: string;
  etiket: string;
  durum: 'yapilacak' | 'yaklasiyor';
  kalanGun: number | null;
};

/** Bu hafta / yapılacak + yaklaşan hayvan satırları (Node test uyumlu — react-native yok). */
export function asiBuHaftaListesi(durumlar: AsiStokDurum[]): AsiBuHaftaSatir[] {
  const out: AsiBuHaftaSatir[] = [];
  for (const d of durumlar) {
    for (const h of d.hayvanlar) {
      if (h.durum !== 'yapilacak' && h.durum !== 'yaklasiyor') continue;
      if (h.durum === 'yaklasiyor' && h.kalanGun != null && h.kalanGun > 7) continue;
      out.push({
        programId: d.programId,
        koruma: d.koruma,
        asiAdi: d.asiAdi,
        mlEtiket: d.mlEtiket,
        animalId: h.animalId,
        earTag: h.earTag,
        etiket: h.etiket || h.earTag,
        durum: h.durum,
        kalanGun: h.kalanGun,
      });
    }
  }
  return out.sort((a, b) => {
    if (a.durum !== b.durum) return a.durum === 'yapilacak' ? -1 : 1;
    return (a.kalanGun ?? -999) - (b.kalanGun ?? -999);
  });
}
