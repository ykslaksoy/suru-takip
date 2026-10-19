/** Hangi yerel anahtar buluta gider, hangisi finans verisidir. */

/** Cihaza özel — asla senkronlanmaz (oturum, tercih, PIN, abonelik, kendi meta verimiz) */
const CIHAZ_ON_EKLERI = ['sy_bulut_', 'suruyon_', 'sy_ses_', 'sy_gun1_oturum', 'sy_seri_oturum', 'sy_sayim_aktif'];
const CIHAZ_ANAHTARLARI = new Set([
  'sy_sync_queue',
  'sy_ekip_v1', // aktif profil + PIN cihazda kalır; ortak ekip sunucuda ciftlik_uye tablosunda
  'sy_ana_sayfa_tercih',
  'sy_beta_signups',
  'sy_beta_feedback',
]);

/** Para içeren koleksiyonlar — sunucu RLS yalnız finans yetkilisine gönderir */
const FINANS_ANAHTARLARI = new Set([
  'sy_maliyet_ayar_v1',
  'sy_stok_birim_fiyat_v1',
  'sy_sigorta_policeler_v1',
  'sy_yem_alim_v1',
  'sy_satis_v1',
  'sy_fiyat_sorusu_gecilen_v1',
]);

export function senkronlanirMi(anahtar: string): boolean {
  if (!anahtar.startsWith('sy_')) return false;
  if (CIHAZ_ANAHTARLARI.has(anahtar)) return false;
  if (anahtar.endsWith('_son')) return false; // "son hatırlatma" zaman damgaları cihaza özel
  return !CIHAZ_ON_EKLERI.some((o) => anahtar.startsWith(o));
}

export function finansMi(anahtar: string): boolean {
  return FINANS_ANAHTARLARI.has(anahtar) || /maliyet|fiyat|satis|police|prim/.test(anahtar);
}
