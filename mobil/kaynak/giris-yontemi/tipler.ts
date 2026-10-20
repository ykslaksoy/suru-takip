/** Kuzu seçim + tartım giriş yöntemleri — tek seferlik kurulum, her akışta aynı */

export type KuzuSecimYontemi =
  | 'otomatik-tanima'
  | 'manuel'
  | 'kupe-ocr'
  | 'rfid'
  | 'sirt-no-ocr'
  | 'sesle-numara';

export type TartimGirisYontemi =
  | 'manuel'
  | 'baskul'
  | 'sesle-kilo'
  | 'baskul-ocr'
  | 'toplu-csv'
  | 'iot-api';

export type YontemDurum = 'aktif' | 'yakininda' | 'kapali';

export type GirisYontemiTercih = {
  kuzuSecim: KuzuSecimYontemi;
  tartimGiris: TartimGirisYontemi;
  kurulumTamam: boolean;
  guncelleme?: string;
};

export const KUZU_SECIM_SECENEKLER: {
  id: KuzuSecimYontemi;
  baslik: string;
  aciklama: string;
}[] = [
  {
    id: 'otomatik-tanima',
    baslik: 'Otomatik tanıma',
    aciklama: 'Küpe, sırt no, RFID veya ses — kayıtlı kuzu varsa otomatik bulur',
  },
  {
    id: 'manuel',
    baslik: 'Manuel seçim',
    aciklama: 'Kulak küpe ve sırt numarasını elle yazarsınız',
  },
  {
    id: 'kupe-ocr',
    baslik: 'Küpe OCR',
    aciklama: 'Küpe etiketinden okunan metni yapıştırın veya okutun',
  },
  {
    id: 'rfid',
    baslik: 'RFID',
    aciklama: 'GEKİS / elektronik küpe okuyucu (Bluetooth simülasyon)',
  },
  {
    id: 'sirt-no-ocr',
    baslik: 'Sırt no OCR',
    aciklama: 'Sırt boyasından okunan numarayı yapıştırın veya okutun',
  },
  {
    id: 'sesle-numara',
    baslik: 'Sesle numara',
    aciklama: 'Küpe veya sırt numarasını sesle söyleyin',
  },
];

export const TARTIM_GIRIS_SECENEKLER: {
  id: TartimGirisYontemi;
  baslik: string;
  aciklama: string;
}[] = [
  {
    id: 'manuel',
    baslik: 'Manuel',
    aciklama: 'Kiloyu elle yazarsınız',
  },
  {
    id: 'baskul',
    baslik: 'Baskülden okuma',
    aciklama: 'Bluetooth / USB / seri baskül bağlantısı',
  },
  {
    id: 'sesle-kilo',
    baslik: 'Sesle kilo',
    aciklama: 'Kiloyu sesle söyleyin',
  },
  {
    id: 'baskul-ocr',
    baslik: 'Baskül ekranı OCR',
    aciklama: 'Baskül ekranından okunan değer',
  },
  {
    id: 'toplu-csv',
    baslik: 'Toplu CSV',
    aciklama: 'Excel / CSV ile çoklu tartım aktarımı',
  },
  {
    id: 'iot-api',
    baslik: 'IoT / API',
    aciklama: 'Sensör veya harici sistemden otomatik (ileride)',
  },
];

export const VARSAYILAN_GIRIS_YONTEMI: GirisYontemiTercih = {
  kuzuSecim: 'manuel',
  tartimGiris: 'manuel',
  kurulumTamam: false,
};
