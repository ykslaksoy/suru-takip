import { useEffect } from 'react';

type AcFn = () => void;

let acFn: AcFn | null = null;

export const AYARLAR_HREF = '/ayarlar' as const;

export function kaydetAyarlarAc(fn: AcFn | null) {
  acFn = fn;
}

/** Ayarlar ekranını her zaman üstte açar (router’a bağlı değil). */
export function gitAyarlar() {
  if (acFn) {
    acFn();
    return;
  }
}
