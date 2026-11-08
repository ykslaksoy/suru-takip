import { fiyatSinirla, varsayilanFiyatHaritasi } from './katalog';
import { degerlendirOlaylar, ogreticiKayipHesapla } from './olaylar';
import type { AkilliCiftlikDurum, OyunFiyatKodu } from './tipler';

const PLAN_ADG_GUN = 230; // g/gün — NSW plan bandı örneği; oyun varsayımı

export function yeniOyun(opts: {
  baslangicButce: number;
  hedefGun?: 60 | 90;
  tohum?: number;
  baslik?: string;
}): AkilliCiftlikDurum {
  const butce = Math.max(50_000, Math.round(opts.baslangicButce));
  const tohum = opts.tohum ?? 42;
  return {
    surum: 1,
    aktif: true,
    baslik: opts.baslik ?? 'Akıllı Çiftlik — senaryo 1',
    baslangicButce: butce,
    nakit: butce,
    gun: 0,
    hedefGun: opts.hedefGun ?? 60,
    kuzuBas: 0,
    girisKgOrt: 25,
    canliKgOrt: 25,
    toplamYatirim: 0,
    toplamIsletmeGideri: 0,
    toplamGelir: 0,
    fiyatlar: varsayilanFiyatHaritasi(),
    bakim: {
      suVeTemizlikIy: true,
      kesifAniGecis: false,
      karantinaIhlal: false,
      asiProgramiYapti: false,
      vitaminKullandi: false,
    },
    defterKayip: [],
    olaylar: [],
    iflas: false,
    tamamlandi: false,
    ogrenmeNotu: null,
    tohum,
  };
}

export function fiyatGuncelle(d: AkilliCiftlikDurum, kod: OyunFiyatKodu, deger: number): AkilliCiftlikDurum {
  return { ...d, fiyatlar: { ...d.fiyatlar, [kod]: fiyatSinirla(kod, deger) } };
}

export function kuzuSatinAl(d: AkilliCiftlikDurum, adet: number, girisKg = 25): { durum: AkilliCiftlikDurum; hata?: string } {
  const n = Math.floor(adet);
  if (n <= 0) return { durum: d, hata: 'Adet girin' };
  const birim = d.fiyatlar.kuzu_alis_kg * girisKg;
  const tutar = birim * n;
  if (tutar > d.nakit) return { durum: d, hata: 'Nakit yetersiz' };

  const toplamBas = d.kuzuBas + n;
  const kgOrt = d.kuzuBas === 0 ? girisKg : (d.girisKgOrt * d.kuzuBas + girisKg * n) / toplamBas;

  return {
    durum: {
      ...d,
      nakit: d.nakit - tutar,
      toplamYatirim: d.toplamYatirim + tutar,
      kuzuBas: toplamBas,
      girisKgOrt: Math.round(kgOrt * 10) / 10,
      canliKgOrt: Math.round(kgOrt * 10) / 10,
    },
  };
}

export function yemSatinAl(d: AkilliCiftlikDurum, kesifKg: number, kabaKg = 0): { durum: AkilliCiftlikDurum; hata?: string } {
  const tutar = kesifKg * d.fiyatlar.yem_kg + kabaKg * d.fiyatlar.kaba_yem_kg;
  if (tutar <= 0) return { durum: d, hata: 'Miktar girin' };
  if (tutar > d.nakit) return { durum: d, hata: 'Nakit yetersiz' };
  return {
    durum: {
      ...d,
      nakit: d.nakit - tutar,
      toplamIsletmeGideri: d.toplamIsletmeGideri + tutar,
    },
  };
}

export function asiProgramiOde(d: AkilliCiftlikDurum): { durum: AkilliCiftlikDurum; hata?: string } {
  if (d.kuzuBas <= 0) return { durum: d, hata: 'Önce kuzu alın' };
  const tutar = d.kuzuBas * d.fiyatlar.asi_paket_bas;
  if (tutar > d.nakit) return { durum: d, hata: 'Nakit yetersiz' };
  return {
    durum: {
      ...d,
      nakit: d.nakit - tutar,
      toplamIsletmeGideri: d.toplamIsletmeGideri + tutar,
      bakim: { ...d.bakim, asiProgramiYapti: true },
      olaylar: [
        ...d.olaylar,
        {
          id: `asi-${d.gun}`,
          gun: d.gun,
          baslik: 'Aşı maliyeti kaydedildi',
          metin: 'Eğitim modu: spesifik ürün/doz yok. Veteriner seçimi zorunludur.',
          kurgusal: true,
        },
      ],
    },
  };
}

export function vitaminOde(d: AkilliCiftlikDurum): { durum: AkilliCiftlikDurum; hata?: string } {
  if (d.kuzuBas <= 0) return { durum: d, hata: 'Önce kuzu alın' };
  const tutar = d.kuzuBas * d.fiyatlar.vitamin_paket_bas;
  if (tutar > d.nakit) return { durum: d, hata: 'Nakit yetersiz' };
  return {
    durum: {
      ...d,
      nakit: d.nakit - tutar,
      toplamIsletmeGideri: d.toplamIsletmeGideri + tutar,
      bakim: { ...d.bakim, vitaminKullandi: true },
      olaylar: [
        ...d.olaylar,
        {
          id: `vit-${d.gun}`,
          gun: d.gun,
          baslik: 'Vitamin desteği',
          metin: 'Beslenme boşluğu varsa anlamlı olabilir; otomatik büyüme veya bağışıklık garantisi yok.',
          kurgusal: true,
        },
      ],
    },
  };
}

export function bakimAyarla(
  d: AkilliCiftlikDurum,
  parca: Partial<AkilliCiftlikDurum['bakim']>,
): AkilliCiftlikDurum {
  const next = { ...d, bakim: { ...d.bakim, ...parca } };
  const olaylar = degerlendirOlaylar(d, next);
  return { ...next, olaylar: [...next.olaylar, ...olaylar] };
}

function gunlukYemMaliyet(d: AkilliCiftlikDurum): number {
  if (d.kuzuBas <= 0) return 0;
  const kesif = 1.1 * d.kuzuBas * d.fiyatlar.yem_kg;
  const kaba = 0.4 * d.kuzuBas * d.fiyatlar.kaba_yem_kg;
  return kesif + kaba;
}

function gunlukIsgilik(d: AkilliCiftlikDurum): number {
  return d.fiyatlar.coban_ay / 30;
}

export function ilerleGun(d: AkilliCiftlikDurum, gunSayisi: number): AkilliCiftlikDurum {
  if (d.iflas || d.tamamlandi) return d;
  let cur = { ...d };
  const adim = Math.max(1, Math.floor(gunSayisi));

  for (let i = 0; i < adim; i++) {
    cur.gun += 1;
    const yem = gunlukYemMaliyet(cur);
    const isci = gunlukIsgilik(cur);
    cur.nakit -= yem + isci;
    cur.toplamIsletmeGideri += yem + isci;

    if (cur.kuzuBas > 0) {
      const artis = (PLAN_ADG_GUN / 1000) * (cur.bakim.suVeTemizlikIy ? 1 : 0.85);
      cur.canliKgOrt = Math.round((cur.canliKgOrt + artis) * 10) / 10;
    }

    const kayip = ogreticiKayipHesapla(cur, cur.tohum);
    if (kayip) {
      cur.kuzuBas = Math.max(0, cur.kuzuBas - kayip.kayipBas);
      cur.defterKayip = [
        ...cur.defterKayip,
        {
          id: `k-${cur.gun}-${cur.defterKayip.length}`,
          gun: cur.gun,
          bas: kayip.kayipBas,
          neden: kayip.neden,
          ogretici: true,
          finansalEtkiBas: kayip.finansalEtkiBas,
        },
      ];
      if (kayip.finansalEtkiBas) cur.nakit -= kayip.finansalEtkiBas;
    }

    const olaylar = degerlendirOlaylar(d, cur);
    cur.olaylar = [...cur.olaylar, ...olaylar];
  }

  if (cur.nakit < 0) {
    cur.iflas = true;
    cur.ogrenmeNotu = 'Nakit eksi — senaryo bitti. Gerçek işletme borcu oluşturulmadı.';
  }

  if (cur.gun >= cur.hedefGun && cur.kuzuBas > 0) {
  }

  return cur;
}

export function satisYap(d: AkilliCiftlikDurum): { durum: AkilliCiftlikDurum; hata?: string } {
  if (d.kuzuBas <= 0) return { durum: d, hata: 'Satılacak kuzu yok' };
  const gelir = d.kuzuBas * d.canliKgOrt * d.fiyatlar.satis_canli_kg;
  const maliyet = d.toplamYatirim + d.toplamIsletmeGideri;
  const kar = gelir + d.nakit - d.baslangicButce;

  return {
    durum: {
      ...d,
      nakit: d.nakit + gelir,
      toplamGelir: gelir,
      tamamlandi: true,
      kuzuBas: 0,
      ogrenmeNotu: `Senaryo satışı: gelir ${Math.round(gelir).toLocaleString('tr-TR')} ₺ · tahmini fark ${Math.round(kar).toLocaleString('tr-TR')} ₺ (maliyet toplamı ${Math.round(maliyet).toLocaleString('tr-TR')} ₺)`,
    },
  };
}

export function netKar(d: AkilliCiftlikDurum): number | null {
  if (!d.tamamlandi && !d.iflas) return null;
  return d.nakit + d.toplamGelir - d.baslangicButce;
}

/** Gerçek depo anahtarlarını kullanmaz — izolasyon kontrolü için sabit liste */
export const GERCEK_DEPO_KORUNAN = ['sy_besi_plan_senaryo_v1', 'sy_hayvan', 'sy_stok'] as const;

export function simulasyonDepoAnahtari(): string {
  return 'sy_akilli_ciftlik_sim_v1';
}
