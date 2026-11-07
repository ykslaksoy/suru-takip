import type { PartiMaliyet } from '@/kaynak/maliyet/hesap';
import type { CiftSayimAnahtar } from '@/kaynak/maliyet/besi-ekonomi-kalem';

/** Maliyet ve Kâr ekranındaki parti özetinden — salt okunur, muhasebe yazmaz. */
export type PartiGercekMaliyetOzet = {
  parti: string;
  bas: number;
  alis: number;
  yem: number;
  ilac: number;
  sigorta: number;
  toplam: number;
  tahminiAlisBas: number;
  eksikAlisBas: number;
};

export function partiMaliyettenOzet(p: PartiMaliyet): PartiGercekMaliyetOzet {
  return {
    parti: p.parti,
    bas: p.bas,
    alis: p.alis,
    yem: p.yem,
    ilac: p.ilac,
    sigorta: p.sigorta,
    toplam: p.toplam,
    tahminiAlisBas: p.alisTahminiBas,
    eksikAlisBas: p.alisEksikBas,
  };
}

export function gercekCiftSayimAnahtarlari(ozet: PartiGercekMaliyetOzet): Set<CiftSayimAnahtar> {
  const s = new Set<CiftSayimAnahtar>();
  if (ozet.yem > 0) s.add('parti_yem_stok');
  if (ozet.ilac > 0) s.add('parti_ilac_stok');
  if (ozet.alis > 0) s.add('parti_alis_kayit');
  return s;
}

export function gercekToplamEkMaliyet(ozet: PartiGercekMaliyetOzet, basSayisi: number): number | null {
  if (basSayisi <= 0) return null;
  const oran = ozet.bas / basSayisi;
  if (oran <= 0) return null;
  return Math.round((ozet.yem + ozet.ilac) * oran);
}
