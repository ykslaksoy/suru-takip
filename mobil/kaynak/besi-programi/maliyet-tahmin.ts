/**
 * Besi Faz 2 — tahmini yem + sağlık maliyeti ve hedef satışa göre kâr/zarar.
 */

import { besiRasyonDilimleri, dilimGunSayisi } from './rasyon-dilimleri';
import { normalizeBesiUfukGun } from './ufuk';

export type BesiMaliyetTahminGirdi = {
  ufukGun: number;
  basSayisi: number;
  alisBasFiyat: number;
  /** Hedef satış canlı ağırlığı (kg/baş). Verilmezse girisKg + günlük artış × ufuk. */
  hedefSatisKg?: number;
  /** Giriş (alım) canlı ağırlığı kg/baş */
  girisKg?: number;
  /** Günlük canlı ağırlık artışı kg/baş (varsayılan 0,25) */
  gunlukArtisKg?: number;
  /** Ölüm/fire oranı 0–1 (satışa ulaşamayan baş) */
  fireOrani?: number;
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
  /** Kullanılan satış kg/baş (verilen ya da artıştan türetilen) */
  satisKgBas: number;
  /** Satışa ulaşan baş (fire düşülmüş) */
  satilanBas: number;
  /** Zararsız satış için gereken ₺/kg canlı */
  basabasKgFiyat: number | null;
  /** Yem kg / kazanılan canlı kg (girisKg biliniyorsa) */
  yemDonusumOrani: number | null;
  /** Günlük baş başı kâr */
  gunlukBasKar: number | null;
  dilimDokum: Array<{ id: string; baslik: string; gun: number; yemKg: number; yemMaliyet: number }>;
};

export const VARSAYILAN_GUNLUK_ARTIS_KG = 0.25;

const VARSAYILAN_YEM_KG = 19.11;
const VARSAYILAN_SAGLIK_BAS = 85;

function sayi(n: number | undefined, varsayilan: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : varsayilan;
}

export function hesaplaBesiMaliyetTahmin(g: BesiMaliyetTahminGirdi): BesiMaliyetTahmin {
  const ufuk = normalizeBesiUfukGun(g.ufukGun);
  const bas = Math.max(1, Math.floor(sayi(g.basSayisi, 1)));
  const yemFiyat = Math.max(0, sayi(g.yemKgFiyat, VARSAYILAN_YEM_KG));
  const saglikBas = Math.max(0, sayi(g.saglikBasFiyat, VARSAYILAN_SAGLIK_BAS));
  const fire = Math.min(1, Math.max(0, sayi(g.fireOrani, 0)));
  const dilimDokum: BesiMaliyetTahmin['dilimDokum'] = [];
  let yemKgToplam = 0;
  for (const d of besiRasyonDilimleri(ufuk)) {
    const gun = dilimGunSayisi(d);
    const kg = gun * d.kgBasGun * bas;
    yemKgToplam += kg;
    dilimDokum.push({ id: d.id, baslik: d.baslik, gun, yemKg: Math.round(kg * 10) / 10, yemMaliyet: Math.round(kg * yemFiyat) });
  }
  const girisKg = typeof g.girisKg === 'number' && g.girisKg > 0 ? g.girisKg : null;
  const artis = Math.max(0, sayi(g.gunlukArtisKg, VARSAYILAN_GUNLUK_ARTIS_KG));
  const satisKgBas = Math.max(
    0,
    typeof g.hedefSatisKg === 'number' && g.hedefSatisKg > 0
      ? g.hedefSatisKg
      : girisKg !== null
        ? girisKg + artis * ufuk
        : 0,
  );
  const alis = Math.max(0, sayi(g.alisBasFiyat, 0)) * bas;
  const yemMal = yemKgToplam * yemFiyat;
  const saglik = saglikBas * bas;
  const toplam = alis + yemMal + saglik;
  const satilanBas = bas * (1 - fire);
  const fiyat = Math.max(0, sayi(g.satisKgFiyat, 0));
  const gelir = satisKgBas * fiyat * satilanBas;
  const kar = gelir - toplam;
  const satilanKg = satisKgBas * satilanBas;
  const kazanilanKg = girisKg !== null ? (satisKgBas - girisKg) * bas : 0;
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
    basBasiKar: Math.round(kar / bas),
    satisKgBas: Math.round(satisKgBas * 10) / 10,
    satilanBas: Math.round(satilanBas * 100) / 100,
    basabasKgFiyat: satilanKg > 0 ? Math.round((toplam / satilanKg) * 100) / 100 : null,
    yemDonusumOrani: kazanilanKg > 0 ? Math.round((yemKgToplam / kazanilanKg) * 100) / 100 : null,
    gunlukBasKar: ufuk > 0 ? Math.round(kar / bas / ufuk) : null,
    dilimDokum,
  };
}
