/** Sesli komut türleri — onay sonrası uygulanır */
export type SesKomutTuru = 'tartim' | 'asi' | 'stok' | 'grup_asi';

export type SesOturumAsamasi =
  | 'bos'
  | 'onay_bekliyor'
  | 'uygulandi'
  | 'iptal'
  | 'anlasilmadi'
  /** Kayıt için bir alan eksik (örn. küpe var, kilo yok) — soru soruldu */
  | 'eksik_bilgi'
  /** Kullanıcı "dur / yanlış" dedi — kaydedilmedi, düzeltme bekleniyor */
  | 'duzeltme';

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

export type SesKomutEylemi = TartimKomutu | AsiKomutu | StokKomutu | GrupAsiKomutu;

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
