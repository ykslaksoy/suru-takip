/** Sesli komut türleri — onay sonrası uygulanır (bilgi = salt okunur) */
export type SesKomutTuru =
  | 'tartim'
  | 'asi'
  | 'stok'
  | 'grup_asi'
  | 'bilgi'
  | 'padok_tasi'
  | 'gozlem_hatirlat'
  | 'padok_yem'
  | 'dogum'
  | 'tartim_duzelt';

export type BilgiSoru = 'son_kilo' | 'bugun_asi_ozet';

export interface BilgiKomutu {
  tur: 'bilgi';
  soru: BilgiSoru;
  kupeArama?: string;
}

export interface PadokTasiKomutu {
  tur: 'padok_tasi';
  kupeArama: string;
  padokHedef: string;
}

export interface GozlemHatirlatKomutu {
  tur: 'gozlem_hatirlat';
  kupeArama: string;
  gozlem: string;
  hatirlatmaTarihi: string;
}

export interface PadokYemKomutu {
  tur: 'padok_yem';
  padokHam: string;
  miktarKg: number;
  yemAdi?: string;
  tarih: string;
}

export type DogumKuzuSes = { earTag: string; sex: 'male' | 'female' };

export interface DogumKomutu {
  tur: 'dogum';
  anneArama: string;
  birthDate: string;
  kuzular: DogumKuzuSes[];
  paddock?: string;
}

export interface TartimDuzeltKomutu {
  tur: 'tartim_duzelt';
  kupeArama: string;
  yeniKg: number;
  kayitId?: string;
  eskiKg?: number;
}

export type SesOturumAsamasi =
  | 'bos'
  | 'onay_bekliyor'
  | 'uygulandi'
  | 'iptal'
  | 'anlasilmadi'
  /** Kayıt için bir alan eksik (örn. küpe var, kilo yok) — soru soruldu */
  | 'eksik_bilgi'
  /** Kullanıcı "dur / yanlış" dedi — kaydedilmedi, düzeltme bekleniyor */
  | 'duzeltme'
  /** Salt okunur yanıt — kayıt yok */
  | 'bilgi_yaniti';

export interface TartimKomutu {
  tur: 'tartim';
  kupeArama: string;
  kiloKg: number;
}

export interface AsiKomutu {
  tur: 'asi';
  kupeArama: string;
  asiAdi: string;
}

export interface StokKomutu {
  tur: 'stok';
  stokAdi: string;
  miktar: number;
  birim: string;
  yon: 'giris' | 'cikis';
}

/** Parti / tüm kuzular için toplu aşı-ilaç-vitamin */
export interface GrupAsiKomutu {
  tur: 'grup_asi';
  grup: { tur: 'tum' } | { tur: 'padok'; ad: string };
  asiAdi: string;
  programId: string;
  programTur: 'asi' | 'vitamin';
  /** Geri okumadan önce veritabanından doldurulur */
  hayvanSayisi?: number;
  /** Tabanca açıksa ayar (ml) — geri okumada söylenir, kayıtta iğne ucu düşülür */
  tabancaMl?: number;
}

export type SesKomutEylemi =
  | TartimKomutu
  | AsiKomutu
  | StokKomutu
  | GrupAsiKomutu
  | BilgiKomutu
  | PadokTasiKomutu
  | GozlemHatirlatKomutu
  | PadokYemKomutu
  | DogumKomutu
  | TartimDuzeltKomutu;

export interface SesKomutSonucu {
  asama: SesOturumAsamasi;
  /** TTS ile okunacak metin */
  okumaMetni: string;
  /** Onay beklerken dolu; uygulandıktan sonra null */
  bekleyenEylem: SesKomutEylemi | null;
  /** Sesli söylenecek cümle (yoksa okumaMetni söylenir) */
  konusmaMetni?: string;
  /** Düzeltme için metin kutusuna önceden doldurulacak komut */
  duzeltmeMetni?: string;
  /** Sistem kullanıcıdan cevap bekliyor mu (otomatik dinleme için) */
  cevapBekleniyor?: boolean;
}
