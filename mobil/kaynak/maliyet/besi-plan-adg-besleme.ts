/**
 * t372u — ırk grubu + besleme yöntemi ile plan ADG (g/gün); 31 ırk sabiti yok.
 */
import type { AdgKanitSenaryo } from './besi-adg-kanit';
import type { BesiModelBirlesik } from './besi-model-birles';
import { pazarUyumYuzdeModel, varsayilanBesiModel } from './besi-model-birles';
import type { AdgGrupBandModel, AdgGrupKodu } from './besi-model-varsayilan';
import { VARSAYILAN_BESI_MODEL_GOVDE } from './besi-model-varsayilan';
import type { BesiPlanIrkTaslak } from './besi-plan-irk';
import { normalizeHedefIrkKodu } from './besi-plan-irk-katalog';
import { irkGrup } from './besi-plan-irk-katalog';
import {
  type BesiPlanBeslemeTaslak,
  varsayilanBeslemeTaslak,
} from './besi-plan-besleme';

export type { AdgGrupKodu, AdgGrupBandModel } from './besi-model-varsayilan';

/** Kullanıcıya gösterilen planlama grubu — deneme sabiti değil */
export const ADG_PLAN_GRUP_ETIKET: Record<AdgGrupKodu, string> = {
  genel_belirsiz: 'Belirsiz / karışık grup',
  yerli_koyun: 'Yerli koyun tipi (plan varsayımı)',
  merinos_tip: 'Merinos tipi (plan varsayımı)',
  gelistirilmis_melez: 'Geliştirilmiş melez (plan varsayımı)',
  yabanci_et: 'Yabancı et ırkı (plan varsayımı)',
};

export type AdgGrupBand = AdgGrupBandModel;

/** Kod varsayılanı — canlı model admin API ile birleştirilir */
export const ADG_GRUP_BAND: Record<AdgGrupKodu, AdgGrupBand> = VARSAYILAN_BESI_MODEL_GOVDE.adgGrupBand;

export type VerimKavramAciklama = {
  /** Karkas / canlı kg — kesim verimi */
  karkasDressingYuzde: 'karkas_verim_alani';
  /** Plan hedefe ulaşma — yalnız ölçüm veya kullanıcı girerse; varsayılan %100 yok */
  buyumeGerceklestirmeYuzde: 'yalniz_olcum_veya_kullanici';
  fcr: 'plan_faz_yem_artis';
  not: 'Verim% = karkas kesim veya ölçümlü büyüme; genetik max garanti değil',
};

export const VERIM_KAVRAM: VerimKavramAciklama = {
  karkasDressingYuzde: 'karkas_verim_alani',
  buyumeGerceklestirmeYuzde: 'yalniz_olcum_veya_kullanici',
  fcr: 'plan_faz_yem_artis',
  not: 'Verim% = karkas kesim veya ölçümlü büyüme; genetik max garanti değil',
};

export function adgGrupForIrk(t: BesiPlanIrkTaslak): AdgGrupKodu {
  const karisik =
    t.koken === 'pazar_toplama' && (t.irkBilgi === 'irk_bilinmiyor' || t.irkBilgi === 'irk_kismen');
  if (karisik || t.hedefIrk === 'generic_kuzu') return 'genel_belirsiz';

  const kod = normalizeHedefIrkKodu(t.hedefIrk);
  if (kod === 'karacabey_merinos' || kod === 'orta_anadolu_merinos' || kod === 'anadolu_merinos') {
    return 'merinos_tip';
  }
  const grup = irkGrup(kod);
  if (grup === 'gelistirilmis_melez') return 'gelistirilmis_melez';
  if (grup === 'yabanci') return 'yabanci_et';
  if (grup === 'plan_ozel') return 'genel_belirsiz';
  return 'yerli_koyun';
}

export type PlanAdgCozum = {
  grup: AdgGrupKodu;
  band: AdgGrupBand;
  muhafazakar: number;
  beklenen: number;
  iyimser: number;
  seciliGcaa: number | null;
  yeterliVeri: boolean;
  kaynakOzet: string;
  uyari: string[];
  senaryo: AdgKanitSenaryo;
};

function cinsiyetAyari(
  t: BesiPlanIrkTaslak,
  gcaa: number,
  uyari: string[],
  model: BesiModelBirlesik,
): number {
  if (t.cinsiyet === 'disi') {
    const d = model.beslemeKatsayi.disiGcaaDusus;
    uyari.push(`Dişi bitirme — −${d} g/gün plan varsayımı (admin modeli)`);
    return Math.max(120, gcaa - d);
  }
  return gcaa;
}

function beslemeAyari(
  t: BesiPlanIrkTaslak,
  b: BesiPlanBeslemeTaslak,
  band: AdgGrupBand,
  senaryo: AdgKanitSenaryo,
  uyari: string[],
  model: BesiModelBirlesik,
): { gcaa: number; yeterli: boolean } {
  let gcaa = senaryo === 'muhafazakar' ? band.muhafazakar : senaryo === 'iyimser' ? band.iyimser : band.beklenen;
  let yeterli = true;

  switch (b.yontem) {
    case 'mera_kaba': {
      const ek = model.beslemeKatsayi.meraMuhafazakarEkDusus;
      gcaa =
        senaryo === 'iyimser'
          ? band.beklenen
          : senaryo === 'beklenen'
            ? band.muhafazakar
            : Math.max(120, band.muhafazakar - ek);
      uyari.push('Mera/kaba ağırlık — senaryo bandı bir kademe düşürüldü (admin modeli)');
      break;
    }
    case 'ev_karisimi':
      if (!b.formulDogrulandi) {
        yeterli = false;
        if (senaryo === 'iyimser') gcaa = Math.min(gcaa, band.beklenen);
        uyari.push('Ev karışımı — formül/alım doğrulanmadı; iyimser üst sınır beklenen');
      }
      break;
    case 'belirsiz':
      yeterli = false;
      uyari.push('Besleme yöntemi belirsiz — muhafazakar band önerilir');
      if (senaryo !== 'muhafazakar') gcaa = Math.min(gcaa, band.beklenen);
      break;
    case 'karma':
      if (!b.formulDogrulandi) uyari.push('Karma yem — tam faz girilmeden orta band');
      break;
    case 'hazir_pellet':
      uyari.push('Hazır pelet — NSW feedlot bandı; günlük alım doğrulanmalı');
      break;
    default:
      break;
  }

  if (b.katkiSecildi && !b.formulDogrulandi) {
    uyari.push('Katkı işaretli — tam rasyon yok; ADG artırılmadı');
  }

  const dusus = pazarUyumYuzdeModel(model, t);
  if (dusus != null && dusus > 0) {
    gcaa = Math.round(gcaa * (1 - dusus / 100));
    uyari.push(`Pazar uyum düşüşü — admin modeli %${dusus} (araştırma değil)`);
  }

  gcaa = cinsiyetAyari(t, gcaa, uyari, model);
  return { gcaa, yeterli };
}

export function cozPlanAdg(
  senaryo: AdgKanitSenaryo,
  irk: BesiPlanIrkTaslak,
  besleme: BesiPlanBeslemeTaslak = varsayilanBeslemeTaslak(),
  model: BesiModelBirlesik = varsayilanBesiModel(),
): PlanAdgCozum {
  const uyari: string[] = [];

  if (irk.olcumGcaaGramGun != null && irk.olcumGcaaGramGun > 0) {
    return {
      grup: adgGrupForIrk(irk),
      band: model.adgGrupBand[adgGrupForIrk(irk)],
      muhafazakar: irk.olcumGcaaGramGun,
      beklenen: irk.olcumGcaaGramGun,
      iyimser: irk.olcumGcaaGramGun,
      seciliGcaa: irk.olcumGcaaGramGun,
      yeterliVeri: true,
      kaynakOzet: 'Gerçek tartım eğilimi — tahmin bandını geçersiz kılar; plan hedefi ayrı saklanır',
      uyari: ['Ölçüm ADG öncelikli — ırk/besleme bandı gösterim amaçlı'],
      senaryo,
    };
  }

  const grup = adgGrupForIrk(irk);
  const band = model.adgGrupBand[grup];
  const { gcaa, yeterli } = beslemeAyari(irk, besleme, band, senaryo, uyari, model);

  const kod = normalizeHedefIrkKodu(irk.hedefIrk);
  if (kod === 'pirlak') uyari.push('Pırlak (Pırıt) — yerli koyun grubu bandı; ırka özel deneme sabiti yok');
  if (kod === 'asaf') uyari.push('Asaf — geliştirilmiş melez bandı');

  return {
    grup,
    band,
    muhafazakar: band.muhafazakar,
    beklenen: band.beklenen,
    iyimser: band.iyimser,
    seciliGcaa: gcaa,
    yeterliVeri: yeterli,
    kaynakOzet: `${band.kaynakAd} · ${band.baglam}`,
    uyari,
    senaryo,
  };
}

export function hedefCikisKgAdg(
  girisKg: number,
  gun: number,
  cozum: PlanAdgCozum,
): number | null {
  if (cozum.seciliGcaa == null || cozum.seciliGcaa <= 0) return null;
  return Math.round((girisKg + (cozum.seciliGcaa / 1000) * gun) * 10) / 10;
}
