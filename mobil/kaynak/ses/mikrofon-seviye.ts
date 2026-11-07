/**
 * Tarayıcı mikrofonu — yalnızca anlık seviye (AnalyserNode).
 * Ses kaydedilmez, yüklenmez; izin sonrası track'ler durdurulunca bırakılır.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type MikrofonSeviyeOturum = {
  durdur: () => void;
  seviyeOlcumVar: boolean;
};

const SES_ESIK = 0.08;

/** Frekans verisini sabit sayıda çubuk (0–1) — test edilebilir saf fonksiyon */
export function seviyeCubuklari(frekans: Uint8Array, adet: number): number[] {
  const n = Math.max(1, adet);
  if (!frekans.length) return Array(n).fill(0);
  const parca = Math.max(1, Math.floor(frekans.length / n));
  const bars: number[] = [];
  for (let i = 0; i < n; i++) {
    let sum = 0;
    const bas = i * parca;
    const son = i === n - 1 ? frekans.length : bas + parca;
    for (let j = bas; j < son; j++) sum += frekans[j] ?? 0;
    const ort = sum / (son - bas) / 255;
    bars.push(Math.min(1, Math.max(0, ort)));
  }
  return bars;
}

export function frekansOrtalama(frekans: Uint8Array): number {
  if (!frekans.length) return 0;
  let sum = 0;
  for (let i = 0; i < frekans.length; i++) sum += frekans[i] ?? 0;
  return sum / frekans.length / 255;
}

export function sesEsikUstu(ortalama: number, esik = SES_ESIK): boolean {
  return ortalama >= esik;
}

export function azalanHareketTercihi(): boolean {
  const w = typeof globalThis !== 'undefined' ? (globalThis as any).window : undefined;
  if (!w?.matchMedia) return false;
  try {
    return Boolean(w.matchMedia('(prefers-reduced-motion: reduce)')?.matches);
  } catch {
    return false;
  }
}

export function mikrofonSeviyeDestekleniyor(): boolean {
  const w = typeof globalThis !== 'undefined' ? (globalThis as any).window : undefined;
  return Boolean(w?.navigator?.mediaDevices?.getUserMedia);
}

type KaynakRefs = {
  stream: MediaStream | null;
  audioContext: AudioContext | null;
  rafId: number | null;
  analyser: AnalyserNode | null;
};

export function mikrofonKaynaklariSerbest(refs: KaynakRefs): void {
  if (refs.rafId != null) {
    const w = (globalThis as any).window;
    w?.cancelAnimationFrame?.(refs.rafId);
    refs.rafId = null;
  }
  refs.stream?.getTracks?.().forEach((t) => {
    try {
      t.stop();
    } catch {
      /* ignore */
    }
  });
  refs.stream = null;
  if (refs.audioContext) {
    const ctx = refs.audioContext;
    refs.audioContext = null;
    void ctx.close?.().catch(() => {});
  }
  refs.analyser = null;
}

export async function mikrofonSeviyeOturumuBaslat(opts: {
  cubukAdet?: number;
  reducedMotion?: boolean;
  onSeviye: (bars: number[], ortalama: number, sesVar: boolean) => void;
  onHazir?: () => void;
  onHata?: (kod: string) => void;
}): Promise<MikrofonSeviyeOturum | null> {
  const w = (globalThis as any).window;
  if (!w?.navigator?.mediaDevices?.getUserMedia) {
    opts.onHata?.('unsupported');
    return null;
  }

  const refs: KaynakRefs = {
    stream: null,
    audioContext: null,
    rafId: null,
    analyser: null,
  };
  let aktif = true;
  const cubukAdet = opts.cubukAdet ?? 12;

  try {
    refs.stream = await w.navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (e: any) {
    opts.onHata?.(String(e?.name ?? 'not-allowed'));
    return null;
  }

  try {
    const AC = w.AudioContext ?? w.webkitAudioContext;
    if (!AC) {
      mikrofonKaynaklariSerbest(refs);
      opts.onHata?.('unsupported');
      return null;
    }
    refs.audioContext = new AC();
    const kaynak = refs.audioContext.createMediaStreamSource(refs.stream);
    refs.analyser = refs.audioContext.createAnalyser();
    refs.analyser.fftSize = 64;
    refs.analyser.smoothingTimeConstant = opts.reducedMotion ? 0.85 : 0.55;
    kaynak.connect(refs.analyser);

    const buf = new Uint8Array(refs.analyser.frequencyBinCount);
    let sonGuncelleme = 0;
    const minAralik = opts.reducedMotion ? 500 : 16;

    const dongu = () => {
      if (!aktif || !refs.analyser) return;
      const simdi = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (simdi - sonGuncelleme >= minAralik) {
        refs.analyser.getByteFrequencyData(buf);
        const ort = frekansOrtalama(buf);
        const bars = seviyeCubuklari(buf, cubukAdet);
        opts.onSeviye(bars, ort, sesEsikUstu(ort));
        sonGuncelleme = simdi;
      }
      refs.rafId = w.requestAnimationFrame(dongu);
    };
    refs.rafId = w.requestAnimationFrame(dongu);
    opts.onHazir?.();
  } catch {
    mikrofonKaynaklariSerbest(refs);
    opts.onHata?.('start-failed');
    return null;
  }

  return {
    seviyeOlcumVar: true,
    durdur: () => {
      aktif = false;
      mikrofonKaynaklariSerbest(refs);
    },
  };
}
