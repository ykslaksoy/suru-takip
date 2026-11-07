import type { BesiEkonomiBaglam, BesiEkonomiKalem, CiftSayimAnahtar } from '@/kaynak/maliyet/besi-ekonomi-kalem';
import { kalemToplamTutar, alisBasTutarHesap } from '@/kaynak/maliyet/besi-ekonomi-kalem';
import type { PartiGercekMaliyetOzet } from '@/kaynak/maliyet/besi-ekonomi-gercek';
import { gercekCiftSayimAnahtarlari, gercekToplamEkMaliyet } from '@/kaynak/maliyet/besi-ekonomi-gercek';
import type { MaliyetSinifi } from '@/kaynak/maliyet/dongu-maliyet-tipler';
import { hesaplaDonguEkonomi, type DonguEkonomiSonuc } from '@/kaynak/maliyet/dongu-ekonomi-hesap';
import type { AylikAdimKalem, PaylasimliKalem } from '@/kaynak/maliyet/dongu-maliyet-tipler';

export type BesiEkonomiSenaryoGirdi = {
  basSayisi: number;
  toplamGun: number;
  girisCanliKg: number | null;
  satisGelirBas: number | null;
  kalemler: BesiEkonomiKalem[];
  /** Plan yem+bakım ₺ (projeksiyon); yem kalemi stokla çift sayılmasın diye kontrol */
  planDegiskenToplam: number | null;
  gercekParti?: PartiGercekMaliyetOzet | null;
  donguArasiBosGun: number | null;
};

export type BesiEkonomiSenaryoSonuc =
  | { durum: 'eksik'; eksikler: string[]; kismi: null }
  | {
      durum: 'hazir' | 'kismi';
      eksikler: string[];
      kalemlerDokum: {
        etiket: string;
        tutar: number | null;
        kaynak: string;
        sinif: MaliyetSinifi;
        atlandi: boolean;
      }[];
      gercekYemIlacDahil: number | null;
      dongu: Extract<DonguEkonomiSonuc, { durum: 'hazir' }>;
      tamamlik: 'tam' | 'kismi';
      uyari: string[];
    };

function kalemdenAylikVePaylasim(kalemler: BesiEkonomiKalem[]): {
  aylik: AylikAdimKalem[];
  paylasim: PaylasimliKalem[];
  donguSabit: number;
} {
  let donguSabit = 0;
  const aylik: AylikAdimKalem[] = [];
  const paylasim: PaylasimliKalem[] = [];
  for (const k of kalemler) {
    if (k.odeme === 'aylik_adim' && k.birimTutar != null) {
      aylik.push({
        id: k.id,
        etiket: k.etiket,
        aylikTutar: k.birimTutar,
        minSozlesmeAy: k.minSozlesmeAy ?? 1,
        marjinaldeArtar: false,
      });
    }
    if (k.odeme === 'paylasimli_bas_gun' && k.paylasimToplam && k.kapasiteBasGun) {
      paylasim.push({ id: k.id, etiket: k.etiket, toplamTutar: k.paylasimToplam, kapasiteBasGun: k.kapasiteBasGun });
    }
  }
  return { aylik, paylasim, donguSabit };
}

export function hesaplaBesiEkonomiSenaryo(g: BesiEkonomiSenaryoGirdi): BesiEkonomiSenaryoSonuc {
  const ctx: BesiEkonomiBaglam = {
    basSayisi: g.basSayisi,
    toplamGun: g.toplamGun,
    girisCanliKg: g.girisCanliKg,
  };
  const haric = g.gercekParti ? gercekCiftSayimAnahtarlari(g.gercekParti) : new Set<CiftSayimAnahtar>();
  const eksikler: string[] = [];
  const uyari: string[] = ['Taslak hesap — fatura/stok gerçeği değiştirilmez.'];
  const kalemlerDokum: {
    etiket: string;
    tutar: number | null;
    kaynak: string;
    sinif: MaliyetSinifi;
    atlandi: boolean;
  }[] = [];

  let alisBas: number | null = null;
  let gunlukPlanVeyaKalem = 0;
  let donguSabitKalem = 0;

  for (const k of g.kalemler) {
    const satir = kalemToplamTutar(k, ctx, { haricCiftSayim: haric });
    kalemlerDokum.push({
      etiket: satir.etiket,
      tutar: satir.tutar,
      kaynak: k.kaynak,
      sinif: k.sinif,
      atlandi: satir.atlandi,
    });
    if (satir.atlandi) {
      uyari.push(`${k.etiket}: gerçek kayıt nedeniyle projeksiyon satırı atlandı.`);
      continue;
    }
    eksikler.push(...satir.eksik);
    if (satir.tutar == null) continue;
    if (k.kod === 'alis') {
      alisBas = ctx.basSayisi > 0 ? satir.tutar / ctx.basSayisi : null;
    } else if (k.sinif === 'gunluk_degisken_bas' && k.kod !== 'yem') {
      gunlukPlanVeyaKalem += satir.tutar;
    } else if (k.kod === 'yem' && !haric.has('parti_yem_stok')) {
      gunlukPlanVeyaKalem += satir.tutar;
    } else if (k.sinif === 'dongu_sabit' || k.kod === 'nakliye' || k.kod === 'veteriner') {
      donguSabitKalem += satir.tutar;
    }
  }

  const gercekEk = g.gercekParti ? gercekToplamEkMaliyet(g.gercekParti, g.basSayisi) : null;
  if (gercekEk != null) {
    uyari.push(`Gerçek stok yem+ilaç payı modele eklendi: ~${gercekEk} ₺ (çift sayım kontrolü).`);
  }

  let yemVeGunluk: number | null = null;
  if (haric.has('parti_yem_stok') && gercekEk != null) {
    yemVeGunluk = gercekEk + gunlukPlanVeyaKalem + (g.planDegiskenToplam ?? 0);
    if (g.planDegiskenToplam != null && g.planDegiskenToplam > 0) {
      uyari.push('Plan yem maliyeti + gerçek stok birlikte — yem kalemini projeksiyonda kapatın veya planı sıfırlayın.');
    }
  } else {
    const plan = g.planDegiskenToplam ?? 0;
    const manuelYem = g.kalemler.some((k) => k.kod === 'yem' && k.degerDurumu === 'tutar' && !haric.has('parti_yem_stok'));
    if (manuelYem && plan > 0) {
      uyari.push('Çift sayım riski: hem plan yem hem yem kalemi.');
    }
    yemVeGunluk = plan + gunlukPlanVeyaKalem;
    if (yemVeGunluk === 0) yemVeGunluk = null;
  }

  if (alisBas == null) {
    const alisK = g.kalemler.find((x) => x.kod === 'alis');
    if (alisK) {
      const a = alisBasTutarHesap(alisK, ctx);
      if (a.tutar != null && ctx.basSayisi > 0) alisBas = a.tutar / ctx.basSayisi;
      eksikler.push(...a.eksik);
    } else eksikler.push('Alış kalemi yok');
  }

  const { aylik, paylasim, donguSabit } = kalemdenAylikVePaylasim(g.kalemler);

  const dongu = hesaplaDonguEkonomi({
    basSayisi: g.basSayisi,
    toplamGun: g.toplamGun,
    satisGelirBas: g.satisGelirBas,
    alisBas,
    yemVeGunlukBakimToplam: yemVeGunluk,
    aylikKalemler: aylik,
    donguSabitToplam: donguSabitKalem + donguSabit,
    paylasimli: paylasim,
    donguArasiBosGun: g.donguArasiBosGun,
  });

  if (dongu.durum === 'eksik') {
    return { durum: 'eksik', eksikler: [...new Set([...eksikler, ...dongu.eksikler])], kismi: null };
  }

  const kritik = eksikler.filter((e) => !e.includes('bilinmiyor'));
  const tamamlik = eksikler.length === 0 ? 'tam' : 'kismi';
  if (tamamlik === 'kismi') uyari.push('Eksik fiyat — kâr tam değil.');

  return {
    durum: tamamlik === 'tam' ? 'hazir' : 'kismi',
    eksikler: [...new Set(eksikler)],
    kalemlerDokum,
    gercekYemIlacDahil: gercekEk,
    dongu,
    tamamlik,
    uyari: [...dongu.uyari, ...uyari],
  };
}
