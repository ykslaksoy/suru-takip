/**
 * t372u — ırk grubu + besleme yöntemi ile plan ADG (g/gün); 31 ırk sabiti yok.
 */
import type { AdgKanitSenaryo } from './besi-adg-kanit';
import type { BesiPlanIrkTaslak } from './besi-plan-irk';
import { normalizeHedefIrkKodu } from './besi-plan-irk-katalog';
import { irkGrup } from './besi-plan-irk-katalog';
import {
  type BesiPlanBeslemeTaslak,
  varsayilanBeslemeTaslak,
} from './besi-plan-besleme';

export type AdgGrupKodu =
  | 'genel_belirsiz'
  | 'yerli_koyun'
  | 'merinos_tip'
  | 'gelistirilmis_melez'
  | 'yabanci_et';

/** Kullanıcıya gösterilen planlama grubu — deneme sabiti değil */
export const ADG_PLAN_GRUP_ETIKET: Record<AdgGrupKodu, string> = {
  genel_belirsiz: 'Belirsiz / karışık grup',
  yerli_koyun: 'Yerli koyun tipi (plan varsayımı)',
  merinos_tip: 'Merinos tipi (plan varsayımı)',
  gelistirilmis_melez: 'Geliştirilmiş melez (plan varsayımı)',
  yabanci_et: 'Yabancı et ırkı (plan varsayımı)',
};

export type AdgGrupBand = {
  muhafazakar: number;
  beklenen: number;
  iyimser: number;
  min: number;
  max: number;
  kaynakAd: string;
  kaynakUrl: string;
  baglam: string;
};

const NSW =
  'https://www.wool.com/globalassets/mmfs/resources/nsw-dpi-primefact_feedlotting-lambs.pdf';

export const ADG_GRUP_BAND: Record<AdgGrupKodu, AdgGrupBand> = {
  genel_belirsiz: {
    muhafazakar: 200,
    beklenen: 250,
    iyimser: 320,
    min: 150,
    max: 350,
    kaynakAd: 'NSW DPI Feedlotting lambs',
    kaynakUrl: NSW,
    baglam: '25 kg+ giriş, ırk belirsiz / karışık grup',
  },
  yerli_koyun: {
    muhafazakar: 180,
    beklenen: 230,
    iyimser: 280,
    min: 140,
    max: 300,
    kaynakAd: 'NSW DPI (feedlot kuzu bandı)',
    kaynakUrl: NSW,
    baglam: 'TR yerli koyun için düzenlenebilir plan bandı — ırk denemesi değil',
  },
  merinos_tip: {
    muhafazakar: 200,
    beklenen: 250,
    iyimser: 300,
    min: 160,
    max: 320,
    kaynakAd: 'NSW DPI (feedlot kuzu bandı)',
    kaynakUrl: NSW,
    baglam: 'Karacabey vb. katalog seçimi — TR besi denemesi sabiti yok',
  },
  gelistirilmis_melez: {
    muhafazakar: 210,
    beklenen: 260,
    iyimser: 310,
    min: 170,
    max: 330,
    kaynakAd: 'NSW DPI (feedlot kuzu bandı)',
    kaynakUrl: NSW,
    baglam: 'Asaf vb. için düzenlenebilir plan bandı — melez denemesi değil',
  },
  yabanci_et: {
    muhafazakar: 220,
    beklenen: 270,
    iyimser: 320,
    min: 180,
    max: 350,
    kaynakAd: 'NSW DPI (feedlot kuzu bandı)',
    kaynakUrl: NSW,
    baglam: 'Yabancı et ırkı — TR uyum farkı kullanıcı varsayımına bırakıldı',
  },
};

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

function cinsiyetAyari(t: BesiPlanIrkTaslak, gcaa: number, uyari: string[]): number {
  if (t.cinsiyet === 'disi') {
    uyari.push('Dişi bitirme — −15 g/gün plan varsayımı (çift ceza yok)');
    return Math.max(120, gcaa - 15);
  }
  return gcaa;
}

function beslemeAyari(
  t: BesiPlanIrkTaslak,
  b: BesiPlanBeslemeTaslak,
  band: AdgGrupBand,
  senaryo: AdgKanitSenaryo,
  uyari: string[],
): { gcaa: number; yeterli: boolean } {
  let gcaa = senaryo === 'muhafazakar' ? band.muhafazakar : senaryo === 'iyimser' ? band.iyimser : band.beklenen;
  let yeterli = true;

  switch (b.yontem) {
    case 'mera_kaba':
      gcaa =
        senaryo === 'iyimser'
          ? band.beklenen
          : senaryo === 'beklenen'
            ? band.muhafazakar
            : Math.max(120, band.muhafazakar - 15);
      uyari.push('Mera/kaba ağırlık — senaryo bandı bir kademe düşürüldü (varsayım)');
      break;
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

  const dusus = t.pazarUyumDususYuzde;
  if (
    t.koken === 'pazar_toplama' &&
    dusus != null &&
    Number.isFinite(dusus) &&
    dusus > 0 &&
    dusus <= 40
  ) {
    gcaa = Math.round(gcaa * (1 - dusus / 100));
    uyari.push(`Pazar uyum düşüşü — kullanıcı %${dusus} (plan varsayımı, araştırma değil)`);
  }

  gcaa = cinsiyetAyari(t, gcaa, uyari);
  return { gcaa, yeterli };
}

export function cozPlanAdg(
  senaryo: AdgKanitSenaryo,
  irk: BesiPlanIrkTaslak,
  besleme: BesiPlanBeslemeTaslak = varsayilanBeslemeTaslak(),
): PlanAdgCozum {
  const uyari: string[] = [];

  if (irk.olcumGcaaGramGun != null && irk.olcumGcaaGramGun > 0) {
    return {
      grup: adgGrupForIrk(irk),
      band: ADG_GRUP_BAND[adgGrupForIrk(irk)],
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
  const band = ADG_GRUP_BAND[grup];
  const { gcaa, yeterli } = beslemeAyari(irk, besleme, band, senaryo, uyari);

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
