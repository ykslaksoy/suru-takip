/** t344u — işletme vs yatırım vs damızlık; kullanıcı tahmini, piyasa değil. */

export type ButceKalemKaynak = 'bilinmiyor' | 'kullanici_girdi' | 'hesaplanan' | 'secili_degil';

export type ButceKalemSinifi =
  | 'besi_isletme' /** Bitirme kuzu doğrudan */
  | 'ortak_paylasim' /** Kira/çoban — dönem + baş gerekir */
  | 'damizlik_varlik' /** Koyun/koç alışı — bitirme gideri değil */
  | 'rfid_tek_sefer'
  | 'yatirim_faz1'
  | 'yatirim_faz2_later';

export type DegerDurumu = 'bilinmiyor' | 'sifir_uygulanmaz' | 'tutar';

export type ButceSatir = {
  id: string;
  etiket: string;
  sinif: ButceKalemSinifi;
  degerDurumu: DegerDurumu;
  /** ₺/baş veya toplam — etiketle belirtilir */
  tutar: number | null;
  birim: 'bas' | 'toplam' | 'adet';
  not?: string;
  kaynak: ButceKalemKaynak;
  /** Eski kullanıcı tablosu — yeni karşılaştırmada toplanmaz (t349u) */
  karsilastirmaHaric?: boolean;
};

export type OrtakGiderPaylasim = {
  kira: number | null;
  coban: number | null;
  elektrik: number | null;
  /** Kullanıcı toplu «diğer» — alt kırılım yoksa geçerli */
  digerToplam: number | null;
  /** Bilinmeden döngüye dağıtılmaz */
  donem: 'bilinmiyor' | 'döngü_tamami' | 'aylik' | 'yillik';
  donemAdet: number | null;
  /** Paylaşım için hayvan sayısı — bilinmiyorsa null */
  payBasSayisi: number | null;
};

export type YatirimTaslagi = {
  /** Şimdi plana dahil mi */
  faz1Aktif: boolean;
  citTelSuluk: number | null;
  yemDagitimMakinesi: number | null;
  faz2Sonra: boolean;
  sagmilMakinesi: number | null;
  rfidSuruTakip: number | null;
  yemKirici: number | null;
  amortismanYil: number | null;
  hurdaDeger: number | null;
};

export type ButceTaslak = {
  satirlar: ButceSatir[];
  ortak: OrtakGiderPaylasim;
  yatirim: YatirimTaslagi;
  /** Kullanıcının söylediği toplam maliyet (mutabakat için; uydurma doldurma yok) */
  kullaniciIddiaToplamMaliyet: number | null;
  satisGelirBas: number | null;
  rfidCipAdet: number | null;
  rfidCipUcret: number | null;
  /** Plan motoru yem maliyeti için gün (varsayılan 60) */
  karsilastirmaGun?: number;
  /** Hammadde ₺/kg kaynak tarihi — doğrulanmış fiyat değil */
  yemFiyatKaynakTarih?: string | null;
  /** Faz yem kg varsayımı notu (plan dönemleri) */
  fazYemVarsayimNot?: string | null;
};
