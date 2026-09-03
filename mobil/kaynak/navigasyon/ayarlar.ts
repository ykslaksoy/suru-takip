import { router } from 'expo-router';

/** Tek gerçek Ayarlar yolu — sekme ile çakışmasın diye stack ekranı */
export const AYARLAR_HREF = '/ayarlar' as const;

export function gitAyarlar() {
  router.push(AYARLAR_HREF);
}
