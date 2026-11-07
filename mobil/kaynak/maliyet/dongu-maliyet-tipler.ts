/** Alım–satış döngüsü maliyet sınıfları — çift sayım yok. */

export type MaliyetSinifi =
  | 'alis_sabit' /** Döngü batığı — marjinal kararda dışlanır */
  | 'gunluk_degisken_bas'
  | 'aylik_adim' /** Kira, çoban maaşı: ay adımı + sözleşme minimumu */
  | 'dongu_sabit'
  | 'paylasimli_bas_gun';

export type AylikAdimKalem = {
  id: string;
  etiket: string;
  aylikTutar: number;
  /** Sözleşme minimum ay — gün kısa olsa da ödenir */
  minSozlesmeAy: number;
  /** false: marjinal “şimdi sat” kararında ek günle artmaz (zaten ödenmiş adım) */
  marjinaldeArtar: boolean;
};

export type PaylasimliKalem = {
  id: string;
  etiket: string;
  toplamTutar: number;
  /** Paylaştırma paydası (ör. tüm çiftlik baş×gün) */
  kapasiteBasGun: number;
};

export type DonguEkonomiGirdi = {
  basSayisi: number;
  toplamGun: number;
  /** Satış — canlı kg başına brüt ₺ (kullanıcı varsayımı) */
  satisGelirBas: number | null;
  alisBas: number | null;
  /** Plan/yem döneminden — ₺ toplam (baş×gün değişken) */
  yemVeGunlukBakimToplam: number | null;
  aylikKalemler: AylikAdimKalem[];
  donguSabitToplam: number | null;
  paylasimli: PaylasimliKalem[];
  /** Yıllık devir yalnız kullanıcı boş gün girerse */
  donguArasiBosGun: number | null;
};

export type DonguEkonomiSonuc =
  | { durum: 'eksik'; eksikler: string[] }
  | {
      durum: 'hazir';
      eksikler: string[];
      toplamGelir: number;
      toplamMaliyet: number;
      netKar: number;
      basBasiKar: number;
      /** ₺ / (baş × gün) padok yer-gün */
      yerGunKar: number | null;
      maliyetDokumu: { sinif: MaliyetSinifi; etiket: string; tutar: number }[];
      aylikAdimAySayisi: number;
      paylasimliToplam: number;
      /** Marjinal karar için: alış + ödenmiş sabit (aylık adım tamamı) */
      batikVeSozlesme: number;
      /** Ek günlerde artan kısım tahmini */
      marjinalGunlukMaliyetBas: number | null;
      yillikDevirTahmini: number | null;
      uyari: string[];
    };
