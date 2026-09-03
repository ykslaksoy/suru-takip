type AcFn = () => void;

let acFn: AcFn | null = null;
const dinleyiciler = new Set<(acik: boolean) => void>();

export const AYARLAR_HREF = '/ayarlar' as const;

export function kaydetAyarlarAc(fn: AcFn | null) {
  acFn = fn;
}

export function ayarlarAcildiMiDinle(cb: (acik: boolean) => void) {
  dinleyiciler.add(cb);
  return () => {
    dinleyiciler.delete(cb);
  };
}

function bildir(acik: boolean) {
  dinleyiciler.forEach((cb) => {
    try {
      cb(acik);
    } catch {
      /* ignore */
    }
  });
}

/** Ayarlar ekranını her zaman üstte açar. */
export function gitAyarlar() {
  if (acFn) {
    acFn();
    bildir(true);
    return;
  }
  // Provider henüz bağlanmadıysa yine de dinleyicilere haber ver
  bildir(true);
}

export function kapatAyarlarSinyal() {
  bildir(false);
}
