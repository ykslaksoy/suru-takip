/**
 * t359u — karar simülasyonu (taslak); veteriner/muhasebe garantisi değil.
 */

import type { AdgKanitSenaryo } from './besi-adg-kanit';
import { kanitGcaa } from './besi-adg-kanit';
import type { BesiPlanIrkTaslak } from './besi-plan-irk';
import { efektifGcaaGramGun } from './besi-plan-irk';
import { hesaplaBrutKar, BRUT_KAR_ETIKET } from './besi-plan-brut-kar';
import type { BesiPiyasaOzetGirdi } from './besi-plan-piyasa-ozet';
import { hesaplaBesiPiyasaOzet } from './besi-plan-piyasa-ozet';
import { birimForSatisKaynak, cozPiyasaFiyat } from './besi-plan-piyasa-kaynak';
import { satisGelirBasHesapla, type SatisFiyatBirimi } from './besi-plan-satis';

const SENARYOLAR: AdgKanitSenaryo[] = ['muhafazakar', 'beklenen', 'iyimser'];

export type KararSatir = {
  senaryo: AdgKanitSenaryo;
  etiket: string;
  gcaa: number;
  gun60: { cikisKg: number; brutKar: number | null; satisBas: number | null; yemBas: number | null };
  gun90: { cikisKg: number; brutKar: number | null; satisBas: number | null; yemBas: number | null };
};

export type KararSimulasyonSonuc = {
  satirlar: KararSatir[];
  varsayilanSenaryo: AdgKanitSenaryo;
  breakevenCanliFiyatKg60: number | null;
  breakevenCanliFiyatKg90: number | null;
  duyarlilik: string[];
  netTamSonuc: number | null;
  netEksik: string[];
  sabitGiderBas: number | null;
  isletmeSerbestGiderBas: number | null;
  uyari: string[];
};

export type KararSimGirdi = BesiPiyasaOzetGirdi & {
  irkTaslak: BesiPlanIrkTaslak;
  basSayisi: number;
  isletmeGiderBas?: number | null;
  sabitYatirimIsletme?: number | null;
  olumOranYuzde?: number | null;
};

function cikisKg(girisKg: number, gun: number, senaryo: AdgKanitSenaryo, irk: BesiPlanIrkTaslak): number {
  if (irk.olcumGcaaGramGun != null) {
    return Math.round((girisKg + (irk.olcumGcaaGramGun / 1000) * gun) * 10) / 10;
  }
  const ef = efektifGcaaGramGun(senaryo, irk);
  const gcaa = ef.gcaa ?? kanitGcaa(senaryo).gcaaGramGun;
  return Math.round((girisKg + (gcaa / 1000) * gun) * 10) / 10;
}

function satisFiyatKg(g: KararSimGirdi, satisFiyatKgOverride: number | null): number | null {
  if (satisFiyatKgOverride != null) return satisFiyatKgOverride;
  return cozPiyasaFiyat(g.satisKaynak, g.kullaniciSatisFiyatKg, g.kullaniciBolgeSatisKg).fiyatKg;
}

function birimForKaynak(k: KararSimGirdi['satisKaynak']): SatisFiyatBirimi {
  return birimForSatisKaynak(k);
}

function ufukBrut(
  g: KararSimGirdi,
  senaryo: AdgKanitSenaryo,
  gun: 60 | 90,
  cikisKgVal: number,
  fiyatKg: number | null,
  birim: SatisFiyatBirimi,
) {
  const ozet = hesaplaBesiPiyasaOzet({ ...g, adgKanit: senaryo });
  const yemBas = gun === 60 ? ozet.ufuk60.yemBas : ozet.ufuk90.yemBas;
  const satis =
    fiyatKg != null
      ? satisGelirBasHesapla({ canliKg: cikisKgVal, birim, fiyatKg, karkasVerim: g.karkasVerim })
      : { gelirBas: null };
  return {
    brutKar: hesaplaBrutKar({ satisBas: satis.gelirBas, alisBas: g.alisBas, yemBas }).brutKar,
    satisBas: satis.gelirBas,
    yemBas,
  };
}

export function kararVarsayilanSenaryo(irk: BesiPlanIrkTaslak): AdgKanitSenaryo {
  if (irk.olcumGcaaGramGun != null) return 'beklenen';
  const karisik =
    irk.koken === 'pazar_toplama' && (irk.irkBilgi === 'irk_bilinmiyor' || irk.irkBilgi === 'irk_kismen');
  if (karisik || irk.hedefIrk === 'generic_kuzu') return 'muhafazakar';
  return 'beklenen';
}

export function hesaplaKararSimulasyon(g: KararSimGirdi, satisFiyatKgOverride: number | null): KararSimulasyonSonuc {
  const uyari = [
    'Ekran işletme kararı için taslak simülasyondur; stok/rasyon/hayvan kaydı yazmaz.',
    'Varış/uyumda artış düşük — 25 kg yeni gelen kuzu için muhafazakar başlangıç önerilir (NSW DPI).',
    'Ölüm oranı girilmeden düşülmez.',
  ];
  const varsayilanSenaryo = kararVarsayilanSenaryo(g.irkTaslak);
  const fiyatKg = satisFiyatKg(g, satisFiyatKgOverride);
  const birim = birimForKaynak(g.satisKaynak);

  const satirlar: KararSatir[] = SENARYOLAR.map((senaryo) => {
    const k = kanitGcaa(senaryo);
    const kg60 = cikisKg(g.girisKg, 60, senaryo, g.irkTaslak);
    const kg90 = cikisKg(g.girisKg, 90, senaryo, g.irkTaslak);
    const u60 = ufukBrut(g, senaryo, 60, kg60, fiyatKg, birim);
    const u90 = ufukBrut(g, senaryo, 90, kg90, fiyatKg, birim);
    return {
      senaryo,
      etiket: senaryo === 'muhafazakar' ? 'Alt aralık — yeni başlayan öneri' : k.not,
      gcaa: efektifGcaaGramGun(senaryo, g.irkTaslak).gcaa ?? k.gcaaGramGun,
      gun60: { cikisKg: kg60, ...u60 },
      gun90: { cikisKg: kg90, ...u90 },
    };
  });

  const muh = satirlar.find((s) => s.senaryo === 'muhafazakar')!;
  const breakeven60 =
    muh.gun60.cikisKg > 0 && muh.gun60.yemBas != null
      ? Math.round(((g.alisBas + muh.gun60.yemBas) / muh.gun60.cikisKg) * 100) / 100
      : null;
  const breakeven90 =
    muh.gun90.cikisKg > 0 && muh.gun90.yemBas != null
      ? Math.round(((g.alisBas + muh.gun90.yemBas) / muh.gun90.cikisKg) * 100) / 100
      : null;

  const duyarlilik: string[] = [];
  if (muh.gun60.brutKar != null) {
    duyarlilik.push(
      `Yem +%10 → brüt (60g, muh.) ≈ ${Math.round(muh.gun60.brutKar - (muh.gun60.yemBas ?? 0) * 0.1).toLocaleString('tr-TR')} ₺/baş`,
    );
    duyarlilik.push(
      `Satış −%5 → brüt ≈ ${Math.round(muh.gun60.brutKar - (muh.gun60.satisBas ?? 0) * 0.05).toLocaleString('tr-TR')} ₺/baş`,
    );
  }
  duyarlilik.push('Sıfır/negatif günlük artış yalnız tartım veya kullanıcı risk notu ile');

  const netEksik: string[] = [];
  const isletme = g.isletmeGiderBas;
  if (isletme == null) netEksik.push('İşletme gideri (sağlık/çoban payı vb.) — net hesap eksik');
  let netTamSonuc: number | null = null;
  if (muh.gun60.brutKar != null && isletme != null) {
    let net = muh.gun60.brutKar - isletme;
    if (g.olumOranYuzde != null && g.olumOranYuzde > 0) {
      net = Math.round(net * (1 - g.olumOranYuzde / 100) - g.alisBas * (g.olumOranYuzde / 100));
      uyari.push(`Ölüm %${g.olumOranYuzde} kullanıcı varsayımı`);
    }
    netTamSonuc = net;
  }

  return {
    satirlar,
    varsayilanSenaryo,
    breakevenCanliFiyatKg60: breakeven60,
    breakevenCanliFiyatKg90: breakeven90,
    duyarlilik,
    netTamSonuc,
    netEksik,
    sabitGiderBas: g.sabitYatirimIsletme ?? null,
    isletmeSerbestGiderBas: isletme ?? null,
    uyari,
  };
}

export { BRUT_KAR_ETIKET };
