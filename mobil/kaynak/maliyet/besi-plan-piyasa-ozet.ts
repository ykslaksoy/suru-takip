import type { AdgKanitSenaryo } from './besi-adg-kanit';
import { hedefCanliKgKanit, kanitGcaa } from './besi-adg-kanit';
import type { BesiPlanDonemGirdi } from './besi-plan-tipler';
import { hesaplaBrutKar, type BrutKarSonuc } from './besi-plan-brut-kar';
import { hesaplaYemIllustrasyon60 } from './besi-plan-yem-illustrasyon';
import { karsilastir60ve90, type AdgSenaryoTur } from './besi-plan-adg';
import { gomuluPiyasaKayitlari, type PiyasaFiyatKaydi } from './besi-piyasa-kayit';
import { satisGelirBasHesapla, type SatisFiyatBirimi } from './besi-plan-satis';
import { planMaliyetVeKgGunHedef } from './dongu-ekonomi-hesap';
import type { BesiPlanIrkTaslak } from './besi-plan-irk';
import { efektifGcaaGramGun, irkAdgPolitikasi, varsayilanIrkTaslak } from './besi-plan-irk';

export type PiyasaSatisKaynak = 'edirne_tobb' | 'ukon' | 'balikesir_canli' | 'balikesir_kemikli' | 'kullanici_senaryo';

export type BesiPiyasaOzetGirdi = {
  girisKg: number;
  alisBas: number;
  satisKaynak: PiyasaSatisKaynak;
  kullaniciSatisFiyatKg?: number | null;
  satisBirimi: SatisFiyatBirimi;
  karkasVerim: number | null;
  adgSenaryo: AdgSenaryoTur;
  adgKanit: AdgKanitSenaryo;
  donemler: BesiPlanDonemGirdi[];
  yemIllustrasyon: boolean;
  yemFireYuzde?: number | null;
  olcumGcaa?: number | null;
  irkTaslak?: BesiPlanIrkTaslak | null;
};

export type UfukEkonomi = {
  gun: 60 | 90;
  cikisKg: number | null;
  satisBas: number | null;
  yemBas: number | null;
  brutKar: BrutKarSonuc;
  yemKaynak: 'plan_faz' | 'illustrasyon' | 'eksik';
};

export type BesiPiyasaOzet = {
  piyasa: PiyasaFiyatKaydi[];
  kanit: ReturnType<typeof kanitGcaa>;
  irkPolitikasi: ReturnType<typeof irkAdgPolitikasi>;
  ufuk60: UfukEkonomi;
  ufuk90: UfukEkonomi;
  uyari: string[];
};

function piyasaFiyat(
  kaynak: PiyasaSatisKaynak,
  kullanici: number | null | undefined,
): { fiyatKg: number | null; kayit: PiyasaFiyatKaydi | null; eksik: string[] } {
  const all = gomuluPiyasaKayitlari();
  const eksik: string[] = [];
  if (kaynak === 'kullanici_senaryo') {
    return { fiyatKg: kullanici ?? null, kayit: null, eksik: kullanici == null ? ['Kullanıcı senaryo fiyatı'] : [] };
  }
  const id =
    kaynak === 'edirne_tobb'
      ? 'tobb-edirne-kasaplik-kuzu'
      : kaynak === 'ukon'
        ? 'ukon-karkas-yagsiz-kuzu'
        : kaynak === 'balikesir_canli'
          ? 'balikesir-kuzu-canli-kg-agustos2026'
          : 'balikesir-kuzu-kemikli-eylul2026';
  const kayit = all.find((k) => k.id === id);
  if (!kayit?.deger) {
    eksik.push(`${kaynak} fiyatı yok`);
    return { fiyatKg: null, kayit: kayit ?? null, eksik };
  }
  return { fiyatKg: kayit.deger, kayit, eksik };
}

function yemBas(
  girisKg: number,
  gun: number,
  donemler: BesiPlanDonemGirdi[],
  illustrasyon: boolean,
  fireYuzde: number | null | undefined,
): { tutar: number | null; kaynak: UfukEkonomi['yemKaynak'] } {
  const plan = planMaliyetVeKgGunHedef(girisKg, donemler, gun);
  if (plan && plan.yemMaliyet > 0) return { tutar: plan.yemMaliyet, kaynak: 'plan_faz' };
  if (illustrasyon) {
    const ill = hesaplaYemIllustrasyon60({ aktif: true, fireYuzde });
    const t = ill.fireDahil ?? ill.araToplam;
    return { tutar: t, kaynak: 'illustrasyon' };
  }
  return { tutar: null, kaynak: 'eksik' };
}

function ufuk(
  gun: 60 | 90,
  g: BesiPiyasaOzetGirdi,
  fiyatKg: number | null,
  birim: SatisFiyatBirimi,
): UfukEkonomi {
  const kars = karsilastir60ve90(g.girisKg, g.donemler, g.adgSenaryo, g.adgKanit);
  const h = gun === 60 ? kars.gun60 : kars.gun90;
  let cikisKg = h.cikisKg;
  const irk = g.irkTaslak;
  const efektif = irk ? efektifGcaaGramGun(g.adgKanit, irk) : null;
  if (irk?.olcumGcaaGramGun != null && efektif?.gcaa != null) {
    cikisKg = Math.round((g.girisKg + (efektif.gcaa / 1000) * gun) * 10) / 10;
  } else if (cikisKg == null) {
    cikisKg = hedefCanliKgKanit(g.girisKg, gun, g.adgKanit);
  }
  const satis =
    cikisKg != null && fiyatKg != null
      ? satisGelirBasHesapla({
          canliKg: cikisKg,
          birim,
          fiyatKg,
          karkasVerim: g.karkasVerim,
        })
      : { gelirBas: null, eksikler: ['Satış'] };
  const yem = yemBas(g.girisKg, gun, g.donemler, g.yemIllustrasyon, g.yemFireYuzde);
  const brutKar = hesaplaBrutKar({ satisBas: satis.gelirBas, alisBas: g.alisBas, yemBas: yem.tutar });
  return {
    gun,
    cikisKg,
    satisBas: satis.gelirBas,
    yemBas: yem.tutar,
    brutKar,
    yemKaynak: yem.kaynak,
  };
}

export function hesaplaBesiPiyasaOzet(g: BesiPiyasaOzetGirdi): BesiPiyasaOzet {
  const uyari = [
    'Sürekli canlı borsa güncellemesi yok — gömülü/önbellek + manuel içe aktarma.',
    '8 model tablo max kazanç kanıt değil.',
  ];
  const px = piyasaFiyat(g.satisKaynak, g.kullaniciSatisFiyatKg);
  uyari.push(...px.eksik);
  let birim = g.satisBirimi;
  if (g.satisKaynak === 'ukon') birim = 'karkas_kg';
  if (g.satisKaynak === 'balikesir_kemikli') birim = 'karkas_kg';
  if (g.satisKaynak === 'edirne_tobb' || g.satisKaynak === 'balikesir_canli') birim = 'canli_kg';
  if (g.satisKaynak === 'balikesir_kemikli') {
    uyari.push('Balıkesir kemikli et fiyatı — canlı kg değil; verim ile çevirmeyin');
  }

  const irkPolitikasi = irkAdgPolitikasi(g.irkTaslak ?? varsayilanIrkTaslak());
  uyari.push(...irkPolitikasi.uyari.slice(0, 2));

  return {
    piyasa: gomuluPiyasaKayitlari(),
    kanit: kanitGcaa(g.adgKanit),
    irkPolitikasi,
    ufuk60: ufuk(60, g, px.fiyatKg, birim),
    ufuk90: ufuk(90, g, px.fiyatKg, birim),
    uyari,
  };
}

