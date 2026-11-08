import type { AdgKanitSenaryo } from './besi-adg-kanit';
import { hedefCanliKgKanit, kanitGcaa } from './besi-adg-kanit';
import type { BesiPlanDonemGirdi } from './besi-plan-tipler';
import { hesaplaBrutKar, type BrutKarSonuc } from './besi-plan-brut-kar';
import { hesaplaYemIllustrasyon60 } from './besi-plan-yem-illustrasyon';
import { karsilastir60ve90, type AdgSenaryoTur } from './besi-plan-adg';
import { piyasaKayitOku, type PiyasaFiyatKaydi } from './besi-piyasa-kayit';
import { efektifBirimFiyat } from './besi-referans-override';
import { satisGelirBasHesapla, type SatisFiyatBirimi } from './besi-plan-satis';
import { planMaliyetVeKgGunHedef } from './dongu-ekonomi-hesap';
import type { BesiModelBirlesik } from './besi-model-birles';
import type { BesiPlanIrkTaslak } from './besi-plan-irk';
import { efektifGcaaGramGun, irkAdgPolitikasi, varsayilanIrkTaslak } from './besi-plan-irk';
import type { BesiPlanBeslemeTaslak } from './besi-plan-besleme';
import { varsayilanBeslemeTaslak } from './besi-plan-besleme';
import { VERIM_KAVRAM, cozPlanAdg } from './besi-plan-adg-besleme';
import {
  birimForSatisKaynak,
  cozPiyasaFiyat,
  piyasaKarsilastirma,
  type KarsilastirmaSatiri,
  type PiyasaSatisKaynak,
} from './besi-plan-piyasa-kaynak';

export type { PiyasaSatisKaynak };

export type BesiPiyasaOzetGirdi = {
  girisKg: number;
  alisBas: number;
  satisKaynak: PiyasaSatisKaynak;
  kullaniciSatisFiyatKg?: number | null;
  kullaniciBolgeSatisKg?: number | null;
  satisBirimi: SatisFiyatBirimi;
  karkasVerim: number | null;
  adgSenaryo: AdgSenaryoTur;
  adgKanit: AdgKanitSenaryo;
  donemler: BesiPlanDonemGirdi[];
  yemIllustrasyon: boolean;
  yemFireYuzde?: number | null;
  olcumGcaa?: number | null;
  irkTaslak?: BesiPlanIrkTaslak | null;
  beslemeTaslak?: BesiPlanBeslemeTaslak | null;
  teknikModel?: BesiModelBirlesik | null;
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
  karsilastirma: KarsilastirmaSatiri[];
  kanit: ReturnType<typeof kanitGcaa>;
  irkPolitikasi: ReturnType<typeof irkAdgPolitikasi>;
  ufuk60: UfukEkonomi;
  ufuk90: UfukEkonomi;
  uyari: string[];
};

function yemBas(
  girisKg: number,
  gun: number,
  donemler: BesiPlanDonemGirdi[],
  illustrasyon: boolean,
  fireYuzde: number | null | undefined,
  besleme: BesiPlanBeslemeTaslak,
): { tutar: number | null; kaynak: UfukEkonomi['yemKaynak'] } {
  const plan = planMaliyetVeKgGunHedef(girisKg, donemler, gun);
  if (plan && plan.yemMaliyet > 0) return { tutar: plan.yemMaliyet, kaynak: 'plan_faz' };
  if (illustrasyon) {
    const ill = hesaplaYemIllustrasyon60({ aktif: true, fireYuzde, beslemeYontem: besleme.yontem });
    const baz = ill.fireDahil ?? ill.araToplam;
    const t = baz != null && Number.isFinite(baz) ? Math.round((baz / 60) * gun * 100) / 100 : null;
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
  const besleme = g.beslemeTaslak ?? varsayilanBeslemeTaslak();
  const kars = karsilastir60ve90(g.girisKg, g.donemler, g.adgSenaryo, g.adgKanit, g.irkTaslak, besleme);
  const h = gun === 60 ? kars.gun60 : kars.gun90;
  let cikisKg = h.cikisKg;
  const irk = g.irkTaslak;
  const model = g.teknikModel ?? undefined;
  const efektif = irk ? efektifGcaaGramGun(g.adgKanit, irk, besleme, model) : null;
  if (efektif?.gcaa != null) {
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
  const yem = yemBas(g.girisKg, gun, g.donemler, g.yemIllustrasyon, g.yemFireYuzde, besleme);
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
  const model = g.teknikModel ?? undefined;
  const uyari = [
    'TOBB/UKON sunucu proxy ile yenilenir; Balıkesir PDF manuel/bayat.',
    '8 model tablo max kazanç kanıt değil.',
  ];
  const refPx = cozPiyasaFiyat(g.satisKaynak, g.kullaniciSatisFiyatKg, g.kullaniciBolgeSatisKg);
  const satisOv = efektifBirimFiyat(refPx.fiyatKg, 'satis_canli_kg');
  const px = {
    ...refPx,
    fiyatKg: satisOv.deger,
    varsayim: refPx.varsayim || satisOv.kaynak === 'override',
  };
  if (satisOv.kaynak === 'override') uyari.push('Satış fiyatı kullanıcı override — referans korunur.');
  uyari.push(...px.eksik);
  uyari.push('Gelecek fiyat garantisi yok — gömülü referans + plan varsayımı.');
  const birim = birimForSatisKaynak(g.satisKaynak);
  if (g.satisKaynak === 'balikesir_kemikli') {
    uyari.push('Balıkesir kemikli et fiyatı — canlı kg değil; verim ile çevirmeyin');
  }
  if (px.varsayim) uyari.push('Seçili satış fiyatı kullanıcı varsayımı — resmi borsa değil.');

  const irkPolitikasi = irkAdgPolitikasi(g.irkTaslak ?? varsayilanIrkTaslak());
  uyari.push(...irkPolitikasi.uyari.slice(0, 2));
  const besleme = g.beslemeTaslak ?? varsayilanBeslemeTaslak();
  const adgCoz = cozPlanAdg(g.adgKanit, g.irkTaslak ?? varsayilanIrkTaslak(), besleme, model);
  uyari.push(
    `ADG bandı ${adgCoz.grup}: muh ${adgCoz.muhafazakar} / bek ${adgCoz.beklenen} / iyim ${adgCoz.iyimser} g·gün`,
  );
  uyari.push(...adgCoz.uyari.slice(0, 2));
  uyari.push(VERIM_KAVRAM.not);

  const efektifKanit = efektifGcaaGramGun(g.adgKanit, g.irkTaslak ?? varsayilanIrkTaslak(), besleme, model);

  return {
    piyasa: piyasaKayitOku().kayitlar,
    karsilastirma: piyasaKarsilastirma(g.satisKaynak),
    kanit: {
      ...kanitGcaa(g.adgKanit),
      gcaaGramGun: efektifKanit.gcaa ?? kanitGcaa(g.adgKanit).gcaaGramGun,
      kaynakAd: efektifKanit.kaynak,
    },
    irkPolitikasi,
    ufuk60: ufuk(60, g, px.fiyatKg, birim),
    ufuk90: ufuk(90, g, px.fiyatKg, birim),
    uyari,
  };
}

