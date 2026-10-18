const ONAY_KELIMELERI = [
  'tamam',
  'tamamdır',
  'tamamdir',
  'evet',
  'onay',
  'onayla',
  'onaylıyorum',
  'onayliyorum',
  'kaydet',
  'olur',
  'doğru',
  'dogru',
  'aynen',
  'hepsi bu',
  'öyle yap',
  'oyle yap',
] as const;

const RED_KELIMELERI = [
  'hayır',
  'hayir',
  'iptal',
  'vazgeç',
  'vazgec',
  'yanlış',
  'yanlis',
  'tekrar',
  'dur',
  'yok',
  'boşver',
  'bosver',
] as const;

function normalize(metin: string): string {
  return metin
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[.,!?;:'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Kullanıcı "tamam" dedi mi? */
export function onayMi(metin: string): boolean {
  const n = normalize(metin);
  if (!n) return false;
  return ONAY_KELIMELERI.some((k) => n === k || n.startsWith(`${k} `) || n.endsWith(` ${k}`));
}

/** Kullanıcı iptal / red mi dedi? */
export function redMi(metin: string): boolean {
  const n = normalize(metin);
  if (!n) return false;
  return RED_KELIMELERI.some((k) => n === k || n.startsWith(`${k} `) || n.endsWith(` ${k}`));
}

export function onayIpucuMetni(): string {
  return 'Onaylamak için "tamam" de. Yanlışsa "dur" ya da "yanlış" de.';
}

function kelimeler(metin: string): string[] {
  return normalize(metin).split(' ').filter(Boolean);
}

/** Kök olarak (kelime başı) aranan uyarı kelimeleri */
const DUZELTME_KOKLERI = [
  'hayır',
  'hayir',
  'iptal',
  'vazgeç',
  'vazgec',
  'yanlış',
  'yanlis',
  'değil',
  'degil',
  'düzelt',
  'duzelt',
  'olmadı',
  'olmadi',
  'boşver',
  'bosver',
  'tekrar',
  'bekle',
] as const;

/** Tam kelime olarak aranan kısa uyarılar */
const DUZELTME_TAM = ['dur', 'durun', 'durdur', 'yok', 'hata', 'hatalı', 'hatali', 'stop'] as const;

/**
 * Kullanıcı uyarı verdi mi? ("dur", "yanlış", "hayır", "iptal", "değil", "düzelt"…)
 * Cümle içinde geçmesi yeterli — "hayır yanlış küpe" gibi.
 */
export function duzeltmeIstegiMi(metin: string): boolean {
  return kelimeler(metin).some(
    (w) =>
      (DUZELTME_TAM as readonly string[]).includes(w) ||
      DUZELTME_KOKLERI.some((k) => w.startsWith(k)),
  );
}

/** Düzeltme sırasında tamamen vazgeçme ("iptal", "vazgeç", "boşver") */
export function tamIptalMi(metin: string): boolean {
  return kelimeler(metin).some((w) =>
    ['iptal', 'vazgeç', 'vazgec', 'boşver', 'bosver'].some((k) => w.startsWith(k)),
  );
}

/** Onay: tamam / evet / onay(la)… ve uyarı kelimesi YOK */
export function kesinOnayMi(metin: string): boolean {
  if (duzeltmeIstegiMi(metin)) return false;
  if (onayMi(metin)) return true;
  return kelimeler(metin).some((w) =>
    ['tamam', 'evet', 'onay', 'kaydet'].some((k) => w.startsWith(k)),
  );
}
