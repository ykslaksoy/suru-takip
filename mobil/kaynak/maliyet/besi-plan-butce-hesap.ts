import type { BesiPlanDonemGirdi } from './besi-plan-tipler';
import type { ButceSatir, ButceTaslak, OrtakGiderPaylasim } from './besi-plan-butce-tipler';
import { cozPlanAlisBas } from './besi-plan-alis';
import { planMaliyetVeKgGunHedef } from './dongu-ekonomi-hesap';

export const USER_FEED_DRAFT_IDS = ['kesif', 'yonca', 'saman'] as const;

export type MutabakatSatir = { etiket: string; tutar: number | null; not?: string };

export type ButceMutabakatSonuc = {
  /** Eski kullanıcı tablosu (tüm aktif işletme satırları) */
  isletmeKalemler: MutabakatSatir[];
  listelenenToplam: number;
  taslakDisiKalemler: MutabakatSatir[];
  kullaniciIddiaToplam: number | null;
  aciklanmamisFark: number | null;
  farkAciklama: string | null;
  satisGelirBas: number | null;
  /** Eski tablo dengesi — yeni karşılaştırma değil */
  isletmeOncesiDenge: number | null;
  dengeEtiket: string;
  /** t349u — plan motoru + alış override; yem taslakları hariç */
  yeniKarsilastirmaSatirlar: MutabakatSatir[];
  yeniKarsilastirmaToplam: number | null;
  yeniKarsilastirmaDenge: number | null;
  yeniDengeEtiket: string;
  planYemGun: number;
  planYemMaliyetBas: number | null;
  planYemEksik: string[];
  ortakGiderHam: number | null;
  ortakPaylasim: number | null;
  ortakBasBasi: number | null;
  ortakEksik: string[];
  yatirimFaz1: number | null;
  yatirimFaz2: number | null;
  yatirimToplamSecili: number | null;
  nakitGereksinimNot: string;
  uyari: string[];
};

function satirTutar(s: ButceSatir, basSayisi: number): number | null {
  if (s.degerDurumu === 'bilinmiyor') return null;
  if (s.degerDurumu === 'sifir_uygulanmaz') return 0;
  if (s.tutar == null) return null;
  /** İşletme satırları ₺/baş — sürü adediyle çarpılmaz (mutabakat başına). */
  if (s.birim === 'bas') return Math.round(s.tutar);
  if (s.birim === 'adet') return Math.round(s.tutar);
  return Math.round(s.tutar);
}

function satirMutabakat(s: ButceSatir, basSayisi: number, extraNot?: string): MutabakatSatir {
  const t = satirTutar(s, basSayisi);
  const notlar = [extraNot, s.not, s.kaynak === 'kullanici_girdi' ? 'kullanıcı tahmini' : undefined].filter(Boolean);
  return { etiket: s.etiket, tutar: t, not: notlar.join(' · ') || undefined };
}

export function isletmeKalemlerToplam(satirlar: ButceSatir[], basSayisi: number): { satirlar: MutabakatSatir[]; toplam: number } {
  const isletme = satirlar.filter((s) => s.sinif === 'besi_isletme');
  const out: MutabakatSatir[] = [];
  let toplam = 0;
  let eksik = false;
  for (const s of isletme) {
    const t = satirTutar(s, basSayisi);
    if (t == null) eksik = true;
    else toplam += t;
    out.push(satirMutabakat(s, basSayisi));
  }
  return { satirlar: out, toplam: eksik ? NaN : toplam };
}

export function yeniKarsilastirmaIsletme(
  satirlar: ButceSatir[],
  basSayisi: number,
  planYemMaliyetBas: number | null,
  planYemGun: number,
): { satirlar: MutabakatSatir[]; toplam: number | null; eksik: string[] } {
  const eksik: string[] = [];
  const out: MutabakatSatir[] = [];
  let toplam = 0;
  let tutarEksik = false;

  for (const s of satirlar.filter((x) => x.sinif === 'besi_isletme')) {
    if (s.karsilastirmaHaric || USER_FEED_DRAFT_IDS.includes(s.id as (typeof USER_FEED_DRAFT_IDS)[number])) {
      continue;
    }
    const t = satirTutar(s, basSayisi);
    if (t == null) tutarEksik = true;
    else toplam += t;
    out.push(satirMutabakat(s, basSayisi, 'yeni karşılaştırma'));
  }

  if (planYemMaliyetBas == null) {
    eksik.push(`${planYemGun} gün plan yem maliyeti hesaplanamadı — eksik faz ₺/kg veya kg/baş/gün`);
  } else {
    toplam += planYemMaliyetBas;
    out.push({
      etiket: `Plan yem (${planYemGun} gün)`,
      tutar: planYemMaliyetBas,
      not: 'Plan dönemleri — kullanıcı yem tablosu (1080/270/80) değil',
    });
  }

  if (tutarEksik) eksik.push('İşletme satırında bilinmeyen tutar');
  return { satirlar: out, toplam: eksik.length ? null : toplam, eksik };
}

export function ortakGiderMutabakat(o: OrtakGiderPaylasim): {
  hamToplam: number | null;
  paylasilan: number | null;
  basBasi: number | null;
  eksik: string[];
} {
  const eksik: string[] = [];
  const parts = [o.kira, o.coban, o.elektrik, o.digerToplam];
  if (parts.every((p) => p == null)) return { hamToplam: null, paylasilan: null, basBasi: null, eksik: ['Ortak gider girilmedi'] };
  const ham = parts.reduce((s, p) => s + (p ?? 0), 0);
  if (o.donem === 'bilinmiyor') {
    eksik.push('Ortak gider dönemi bilinmiyor — 142.000 TL otomatik 90 güne bölünmez');
    return { hamToplam: ham, paylasilan: null, basBasi: null, eksik };
  }
  if (o.payBasSayisi == null || o.payBasSayisi < 1) {
    eksik.push('Paylaşım hayvan sayısı bilinmiyor');
    return { hamToplam: ham, paylasilan: null, basBasi: null, eksik };
  }
  if (o.donemAdet == null || o.donemAdet < 1) {
    eksik.push('Dönem adedi bilinmiyor');
    return { hamToplam: ham, paylasilan: null, basBasi: null, eksik };
  }
  const paylasilan = Math.round(ham);
  const basBasi = Math.round(ham / o.payBasSayisi);
  return { hamToplam: ham, paylasilan, basBasi, eksik };
}

export type ButcePlanYemGirdi = {
  girisKg: number | null;
  donemler: BesiPlanDonemGirdi[];
};

export function hesaplaButceMutabakat(
  taslak: ButceTaslak,
  basSayisi: number,
  planAlis?: Parameters<typeof cozPlanAlisBas>[0],
  planYem?: ButcePlanYemGirdi,
): ButceMutabakatSonuc {
  const uyari = [
    'Rakamlar kullanıcı tahmini — teklif veya piyasa doğrulaması yok.',
    'Açıklanmamış fark için otomatik «diğer maliyet» eklenmez.',
    '28,20 ₺/gün veya 1.692/60 gün doğrulanmış hesap değil — kullanılmaz.',
    'Yeni karşılaştırma: plan motoru yem + alış override; eski yem satırları taslak.',
  ];

  let satirlar = [...taslak.satirlar];
  if (planAlis) {
    const coz = cozPlanAlisBas(planAlis);
    const alisSatir = satirlar.find((s) => s.id === 'alis-kuzu');
    if (alisSatir && alisSatir.degerDurumu === 'bilinmiyor' && coz.alisBas != null) {
      satirlar = satirlar.map((s) =>
        s.id === 'alis-kuzu'
          ? { ...s, tutar: coz.alisBas, degerDurumu: 'tutar' as const, kaynak: 'hesaplanan' as const, not: coz.etiket }
          : s,
      );
    }
  }

  const { satirlar: isletmeKalemler, toplam: listelenenToplam } = isletmeKalemlerToplam(satirlar, basSayisi);
  const taslakDisiKalemler = satirlar
    .filter(
      (s) =>
        s.sinif === 'besi_isletme' &&
        (s.karsilastirmaHaric || USER_FEED_DRAFT_IDS.includes(s.id as (typeof USER_FEED_DRAFT_IDS)[number])),
    )
    .map((s) => satirMutabakat(s, basSayisi, 'taslak — yeni karşılaştırmada yok'));

  const planYemGun = Math.max(1, Math.floor(taslak.karsilastirmaGun ?? 60));
  let planYemMaliyetBas: number | null = null;
  const planYemEksik: string[] = [];
  if (planYem?.girisKg != null && planYem.girisKg > 0) {
    const p = planMaliyetVeKgGunHedef(planYem.girisKg, planYem.donemler, planYemGun);
    if (p) planYemMaliyetBas = p.yemMaliyet;
    else planYemEksik.push('Plan fazlarında yem kg veya ₺/kg eksik — 0 yazılmaz');
  } else {
    planYemEksik.push('Giriş kg girilince plan yem hesaplanır');
  }

  const yeniK = yeniKarsilastirmaIsletme(satirlar, basSayisi, planYemMaliyetBas, planYemGun);
  planYemEksik.push(...yeniK.eksik.filter((e) => !planYemEksik.includes(e)));
  const iddia = taslak.kullaniciIddiaToplamMaliyet;
  let aciklanmamisFark: number | null = null;
  let farkAciklama: string | null = null;
  if (iddia != null && Number.isFinite(listelenenToplam)) {
    aciklanmamisFark = Math.round(iddia - listelenenToplam);
    if (aciklanmamisFark !== 0) {
      farkAciklama = `Listelenen ${listelenenToplam.toLocaleString('tr-TR')} ₺ ≠ iddia ${iddia.toLocaleString('tr-TR')} ₺ · fark ${aciklanmamisFark.toLocaleString('tr-TR')} ₺ (başka kalem eklenmedi)`;
      uyari.push(farkAciklama);
    }
  }

  const satis = taslak.satisGelirBas;
  const isletmeOncesiDenge =
    satis != null && Number.isFinite(listelenenToplam) ? Math.round(satis - listelenenToplam) : null;
  const yeniKarsilastirmaDenge =
    satis != null && yeniK.toplam != null ? Math.round(satis - yeniK.toplam) : null;

  const ortak = ortakGiderMutabakat(taslak.ortak);
  const y1 =
    taslak.yatirim.faz1Aktif && taslak.yatirim.citTelSuluk != null && taslak.yatirim.yemDagitimMakinesi != null
      ? (taslak.yatirim.citTelSuluk ?? 0) + (taslak.yatirim.yemDagitimMakinesi ?? 0)
      : taslak.yatirim.faz1Aktif
        ? null
        : 0;
  const y2 = taslak.yatirim.faz2Sonra
    ? [taslak.yatirim.sagmilMakinesi, taslak.yatirim.rfidSuruTakip, taslak.yatirim.yemKirici].every((x) => x != null)
      ? (taslak.yatirim.sagmilMakinesi ?? 0) + (taslak.yatirim.rfidSuruTakip ?? 0) + (taslak.yatirim.yemKirici ?? 0)
      : null
    : 0;

  return {
    isletmeKalemler,
    listelenenToplam: Number.isFinite(listelenenToplam) ? listelenenToplam : NaN,
    taslakDisiKalemler,
    kullaniciIddiaToplam: iddia,
    aciklanmamisFark,
    farkAciklama,
    satisGelirBas: satis,
    isletmeOncesiDenge,
    dengeEtiket: 'Eski tablo dengesi (13580 tipi; yem taslakları dahil — net kâr değil)',
    yeniKarsilastirmaSatirlar: yeniK.satirlar,
    yeniKarsilastirmaToplam: yeniK.toplam,
    yeniKarsilastirmaDenge,
    yeniDengeEtiket: 'Yeni karşılaştırma dengesi (plan yem + alış; ortak/yatırım hariç)',
    planYemGun,
    planYemMaliyetBas,
    planYemEksik: [...new Set(planYemEksik)],
    ortakGiderHam: ortak.hamToplam,
    ortakPaylasim: ortak.paylasilan,
    ortakBasBasi: ortak.basBasi,
    ortakEksik: ortak.eksik,
    yatirimFaz1: y1,
    yatirimFaz2: y2,
    yatirimToplamSecili: y1 != null && y2 != null ? y1 + y2 : null,
    nakitGereksinimNot:
      'Yatırım ve damızlık alımları işletme dönem kârından ayrı nakit / sermaye ihtiyacıdır; amortisman girilmeden tam tutar düşülmez.',
    uyari,
  };
}

/** Kullanıcı örneği (12000/14500) — düzenlenebilir başlangıç, doğrulanmamış */
export function ornekButce12000(): ButceTaslak {
  return {
    kullaniciIddiaToplamMaliyet: 14500,
    satisGelirBas: 17000,
    rfidCipAdet: null,
    rfidCipUcret: 100,
    satirlar: [
      {
        id: 'alis-kuzu',
        etiket: 'Kuzu alış',
        sinif: 'besi_isletme',
        degerDurumu: 'tutar',
        tutar: 12000,
        birim: 'bas',
        kaynak: 'kullanici_girdi',
        not: '₺/baş — 500×25=12500 senaryosu override edebilir',
      },
      {
        id: 'kesif',
        etiket: 'Kesif yem',
        sinif: 'besi_isletme',
        degerDurumu: 'tutar',
        tutar: 1080,
        birim: 'bas',
        kaynak: 'kullanici_girdi',
        karsilastirmaHaric: true,
        not: 'Eski kullanıcı tablosu — doğrulanmış fiyat değil',
      },
      {
        id: 'yonca',
        etiket: 'Yonca',
        sinif: 'besi_isletme',
        degerDurumu: 'tutar',
        tutar: 270,
        birim: 'bas',
        kaynak: 'kullanici_girdi',
        karsilastirmaHaric: true,
        not: 'Eski kullanıcı tablosu',
      },
      {
        id: 'asi',
        etiket: 'Aşı',
        sinif: 'besi_isletme',
        degerDurumu: 'tutar',
        tutar: 150,
        birim: 'bas',
        kaynak: 'kullanici_girdi',
      },
      {
        id: 'saman',
        etiket: 'Saman',
        sinif: 'besi_isletme',
        degerDurumu: 'tutar',
        tutar: 80,
        birim: 'bas',
        kaynak: 'kullanici_girdi',
        karsilastirmaHaric: true,
        not: 'Eski kullanıcı tablosu',
      },
      {
        id: 'koyun-damizlik',
        etiket: 'Damızlık koyun alışı',
        sinif: 'damizlik_varlik',
        degerDurumu: 'bilinmiyor',
        tutar: 35000,
        birim: 'bas',
        kaynak: 'bilinmiyor',
        not: 'Bitirme kuzu gideri değil',
      },
      {
        id: 'koc-damizlik',
        etiket: 'Koç alışı',
        sinif: 'damizlik_varlik',
        degerDurumu: 'bilinmiyor',
        tutar: 80000,
        birim: 'bas',
        kaynak: 'bilinmiyor',
      },
    ],
    ortak: {
      kira: 30000,
      coban: 80000,
      elektrik: 2000,
      digerToplam: 30000,
      donem: 'bilinmiyor',
      donemAdet: null,
      payBasSayisi: null,
    },
    karsilastirmaGun: 60,
    yemFiyatKaynakTarih: null,
    fazYemVarsayimNot: 'Plan dönemleri kg/baş/gün ve ₺/kg — araştırma bekleniyor',
    yatirim: {
      faz1Aktif: false,
      citTelSuluk: 100000,
      yemDagitimMakinesi: 300000,
      faz2Sonra: false,
      sagmilMakinesi: 60000,
      rfidSuruTakip: 400000,
      yemKirici: 300000,
      amortismanYil: null,
      hurdaDeger: null,
    },
  };
}

export function ornekButce12500(): ButceTaslak {
  const b = ornekButce12000();
  const satirlar = b.satirlar.map((s) =>
    s.id === 'alis-kuzu' ? { ...s, tutar: 12500, not: '500 ₺/kg × 25 kg plan varsayımı' } : s,
  );
  return { ...b, satirlar, kullaniciIddiaToplamMaliyet: null };
}
