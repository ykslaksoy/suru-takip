/**
 * Toplu hayvan seçimi — saf mantık (UI ve sesli komut ortak kullanır).
 * Parti = padok (1. parti → Padok A, 2. → B, 3. → C; "Padok B", "B partisi" de olur).
 */
import type { Animal } from '@/kaynak/cekirdek/tipler';

export type TopluGrup =
  | { tur: 'tum' }
  | { tur: 'padok'; ad: string }
  | { tur: 'liste'; kupeler: string[] };

const HARFLER = 'ABCDEFGHIJKLMNOPRSTUVYZ';

function norm(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');
}

/** Aktif (satılmamış / ölmemiş) hayvan mı */
export function aktifHayvanMi(a: Animal): boolean {
  return a.status !== 'sold' && a.status !== 'dead';
}

/** "3" → "Padok C", "b" → "Padok B", "Gözlem" → "Gözlem" */
export function partiAdiCoz(ham: string): string {
  const t = ham.trim();
  const sayi = /^\d+$/.test(t) ? parseInt(t, 10) : NaN;
  if (Number.isFinite(sayi) && sayi >= 1 && sayi <= HARFLER.length) return `Padok ${HARFLER[sayi - 1]}`;
  if (/^[a-zçğıöşü]$/i.test(t)) return `Padok ${t.toLocaleUpperCase('tr-TR')}`;
  if (/^padok\s+/i.test(t)) return `Padok ${t.replace(/^padok\s+/i, '').toLocaleUpperCase('tr-TR')}`;
  return t;
}

/** Yapıştırılan küpe listesi: virgül, boşluk, satır, noktalı virgül ile ayrılmış */
export function kupeListesiAyikla(metin: string): string[] {
  const parcalar = metin
    .split(/[\s,;\n\t]+/)
    .map((p) => p.trim().toUpperCase())
    .filter((p) => p.length > 0 && /\d/.test(p));
  return [...new Set(parcalar)];
}

function kupeEsit(a: Animal, kupe: string): boolean {
  const k = kupe.toUpperCase();
  const rakam = k.replace(/\D/g, '');
  const tag = a.earTag.toUpperCase();
  if (tag === k) return true;
  if ((a.sirtNo ?? '').trim() === k || (rakam && (a.sirtNo ?? '').trim() === rakam)) return true;
  if (rakam.length >= 3 && tag.replace(/\D/g, '').endsWith(rakam)) return true;
  return false;
}

export type TopluSecimSonuc = { secilen: Animal[]; bulunamayan: string[] };

/** Gruba göre hayvanları seç (yalnız aktif hayvanlar) */
export function topluSec(hayvanlar: Animal[], grup: TopluGrup): TopluSecimSonuc {
  const aktif = hayvanlar.filter(aktifHayvanMi);
  if (grup.tur === 'tum') return { secilen: aktif, bulunamayan: [] };
  if (grup.tur === 'padok') {
    const hedef = norm(grup.ad);
    return { secilen: aktif.filter((a) => norm(a.paddock) === hedef), bulunamayan: [] };
  }
  const secilen: Animal[] = [];
  const bulunamayan: string[] = [];
  const ids = new Set<string>();
  for (const k of grup.kupeler) {
    const a = aktif.find((x) => kupeEsit(x, k));
    if (!a) bulunamayan.push(k);
    else if (!ids.has(a.id)) {
      ids.add(a.id);
      secilen.push(a);
    }
  }
  return { secilen, bulunamayan };
}

/** Sesli okuma / başlık için: "Padok C" → "3. parti (Padok C)"; tüm → "Tüm kuzular" */
export function grupEtiketi(grup: TopluGrup): string {
  if (grup.tur === 'tum') return 'Tüm kuzular';
  if (grup.tur === 'liste') return `${grup.kupeler.length} küpe listesi`;
  const m = grup.ad.match(/^Padok ([A-ZÇĞİÖŞÜ])$/);
  if (m) {
    const i = HARFLER.indexOf(m[1]);
    if (i >= 0) return `${i + 1}. parti (${grup.ad})`;
  }
  return grup.ad;
}

/** Hayvanlarda geçen padok adları (sıralı, boşlar hariç) */
export function padokAdlari(hayvanlar: Animal[]): string[] {
  return [...new Set(hayvanlar.filter(aktifHayvanMi).map((a) => a.paddock).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'tr'),
  );
}
