/**
 * Konuşma (TTS) + dinleme (STT) adaptörü.
 * Web: SpeechSynthesis / SpeechRecognition.
 * Native: metin yolu; canlı mikrofon sonra native STT ile açılır.
 */

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

/**
 * Kısa dinleme oturumu. Destek yoksa null döner.
 * Sonuç metin olarak onSonuc ile gelir.
 */
export function dinlemeyiBaslat(opts: {
  onSonuc: (metin: string) => void;
  /** kod: tarayıcı hata kodu (örn. 'not-allowed' — iOS’ta dokunuşsuz başlatma engeli) */
  onHata?: (mesaj: string, kod?: string) => void;
  onBasladi?: () => void;
  /** Sonuç gelmeden dinleme bittiğinde */
  onBitti?: () => void;
}): DinlemeKontrol | null {
  const { Rec } = webApis();
  if (!Rec) {
    opts.onHata?.(
      'Bu ortamda mikrofon dinleme yok. Komutu kutuya yazıp Gönder’e basın.'
    );
    return null;
  }

  const rec = new Rec();
  rec.lang = 'tr-TR';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.continuous = false;

  rec.onstart = () => opts.onBasladi?.();
  let sonucGeldi = false;
  rec.onerror = (ev: any) =>
    opts.onHata?.('Dinleme başarısız. Metin ile deneyin.', String(ev?.error ?? ''));
  rec.onresult = (ev: any) => {
    const text = String(ev?.results?.[0]?.[0]?.transcript ?? '').trim();
    if (text) {
      sonucGeldi = true;
      opts.onSonuc(text);
    }
  };
  rec.onend = () => {
    if (!sonucGeldi) opts.onBitti?.();
  };

  try {
    rec.start();
  } catch (e: any) {
    opts.onHata?.('Mikrofon başlatılamadı.', String(e?.name ?? 'start-failed'));
    return null;
  }

  return {
    durdur: () => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    },
  };
}
