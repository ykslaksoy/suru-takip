import type { OyunFiyatKurali, OyunFiyatKodu } from './tipler';

/** Sağlayıcı varsayılanları — oyun senaryosu; doğrulanmış piyasa fiyatı iddiası yok */
export const OYUN_FIYAT_KATALOG: OyunFiyatKurali[] = [
  {
    kod: 'kuzu_alis_kg',
    etiket: 'Kuzu alış',
    varsayilan: 500,
    min: 300,
    max: 900,
    birim: '₺/canlı kg',
    not: 'Planlama varsayımı (ör. 25 kg × 500). Gerçek borsa değil.',
  },
  {
    kod: 'yem_kg',
    etiket: 'Kesif yem',
    varsayilan: 12,
    min: 8,
    max: 22,
    birim: '₺/kg',
    not: 'Fabrika/kesif — senaryo bandı.',
  },
  {
    kod: 'kaba_yem_kg',
    etiket: 'Kaba yem',
    varsayilan: 4.5,
    min: 2,
    max: 10,
    birim: '₺/kg',
    not: 'Samandan ot — kaba rasyon eğitimi.',
  },
  {
    kod: 'coban_ay',
    etiket: 'İşçilik (ay)',
    varsayilan: 35000,
    min: 20000,
    max: 80000,
    birim: '₺/ay',
    not: 'Sabit gider örneği; ERP kaydı oluşturmaz.',
  },
  {
    kod: 'asi_paket_bas',
    etiket: 'Aşı paketi',
    varsayilan: 120,
    min: 50,
    max: 400,
    birim: '₺/baş',
    not: 'Eğitim amaçlı maliyet — spesifik ilaç/reçete değil.',
  },
  {
    kod: 'vitamin_paket_bas',
    etiket: 'Vitamin desteği',
    varsayilan: 45,
    min: 0,
    max: 200,
    birim: '₺/baş',
    not: 'İhtiyaç her işletmede zorunlu değil; otomatik büyüme yok.',
  },
  {
    kod: 'satis_canli_kg',
    etiket: 'Satış (canlı)',
    varsayilan: 620,
    min: 400,
    max: 1000,
    birim: '₺/kg',
    not: 'Çıkış senaryosu — referans fiyatla karşılaştırma için okunur, yazılmaz.',
  },
];

export const VARSAYILAN_BUTCE_SECENEKLERI = [150_000, 250_000, 400_000, 600_000] as const;

export function varsayilanFiyatHaritasi(): Record<OyunFiyatKodu, number> {
  const o = {} as Record<OyunFiyatKodu, number>;
  for (const k of OYUN_FIYAT_KATALOG) o[k.kod] = k.varsayilan;
  return o;
}

export function fiyatSinirla(kod: OyunFiyatKodu, deger: number): number {
  const k = OYUN_FIYAT_KATALOG.find((x) => x.kod === kod);
  if (!k) return deger;
  return Math.min(k.max, Math.max(k.min, Math.round(deger * 100) / 100));
}
