import type { AdgKanitSenaryo } from './besi-adg-kanit';
import { kanitGcaa } from './besi-adg-kanit';
import type { BesiPlanDonemGirdi } from './besi-plan-tipler';
import { planMaliyetVeKgGunHedef } from './dongu-ekonomi-hesap';
import type { BesiPlanIrkTaslak } from './besi-plan-irk';
import { efektifGcaaGramGun } from './besi-plan-irk';
import type { BesiPlanBeslemeTaslak } from './besi-plan-besleme';
import { varsayilanBeslemeTaslak } from './besi-plan-besleme';

export type AdgSenaryoTur = 'plan_gcaa' | 'olcum_pencere' | 'iyimser_max' | 'senaryo_taban';

export { hedefCanliKgKanit, kanitGcaa, type AdgKanitSenaryo } from './besi-adg-kanit';

export type AdgSenaryoGirdi = {
  tur: AdgSenaryoTur;
  girisKg: number;
  hedefGun: 60 | 90;
  donemler: BesiPlanDonemGirdi[];
  adgKanitSenaryo?: AdgKanitSenaryo;
  /** Ölçüm penceresinden g/gün — gerçek tartım */
  olcumGcaaGramGun?: number | null;
  olcumBas?: string | null;
  olcumBit?: string | null;
  kapsam?: string | null;
  /** İyimser üst senaryo — kanıt yoksa kullanıcı açar */
  iyimserGcaaGramGun?: number | null;
  irkTaslak?: BesiPlanIrkTaslak | null;
  beslemeTaslak?: BesiPlanBeslemeTaslak | null;
};

export type HedefKgSonuc = {
  hedefGun: number;
  cikisKg: number | null;
  artisKg: number | null;
  gcaaKullanilan: number | null;
  kaynak: AdgSenaryoTur;
  senaryoTabanli: boolean;
  uyari: string[];
  guvenilirlik: 'olcum' | 'plan' | 'iyimser' | 'eksik';
};

const MAX_GCAA_UYARI = 350;

export function ortalamaPlanGcaa(donemler: BesiPlanDonemGirdi[], hedefGun: number): number | null {
  let toplamArtis = 0;
  let gun = 0;
  let kalan = hedefGun;
  for (const d of donemler) {
    if (kalan <= 0) break;
    const parca = Math.min(d.gun, kalan);
    const gcaa = d.gcaaGramGun ?? 0;
    toplamArtis += (gcaa / 1000) * parca;
    gun += parca;
    kalan -= parca;
  }
  if (gun < hedefGun) return null;
  return Math.round((toplamArtis / gun) * 1000 * 10) / 10;
}

export function hedefKgHesapla(g: AdgSenaryoGirdi): HedefKgSonuc {
  const uyari: string[] = [];
  const plan = planMaliyetVeKgGunHedef(g.girisKg, g.donemler, g.hedefGun);

  let gcaa: number | null = null;
  let kaynak = g.tur;
  let guvenilirlik: HedefKgSonuc['guvenilirlik'] = 'eksik';
  let senaryoTabanli = true;

  if (g.tur === 'olcum_pencere') {
    if (g.olcumGcaaGramGun != null && g.olcumGcaaGramGun > 0) {
      gcaa = g.olcumGcaaGramGun;
      guvenilirlik = 'olcum';
      senaryoTabanli = false;
      if (!g.olcumBas || !g.olcumBit) uyari.push('Ölçüm penceresi tarihi eksik — senaryo etiketi korunur');
    } else {
      uyari.push('Ölçüm ADG yok — senaryo_taban kullanılmaz, çıkış hesaplanmaz');
      return {
        hedefGun: g.hedefGun,
        cikisKg: null,
        artisKg: null,
        gcaaKullanilan: null,
        kaynak,
        senaryoTabanli: true,
        uyari,
        guvenilirlik: 'eksik',
      };
    }
  } else if (g.tur === 'iyimser_max') {
    gcaa = g.iyimserGcaaGramGun ?? ortalamaPlanGcaa(g.donemler, g.hedefGun);
    guvenilirlik = 'iyimser';
    uyari.push('İyimser üst senaryo — genetik tavan garantisi değil');
    if (gcaa != null && gcaa > MAX_GCAA_UYARI) uyari.push(`GCAA ${gcaa} g/gün şüpheli — doğrulama gerekir`);
  } else if (g.tur === 'senaryo_taban') {
    const irk = g.irkTaslak;
    const besleme = g.beslemeTaslak ?? varsayilanBeslemeTaslak();
    if (irk && g.adgKanitSenaryo) {
      const ef = efektifGcaaGramGun(g.adgKanitSenaryo, irk, besleme);
      gcaa = g.olcumGcaaGramGun ?? ef.gcaa ?? null;
    } else {
      const k = g.adgKanitSenaryo != null ? kanitGcaa(g.adgKanitSenaryo) : null;
      gcaa = g.olcumGcaaGramGun ?? k?.gcaaGramGun ?? null;
    }
    guvenilirlik = g.olcumGcaaGramGun != null ? 'olcum' : gcaa != null ? 'plan' : 'eksik';
    uyari.push('Irk+besleme bandı — ölçüm varsa öncelik ölçümde');
  } else {
    gcaa = ortalamaPlanGcaa(g.donemler, g.hedefGun);
    guvenilirlik = gcaa != null ? 'plan' : 'eksik';
  }

  if (gcaa != null && plan) {
    return {
      hedefGun: g.hedefGun,
      cikisKg: plan.cikisKg,
      artisKg: plan.artisKg,
      gcaaKullanilan: gcaa,
      kaynak,
      senaryoTabanli,
      uyari,
      guvenilirlik,
    };
  }

  if (gcaa != null) {
    const artis = (gcaa / 1000) * g.hedefGun;
    const cikis = Math.round((g.girisKg + artis) * 10) / 10;
    return {
      hedefGun: g.hedefGun,
      cikisKg: cikis,
      artisKg: Math.round(artis * 100) / 100,
      gcaaKullanilan: gcaa,
      kaynak,
      senaryoTabanli,
      uyari,
      guvenilirlik,
    };
  }

  uyari.push(`${g.hedefGun} gün için plan fazları yetersiz`);
  return {
    hedefGun: g.hedefGun,
    cikisKg: null,
    artisKg: null,
    gcaaKullanilan: null,
    kaynak,
    senaryoTabanli: true,
    uyari,
    guvenilirlik: 'eksik',
  };
}

export type UfukKarsilastirma = {
  gun60: HedefKgSonuc;
  gun90: HedefKgSonuc;
  yem60: number | null;
  yem90: number | null;
  not: string;
};

export function karsilastir60ve90(
  girisKg: number,
  donemler: BesiPlanDonemGirdi[],
  tur: AdgSenaryoTur,
  adgKanitSenaryo?: AdgKanitSenaryo,
  irkTaslak?: BesiPlanIrkTaslak | null,
  beslemeTaslak?: BesiPlanBeslemeTaslak | null,
): UfukKarsilastirma {
  const ek = { irkTaslak, beslemeTaslak: beslemeTaslak ?? varsayilanBeslemeTaslak() };
  const gun60 = hedefKgHesapla({ tur, girisKg, hedefGun: 60, donemler, adgKanitSenaryo, ...ek });
  const gun90 = hedefKgHesapla({ tur, girisKg, hedefGun: 90, donemler, adgKanitSenaryo, ...ek });
  const p60 = planMaliyetVeKgGunHedef(girisKg, donemler, 60);
  const p90 = planMaliyetVeKgGunHedef(girisKg, donemler, 90);
  return {
    gun60,
    gun90,
    yem60: p60?.yemMaliyet ?? null,
    yem90: p90?.yemMaliyet ?? null,
    not: 'Aynı besleme yöntemi — faz tüketimi ve kg farkı plan girdilerinden',
  };
}
