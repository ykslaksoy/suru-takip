/** Sesli komut türleri — onay sonrası uygulanır */
export type SesKomutTuru = 'tartim' | 'asi' | 'stok';

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

export type SesKomutEylemi = TartimKomutu | AsiKomutu | StokKomutu;

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
