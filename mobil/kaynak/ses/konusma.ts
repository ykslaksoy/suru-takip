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

/** Geri okuma metnini seslendir (mümkünse) */
export function metniSeslendir(metin: string): void {
  const { synth } = webApis();
  if (!synth || !metin.trim()) return;
  try {
    synth.cancel();
    const Utterance = (globalThis as any).SpeechSynthesisUtterance;
    if (!Utterance) return;
    const u = new Utterance(metin);
    u.lang = 'tr-TR';
    u.rate = 0.95;
    synth.speak(u);
  } catch {
    /* sessiz düş */
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
  onHata?: (mesaj: string) => void;
  onBasladi?: () => void;
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
  rec.onerror = () => opts.onHata?.('Dinleme başarısız. Metin ile deneyin.');
  rec.onresult = (ev: any) => {
    const text = String(ev?.results?.[0]?.[0]?.transcript ?? '').trim();
    if (text) opts.onSonuc(text);
  };

  try {
    rec.start();
  } catch {
    opts.onHata?.('Mikrofon başlatılamadı.');
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
