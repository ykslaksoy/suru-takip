import type { BesiPlanDonemGirdi } from '@/kaynak/maliyet/besi-plan-tipler';
import type {
  AylikAdimKalem,
  DonguEkonomiGirdi,
  DonguEkonomiSonuc,
  PaylasimliKalem,
} from '@/kaynak/maliyet/dongu-maliyet-tipler';

const GUN_AY = 30;

/** Ay adımı: sözleşme minimumu ile; günlük orantı yok. */
export function aylikAdimAySayisi(toplamGun: number, minSozlesmeAy: number): number {
  const g = Math.max(0, Math.floor(toplamGun));
  const adim = g <= 0 ? 0 : Math.ceil(g / GUN_AY);
  return Math.max(minSozlesmeAy, adim);
}

export function aylikAdimToplam(toplamGun: number, kalemler: AylikAdimKalem[]): number {
  return kalemler.reduce((s, k) => {
    const ay = aylikAdimAySayisi(toplamGun, k.minSozlesmeAy);
    return s + ay * k.aylikTutar;
  }, 0);
}

export function paylasimliToplamHesap(
  basSayisi: number,
  toplamGun: number,
  kalemler: PaylasimliKalem[],
): number {
  const basGun = basSayisi * toplamGun;
  if (basGun <= 0) return 0;
  return kalemler.reduce((s, k) => {
    if (k.kapasiteBasGun <= 0) return s;
    const pay = (basGun / k.kapasiteBasGun) * k.toplamTutar;
    return s + pay;
  }, 0);
}

export function hesaplaDonguEkonomi(g: DonguEkonomiGirdi): DonguEkonomiSonuc {
  const eksikler: string[] = [];
  if (!Number.isFinite(g.basSayisi) || g.basSayisi < 1) eksikler.push('Baş sayısı');
  if (!Number.isFinite(g.toplamGun) || g.toplamGun < 1) eksikler.push('Döngü günü');
  if (g.satisGelirBas == null || g.satisGelirBas < 0) eksikler.push('Satış geliri varsayımı (₺/baş)');
  if (g.alisBas == null || g.alisBas < 0) eksikler.push('Alış maliyeti (₺/baş)');

  const uyari: string[] = [
    'Model senaryoları arasından en yüksek net — evrensel optimum değil.',
    'Aylık kira/maaş: sözleşme adımı; kısa besi süresi tasarruf sağlamayabilir.',
  ];

  if (eksikler.length) return { durum: 'eksik', eksikler };

  const bas = g.basSayisi;
  const gun = Math.floor(g.toplamGun);
  const gelir = Math.round(g.satisGelirBas! * bas);
  const alis = Math.round(g.alisBas! * bas);
  const degisken = g.yemVeGunlukBakimToplam ?? 0;
  const aySay = Math.max(...g.aylikKalemler.map((k) => aylikAdimAySayisi(gun, k.minSozlesmeAy)), 0);
  const aylikTop = aylikAdimToplam(gun, g.aylikKalemler);
  const donguSabit = g.donguSabitToplam ?? 0;
  const paylasim = paylasimliToplamHesap(bas, gun, g.paylasimli);
  const toplamMaliyet = Math.round(alis + degisken + aylikTop + donguSabit + paylasim);
  const netKar = gelir - toplamMaliyet;

  const maliyetDokumu: { sinif: import('./dongu-maliyet-tipler').MaliyetSinifi; etiket: string; tutar: number }[] = [
    { sinif: 'alis_sabit', etiket: 'Alış', tutar: alis },
    { sinif: 'gunluk_degisken_bas', etiket: 'Yem + günlük bakım (plan)', tutar: Math.round(degisken) },
    ...g.aylikKalemler.map((k) => ({
      sinif: 'aylik_adim' as const,
      etiket: `${k.etiket} (${aylikAdimAySayisi(gun, k.minSozlesmeAy)} ay)`,
      tutar: Math.round(aylikAdimAySayisi(gun, k.minSozlesmeAy) * k.aylikTutar),
    })),
    { sinif: 'dongu_sabit', etiket: 'Döngü sabit', tutar: Math.round(donguSabit) },
    { sinif: 'paylasimli_bas_gun', etiket: 'Paylaşımlı gider', tutar: Math.round(paylasim) },
  ];

  const batikVeSozlesme = alis + aylikTop + donguSabit;
  const marjinalGunluk =
    gun > 0 && degisken > 0 ? Math.round((degisken / (bas * gun)) * 100) / 100 : null;

  const yerGun = bas * gun > 0 ? Math.round((netKar / (bas * gun)) * 100) / 100 : null;

  let yillikDevirTahmini: number | null = null;
  if (g.donguArasiBosGun != null && g.donguArasiBosGun >= 0) {
    const donguUzunluk = gun + g.donguArasiBosGun;
    if (donguUzunluk > 0) {
      yillikDevirTahmini = Math.round((365 / donguUzunluk) * 10) / 10;
      uyari.push(`Yıllık devir tahmini: döngü ${gun} g + boş ${g.donguArasiBosGun} g.`);
    }
  }

  return {
    durum: 'hazir',
    eksikler: g.yemVeGunlukBakimToplam == null ? ['Yem/günlük maliyet planı eksik — kısmi'] : [],
    toplamGelir: gelir,
    toplamMaliyet,
    netKar,
    basBasiKar: Math.round(netKar / bas),
    yerGunKar: yerGun,
    maliyetDokumu,
    aylikAdimAySayisi: aySay,
    paylasimliToplam: Math.round(paylasim),
    batikVeSozlesme,
    marjinalGunlukMaliyetBas: marjinalGunluk,
    yillikDevirTahmini,
    uyari,
  };
}

export type AdaySatisKarsilastirmaGirdi = DonguEkonomiGirdi & {
  adayGunler: number[];
};

export type AdaySatisSatiri = {
  gun: number;
  ekonomi: Extract<DonguEkonomiSonuc, { durum: 'hazir' }> | { durum: 'eksik'; eksikler: string[] };
  satisKgVarsayim: number | null;
};

export type AdaySatisKarsilastirmaSonuc = {
  satirlar: AdaySatisSatiri[];
  enIyiGun: number | null;
  enIyiNetKar: number | null;
  duyarlilik: string[];
  uyari: string[];
};

/** Kısmi plan: donemleri gun hedefine kadar keser (son dönem orantılı). */
export function planMaliyetVeKgGunHedef(
  girisKg: number,
  donemler: BesiPlanDonemGirdi[],
  hedefGun: number,
): {
  toplamGun: number;
  cikisKg: number;
  yemMaliyet: number;
  bakimMaliyet: number;
  artisKg: number;
} | null {
  if (hedefGun < 1) return null;
  let kg = girisKg;
  let kalan = hedefGun;
  let yemMal = 0;
  let bakimMal = 0;
  let artis = 0;
  let kullanilan = 0;

  for (const d of donemler) {
    if (kalan <= 0) break;
    const parca = Math.min(d.gun, kalan);
    const oran = d.gun > 0 ? parca / d.gun : 0;
    const gcaa = d.gcaaGramGun ?? 0;
    const parcaArtis = (gcaa / 1000) * parca;
    artis += parcaArtis;
    kg += parcaArtis;
    if (d.gunlukYemKgBas != null && d.yemFiyatKg != null) {
      yemMal += parca * d.gunlukYemKgBas * d.yemFiyatKg;
    }
    if (d.gunlukBakimBas != null) {
      bakimMal += parca * d.gunlukBakimBas;
    }
    kalan -= parca;
    kullanilan += parca;
  }
  if (kullanilan < hedefGun) return null;

  return {
    toplamGun: hedefGun,
    cikisKg: Math.round(kg * 10) / 10,
    yemMaliyet: Math.round(yemMal),
    bakimMaliyet: Math.round(bakimMal),
    artisKg: Math.round(artis * 100) / 100,
  };
}

export function karsilastirAdaySatisGunleri(
  temel: Omit<AdaySatisKarsilastirmaGirdi, 'toplamGun' | 'satisGelirBas' | 'yemVeGunlukBakimToplam'> & {
    girisKg: number;
    donemler: BesiPlanDonemGirdi[];
    satisFiyatKg: number;
    satisBirimi: 'canli_kg' | 'karkas_kg';
    karkasVerim: number | null;
  },
): AdaySatisKarsilastirmaSonuc {
  const satirlar: AdaySatisSatiri[] = [];
  const duyarlilik: string[] = [];
  const uyari = ['Aday günler kullanıcı varsayımlarıyla modellenir; garanti kâr yok.'];

  for (const gun of temel.adayGunler) {
    const plan = planMaliyetVeKgGunHedef(temel.girisKg, temel.donemler, gun);
    if (!plan) {
      satirlar.push({ gun, ekonomi: { durum: 'eksik', eksikler: ['Plan günü yetersiz'] }, satisKgVarsayim: null });
      continue;
    }
    const canli = plan.cikisKg;
    const satisKg = temel.satisBirimi === 'canli_kg' ? canli : canli * (temel.karkasVerim ?? 0);
    const gelirBas = satisKg * temel.satisFiyatKg;
    const ekonomi = hesaplaDonguEkonomi({
      basSayisi: temel.basSayisi,
      toplamGun: gun,
      satisGelirBas: gelirBas,
      alisBas: temel.alisBas,
      yemVeGunlukBakimToplam: plan.yemMaliyet + plan.bakimMaliyet,
      aylikKalemler: temel.aylikKalemler,
      donguSabitToplam: temel.donguSabitToplam,
      paylasimli: temel.paylasimli,
      donguArasiBosGun: temel.donguArasiBosGun,
    });
    satirlar.push({ gun, ekonomi, satisKgVarsayim: Math.round(satisKg * 10) / 10 });
  }

  const hazir = satirlar.filter(
    (s): s is AdaySatisSatiri & { ekonomi: Extract<DonguEkonomiSonuc, { durum: 'hazir' }> } =>
      s.ekonomi.durum === 'hazir',
  );
  let enIyiGun: number | null = null;
  let enIyiNetKar: number | null = null;
  for (const h of hazir) {
    if (enIyiNetKar == null || h.ekonomi.netKar > enIyiNetKar) {
      enIyiNetKar = h.ekonomi.netKar;
      enIyiGun = h.gun;
    }
  }
  if (hazir.length >= 2) {
    const g60 = hazir.find((x) => x.gun === 60);
    const g90 = hazir.find((x) => x.gun === 90);
    if (g60 && g90) {
      duyarlilik.push(
        `60g aylık adım ay: ${g60.ekonomi.aylikAdimAySayisi}, 90g: ${g90.ekonomi.aylikAdimAySayisi}`,
      );
      duyarlilik.push(`60g net: ${g60.ekonomi.netKar} ₺, 90g net: ${g90.ekonomi.netKar} ₺`);
    }
  }

  return { satirlar, enIyiGun, enIyiNetKar, duyarlilik, uyari };
}

/** Marjinal vs tam döngü net — batık hariç ek gün maliyeti */
export function marjinalSimdiSatNet(
  simdiGelirBas: number,
  ekGun: number,
  marjinalGunlukMaliyetBas: number,
  gelecekGelirBas: number,
): number {
  return Math.round(gelecekGelirBas - ekGun * marjinalGunlukMaliyetBas - simdiGelirBas);
}
