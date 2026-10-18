/**
 * Sesli geri okuma için sayı / küpe metni.
 * Kısa sayılar doğal Türkçe ("bin iki yüz"), uzun küpeler rakam rakam okunur.
 */

const BIRLER = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const ONLAR = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
const RAKAM = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];

const HARF: Record<string, string> = {
  A: 'a', B: 'be', C: 'ce', Ç: 'çe', D: 'de', E: 'e', F: 'fe', G: 'ge', Ğ: 'yumuşak ge',
  H: 'he', I: 'ı', İ: 'i', J: 'je', K: 'ke', L: 'le', M: 'me', N: 'ne', O: 'o', Ö: 'ö',
  P: 'pe', Q: 'kü', R: 're', S: 'se', Ş: 'şe', T: 'te', U: 'u', Ü: 'ü', V: 've', W: 'dabılyu',
  X: 'iks', Y: 'ye', Z: 'ze',
};

function yuzlukOku(n: number): string {
  const y = Math.floor(n / 100);
  const o = Math.floor((n % 100) / 10);
  const b = n % 10;
  const parca: string[] = [];
  if (y > 0) parca.push(y === 1 ? 'yüz' : `${BIRLER[y]} yüz`);
  if (o > 0) parca.push(ONLAR[o]);
  if (b > 0) parca.push(BIRLER[b]);
  return parca.join(' ');
}

/** 0 – 999 999 999 arası tam sayıyı Türkçe okur. */
export function tamSayiOku(n: number): string {
  if (!Number.isFinite(n) || n < 0 || n >= 1e9) return String(n);
  n = Math.floor(n);
  if (n === 0) return 'sıfır';
  const milyon = Math.floor(n / 1e6);
  const bin = Math.floor((n % 1e6) / 1000);
  const kalan = n % 1000;
  const parca: string[] = [];
  if (milyon > 0) parca.push(`${yuzlukOku(milyon)} milyon`);
  if (bin > 0) parca.push(bin === 1 ? 'bin' : `${yuzlukOku(bin)} bin`);
  if (kalan > 0) parca.push(yuzlukOku(kalan));
  return parca.join(' ');
}

/** 52,5 → "elli iki virgül beş" */
export function sayiOku(n: number): string {
  if (Number.isInteger(n)) return tamSayiOku(n);
  const [tam, ondalik] = n.toFixed(2).replace(/0+$/, '').split('.');
  const ondalikOku = ondalik
    ? ondalik.startsWith('0')
      ? ondalik.split('').map((d) => RAKAM[Number(d)]).join(' ')
      : tamSayiOku(Number(ondalik))
    : '';
  return ondalikOku ? `${tamSayiOku(Number(tam))} virgül ${ondalikOku}` : tamSayiOku(Number(tam));
}

/**
 * Küpe numarasını anlaşılır okur.
 * - Yalnız rakam, en çok 4 hane, başında sıfır yok → doğal ("bin iki yüz")
 * - Diğerleri (TR-34-001235 gibi) → harf harf, rakam rakam; gruplar virgülle ayrılır
 */
export function kupeOku(kupe: string): string {
  const k = kupe.trim().toLocaleUpperCase('tr-TR');
  if (/^\d{1,4}$/.test(k) && !k.startsWith('0')) return tamSayiOku(Number(k));
  const gruplar = k.split(/[\s\-./]+/).filter(Boolean);
  return gruplar
    .map((g) =>
      g
        .split('')
        .map((c) => (/\d/.test(c) ? RAKAM[Number(c)] : (HARF[c] ?? c)))
        .join(' '),
    )
    .join(', ');
}
