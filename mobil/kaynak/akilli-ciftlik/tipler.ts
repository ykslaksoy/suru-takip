/** Akıllı Çiftlik — öğretici simülasyon; gerçek hayvan/stok kaydı değil. */

export const AKILLI_CIFTLIK_DEPO_ANAHTAR = 'sy_akilli_ciftlik_sim_v1';

export type OyunFiyatKodu =
  | 'kuzu_alis_kg'
  | 'yem_kg'
  | 'kaba_yem_kg'
  | 'coban_ay'
  | 'asi_paket_bas'
  | 'vitamin_paket_bas'
  | 'satis_canli_kg';

export type OyunFiyatKurali = {
  kod: OyunFiyatKodu;
  etiket: string;
  varsayilan: number;
  /** Oyun kuralı toleransı — piyasa limiti değil */
  min: number;
  max: number;
  birim: string;
  not: string;
};

export type OyunBakimDurumu = {
  suVeTemizlikIy: boolean;
  kesifAniGecis: boolean;
  karantinaIhlal: boolean;
  asiProgramiYapti: boolean;
  vitaminKullandi: boolean;
};

export type OyunKayipDefter = {
  id: string;
  gun: number;
  bas: number;
  neden: string;
  ogretici: true;
  finansalEtkiBas: number | null;
};

export type OyunOlay = {
  id: string;
  gun: number;
  baslik: string;
  metin: string;
  kurgusal: true;
  onlem?: string;
};

export type AkilliCiftlikDurum = {
  surum: 1;
  aktif: boolean;
  baslik: string;
  /** Kullanıcı seçimi — başlangıç sermayesi (senaryo) */
  baslangicButce: number;
  nakit: number;
  gun: number;
  hedefGun: 60 | 90;
  kuzuBas: number;
  girisKgOrt: number;
  canliKgOrt: number;
  toplamYatirim: number;
  toplamIsletmeGideri: number;
  toplamGelir: number;
  fiyatlar: Record<OyunFiyatKodu, number>;
  bakim: OyunBakimDurumu;
  defterKayip: OyunKayipDefter[];
  olaylar: OyunOlay[];
  iflas: boolean;
  tamamlandi: boolean;
  ogrenmeNotu: string | null;
  /** Şeffaflık için sabit tohum */
  tohum: number;
};

export type AkilliCiftlikDepo = {
  surum: 1;
  oyun: AkilliCiftlikDurum | null;
};
