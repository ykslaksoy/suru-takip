export type IslemTur = 'tartim' | 'asi' | 'ilac' | 'stok' | 'hayvan' | 'padok' | 'satis' | 'durum' | 'silme' | 'geri_alma' | 'diger';

export type Islem = {
  id: string;
  zaman: string;
  /** Kim — şimdilik cihaz (çok kullanıcılı senkron gelince kullanıcı adı) */
  kim: string;
  tur: IslemTur;
  ozet: string;
  detay?: string;
  animalId?: string;
  /** Kaç kayıt etkilendi (toplu işlemlerde) */
  adet?: number;
};

export type CopTur = 'hayvan' | 'saglik' | 'tartim' | 'police' | 'sablon' | 'foto' | 'yem' | 'ureme';

export type CopKaydi = {
  id: string;
  silinme: string;
  tur: CopTur;
  etiket: string;
  /** Kuzu kaydı + bağlı tartım / sağlık kayıtları, ya da tek kayıt */
  veri: unknown;
  /** Kim sildi */
  kim?: string;
  animalId?: string;
};
