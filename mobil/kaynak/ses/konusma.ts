/**
 * Konuşma (TTS) + dinleme (STT) adaptörü.
 * Web: SpeechSynthesis / SpeechRecognition.
 * Native: metin yolu; canlı mikrofon sonra native STT ile açılır.
 */

import { dinlemeHataMesaji } from './dinleme-hata';
import type { SesDinlemeDurumu } from './dinleme-durumu';
import { azalanHareketTercihi, mikrofonSeviyeOturumuBaslat, type MikrofonSeviyeOturum } from './mikrofon-seviye';
import { sttGuncelSatir } from './stt-sonuc';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type KonusmaDurumu = {
  ttsHazir: boolean;
  sttHazir: boolean;
  aciklama: string;
};

function webApis(): { synth: any; Rec: any } {
  if (typeof globalThis === 'undefined') return { synth: null, Rec: null };
  const w = globalThis as any;
  if (!w.window && !w.speechSynthesis && !w.SpeechRecognition && !w.webkitSpeechRecognition) {
    // React Native / Node — DOM yok
    return {
      synth: w.speechSynthesis ?? null,
      Rec: w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null,
    };
  }
  const root = w.window ?? w;
  return {
    synth: root.speechSynthesis ?? null,
    Rec: root.SpeechRecognition ?? root.webkitSpeechRecognition ?? null,
  };
}

export function konusmaDurumu(): KonusmaDurumu {
  const { synth, Rec } = webApis();
  const ttsHazir = Boolean(synth);
  const sttHazir = Boolean(Rec);
  if (ttsHazir && sttHazir) {
    return {
      ttsHazir,
      sttHazir,
      aciklama: 'Tarayıcı konuşma API’si hazır — dinle ve geri oku çalışır.',
    };
  }
  if (ttsHazir) {
    return {
      ttsHazir,
      sttHazir: false,
      aciklama: 'Geri okuma (TTS) hazır. Mikrofon için web/native STT gerekir; şimdilik metin yazın.',
    };
  }
  return {
    ttsHazir: false,
    sttHazir: false,
    aciklama:
      'Cihaz mikrofonu sonra bağlanacak. Şimdilik komutu yazın; onay için «tamam» deyin.',
  };
}

/**
 * Metni seslendir (mümkünse). `onBitti` konuşma bitince (veya TTS yoksa hemen) çağrılır.
 * iOS Safari bazen `onend` göndermez — süre tahminli yedek zamanlayıcı vardır.
 */
export function metniSeslendir(metin: string, opts?: { onBitti?: () => void }): void {
  const { synth } = webApis();
  let bitti = false;
  const bitir = () => {
    if (bitti) return;
    bitti = true;
    opts?.onBitti?.();
  };
  if (!synth || !metin.trim()) {
    bitir();
    return;
  }
  try {
    synth.cancel();
    const Utterance = (globalThis as any).SpeechSynthesisUtterance;
    if (!Utterance) {
      bitir();
      return;
    }
    const u = new Utterance(metin);
    u.lang = 'tr-TR';
    u.rate = 0.95;
    const trSes = (synth.getVoices?.() ?? []).find((v: any) =>
      String(v?.lang ?? '').toLowerCase().startsWith('tr'),
    );
    if (trSes) u.voice = trSes;
    u.onend = bitir;
    u.onerror = bitir;
    synth.speak(u);
    if (opts?.onBitti) {
      // ~14 karakter/sn + pay; onend gelmezse yine devam et
      setTimeout(bitir, Math.min(15000, 1500 + metin.length * 75));
    }
  } catch {
    bitir();
  }
}

/**
 * iOS Safari: konuşma ilk kez bir dokunuşla (kullanıcı hareketi) başlatılmalı.
 * Dinle / Gönder dokunuşunda senkron çağır — sonraki otomatik okumalar çalışır.
 */
export function seslendirmeKilidiAc(): void {
  const { synth } = webApis();
  const Utterance = (globalThis as any).SpeechSynthesisUtterance;
  if (!synth || !Utterance) return;
  try {
    const u = new Utterance(' ');
    u.volume = 0;
    u.lang = 'tr-TR';
    synth.speak(u);
  } catch {
    /* ignore */
  }
}

export function seslendirmeyiDurdur(): void {
  const { synth } = webApis();
  try {
    synth?.cancel();
  } catch {
    /* ignore */
  }
}

export type DinlemeKontrol = {
  durdur: () => void;
};

export type DinlemeSeviyeBildirimi = {
  cubuklar: number[];
  ortalama: number;
  sesVar: boolean;
};

/**
 * Kısa dinleme oturumu. Destek yoksa null döner.
 * Sonuç metin olarak onSonuc ile gelir.
 * `kullaniciBaslatti`: true ise (yalnız Dinle düğmesi) canlı seviye ölçümü denenir; STT ile çakışırsa STT öncelikli, çubuk kapatılır.
 */
export function dinlemeyiBaslat(opts: {
  /** Kesin (final) transkript — kayıt/işlem yapmaz */
  onSonuc: (metin: string) => void;
  /** Ara veya kesin transkript (kesin=false «tahmini») */
  onAraSonuc?: (metin: string, kesin: boolean) => void;
  /** kod: tarayıcı hata kodu (örn. 'not-allowed' — iOS’ta dokunuşsuz başlatma engeli) */
  onHata?: (mesaj: string, kod?: string) => void;
  onBasladi?: () => void;
  /** Sonuç gelmeden dinleme bittiğinde */
  onBitti?: () => void;
  kullaniciBaslatti?: boolean;
  onDinlemeDurumu?: (durum: SesDinlemeDurumu) => void;
  onSeviye?: (b: DinlemeSeviyeBildirimi) => void;
}): DinlemeKontrol | null {
  const { Rec } = webApis();
  if (!Rec) {
    opts.onHata?.('Bu ortamda mikrofon dinleme yok. Komutu kutuya yazıp Gönder’e basın.', 'unsupported');
    opts.onDinlemeDurumu?.('hata');
    return null;
  }

  const rec = new Rec();
  rec.lang = 'tr-TR';
  rec.interimResults = Boolean(opts.onAraSonuc);
  rec.maxAlternatives = 1;
  rec.continuous = false;

  let sonucGeldi = false;
  let temizlendi = false;
  let seviyeOturum: MikrofonSeviyeOturum | null = null;
  let seviyeOlcumVar = false;

  const tamamenDurdur = (durum: SesDinlemeDurumu = 'durdu') => {
    if (temizlendi) return;
    temizlendi = true;
    seviyeOturum?.durdur();
    seviyeOturum = null;
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
    opts.onDinlemeDurumu?.(durum);
    opts.onSeviye?.({ cubuklar: [], ortalama: 0, sesVar: false });
  };

  rec.onstart = () => {
    opts.onBasladi?.();
    opts.onDinlemeDurumu?.('dinliyor');
  };
  rec.onerror = (ev: any) => {
    if (sonucGeldi || temizlendi) return;
    const kod = String(ev?.error ?? '');
    sonucGeldi = true;
    tamamenDurdur('hata');
    opts.onHata?.(dinlemeHataMesaji(kod), kod);
  };
  rec.onresult = (ev: any) => {
    const satir = sttGuncelSatir(ev?.results ?? { length: 0 }, ev?.resultIndex ?? 0);
    if (!satir) return;
    opts.onAraSonuc?.(satir.metin, satir.kesin);
    if (!satir.kesin) return;
    sonucGeldi = true;
    seviyeOturum?.durdur();
    seviyeOturum = null;
    opts.onDinlemeDurumu?.('isleniyor');
    opts.onSeviye?.({ cubuklar: [], ortalama: 0, sesVar: false });
    opts.onSonuc(satir.metin);
  };
  rec.onend = () => {
    if (!sonucGeldi && !temizlendi) {
      tamamenDurdur('hata');
      opts.onHata?.(dinlemeHataMesaji('no-speech'), 'no-speech');
      opts.onBitti?.();
    } else if (!temizlendi) {
      tamamenDurdur('durdu');
      opts.onBitti?.();
    }
  };

  const sttBaslat = () => {
    try {
      rec.start();
    } catch (e: any) {
      tamamenDurdur('hata');
      const kod = String(e?.name ?? 'start-failed');
      opts.onHata?.(dinlemeHataMesaji(kod), kod);
    }
  };

  const baslat = async () => {
    if (opts.kullaniciBaslatti && opts.onSeviye) {
      opts.onDinlemeDurumu?.('izin_istek');
      const reduced = azalanHareketTercihi();
      seviyeOturum = await mikrofonSeviyeOturumuBaslat({
        reducedMotion: reduced,
        onHazir: () => {
          seviyeOlcumVar = true;
        },
        onHata: () => {
          seviyeOlcumVar = false;
        },
        onSeviye: (cubuklar, ortalama, sesVar) => {
          if (temizlendi) return;
          opts.onSeviye?.({ cubuklar, ortalama, sesVar });
          if (sesVar) opts.onDinlemeDurumu?.('ses_algilandi');
        },
      });
      if (!seviyeOturum) {
        seviyeOlcumVar = false;
        opts.onSeviye({ cubuklar: [], ortalama: 0, sesVar: false });
      }
    }
    if (temizlendi) return;
    sttBaslat();
  };

  void baslat();

  return {
    durdur: () => tamamenDurdur('durdu'),
  };
}

/** Otomatik (TTS sonrası) dinleme — seviye ölçümü yok; iOS uyumu için dokunuşsuz STT */
export function dinlemeyiBaslatOtomatik(opts: Parameters<typeof dinlemeyiBaslat>[0]): DinlemeKontrol | null {
  return dinlemeyiBaslat({ ...opts, kullaniciBaslatti: false });
}
