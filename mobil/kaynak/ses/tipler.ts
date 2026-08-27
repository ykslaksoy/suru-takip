/** Sesli komut türleri — onay sonrası uygulanır */
export type SesKomutTuru = 'tartim' | 'asi' | 'stok';

export type SesOturumAsamasi =
  | 'bos'
  | 'onay_bekliyor'
  | 'uygulandi'
  | 'iptal'
  | 'anlasilmadi';

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
}
