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

export type CopKaydi = {
  id: string;
  silinme: string;
  tur: 'hayvan';
  etiket: string;
  veri: unknown;
};
