/** t355u — örnek 60 gün yem miktarı; varsayılan plana yazılmaz. */

export type YemIllustrasyonSonuc = {
  aktif: boolean;
  hazirKg: number;
  hazirFiyatKg: number;
  yoncaKg: number;
  yoncaFiyatKg: number;
  samanKg: number;
  samanFiyatKg: number;
  araToplam: number;
  fireOrani: number | null;
  fireDahil: number | null;
  kaynaklar: { etiket: string; url: string | null; veriTarihi: string | null; not: string }[];
  uyari: string[];
};

const UYARI = [
  'ILLUSTRATIVE — doğrulanmış rasyon veya zorunlu varsayılan değil.',
  '90 gün fiyat/rasyon uydurulmaz.',
  'KDV/nakliye bilinmiyor (Abalıoğlu 50 kg pelet).',
];

export function hesaplaYemIllustrasyon60(opts: {
  aktif: boolean;
  fireYuzde?: number | null;
}): YemIllustrasyonSonuc {
  const hazirKg = 60;
  const hazirFiyatKg = 21.5;
  const yoncaKg = 18;
  const yoncaFiyatKg = 12.91;
  const samanKg = 6;
  const samanFiyatKg = 4.38;
  const araToplam = Math.round((hazirKg * hazirFiyatKg + yoncaKg * yoncaFiyatKg + samanKg * samanFiyatKg) * 100) / 100;
  const fire = opts.fireYuzde != null && opts.fireYuzde > 0 ? opts.fireYuzde / 100 : null;
  const fireDahil = fire != null ? Math.round(araToplam * (1 + fire) * 100) / 100 : null;

  return {
    aktif: opts.aktif,
    hazirKg,
    hazirFiyatKg,
    yoncaKg,
    yoncaFiyatKg,
    samanKg,
    samanFiyatKg,
    araToplam,
    fireOrani: fire,
    fireDahil,
    kaynaklar: [
      {
        etiket: 'Abalıoğlu kuzu büyütme pelet',
        url: 'https://yilmazzahirecilik.com/yemler/kucukbas-yemleri/abalioglu-yem/prd-abalioglu-alagoz-kuzu-buyutme-yemi-pelet',
        veriTarihi: '2026-11-08',
        not: '1075₺/50kg → 21,50; liste güncelleme tarihi belirsiz',
      },
      {
        etiket: 'USK yonca/saman ort.',
        url: 'https://ulusalsutkonseyi.org.tr/yemlerin-ortalama-fiyatlari/',
        veriTarihi: '2026-09-30',
        not: '12,91 / 4,38 ₺/kg',
      },
    ],
    uyari: opts.aktif ? UYARI : ['Kapalı — plan faz yemine bakın'],
  };
}

/** Kullanıcı tablosu: 30×0,8 + 30×1,2 kg hazır yem (illüstrasyon) */
export const ILLUSTRASYON_HAZIR_KG_NOT = '30 gün ×0,8 + 30 gün ×1,2 kg hazır yem';
