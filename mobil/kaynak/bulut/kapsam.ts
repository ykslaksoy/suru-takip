/**
 * Bulut belge senkronu kapsamı (sy_* localStorage / SQLite koleksiyonları).
 * Her anahtar tek JSON belge olarak `public.belge` tablosuna gider (çiftlik + anahtar).
 */
import { finansMi, senkronlanirMi } from './siniflama';

const ORNEK_ANAHTARLAR = [
  'sy_animals',
  'sy_weights',
  'sy_health',
  'sy_stock',
  'sy_movements',
  'sy_foto_meta_v1',
] as const;

/** Kullanıcıya gösterilecek özet liste */
export function bulutSenkronKapsamOzeti(): string {
  return 'Sürü (kuzu), tartım, sağlık, stok/hareket, foto meta ve diğer sy_* iş kayıtları — çiftlik belgesi olarak. Ekip PIN, bulut oturumu ve senkron kuyruğu cihazda kalır.';
}

export function ornekSenkronAnahtarSenkronlanirMi(): boolean {
  return ORNEK_ANAHTARLAR.every(senkronlanirMi);
}

export function stokSenkronlanirMi(): boolean {
  return senkronlanirMi('sy_stock') && senkronlanirMi('sy_movements');
}

export function finansAyriKisit(): boolean {
  return finansMi('sy_maliyet_ayar_v1');
}
