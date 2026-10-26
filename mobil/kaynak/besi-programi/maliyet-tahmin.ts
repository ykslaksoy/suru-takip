/**
 * Besi Faz 2 — tahmini yem + sağlık maliyeti ve hedef satışa göre kâr/zarar.
 */

import { besiRasyonDilimleri, dilimGunSayisi } from './rasyon-dilimleri';
import { normalizeBesiUfukGun } from './ufuk';

export type BesiMaliyetTahminGirdi = {
  ufukGun: number;
  basSayisi: number;
  alisBasFiyat: number;
  hedefSatisKg: number;
  satisKgFiyat: number;
  /** Besi yemi ₺/kg (varsayılan referans) */
  yemKgFiyat?: number;
  /** Aşı/ilaç başı tahmini ₺ */
  saglikBasFiyat?: number;
};

export type BesiMaliyetTahmin = {
  ufukGun: number;
  basSayisi: number;
  tahminiYemKg: number;
  tahminiYemMaliyet: number;
  tahminiSaglikMaliyet: number;
  toplamMaliyet: number;
  tahminiSatisGelir: number;
  tahminiKar: number;
  basBasiMaliyet: number;
  basBasiKar: number | null;
};

const VARSAYILAN_YEM_KG = 19.11;
const VARSAYILAN_SAGLIK_BAS = 85;

export function hesaplaBesiMaliyetTahmin(g: BesiMaliyetTahminGirdi): BesiMaliyetTahmin {
  const ufuk = normalizeBesiUfukGun(g.ufukGun);
  const bas = Math.max(1, Math.floor(g.basSayisi || 1));
  const yemFiyat = g.yemKgFiyat ?? VARSAYILAN_YEM_KG;
  const saglikBas = g.saglikBasFiyat ?? VARSAYILAN_SAGLIK_BAS;
  const dilimler = besiRasyonDilimleri(ufuk);
  let yemKgToplam = 0;
  for (const d of dilimler) {
    const gun = dilimGunSayisi(d);
    yemKgToplam += gun * d.kgBasGun * bas;
  }
  const alis = Math.max(0, g.alisBasFiyat) * bas;
  const yemMal = yemKgToplam * yemFiyat;
  const saglik = saglikBas * bas;
  const toplam = alis + yemMal + saglik;
  const kg = Math.max(0, g.hedefSatisKg);
  const fiyat = Math.max(0, g.satisKgFiyat);
  const gelir = kg * fiyat * bas;
  const kar = gelir - toplam;
  return {
    ufukGun: ufuk,
    basSayisi: bas,
    tahminiYemKg: Math.round(yemKgToplam * 10) / 10,
    tahminiYemMaliyet: Math.round(yemMal),
    tahminiSaglikMaliyet: Math.round(saglik),
    toplamMaliyet: Math.round(toplam),
    tahminiSatisGelir: Math.round(gelir),
    tahminiKar: Math.round(kar),
    basBasiMaliyet: Math.round(toplam / bas),
    basBasiKar: bas ? Math.round(kar / bas) : null,
  };
}
