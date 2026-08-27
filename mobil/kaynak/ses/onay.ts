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
  return 'Onaylamak için "tamam" de. İptal için "iptal" de.';
}
