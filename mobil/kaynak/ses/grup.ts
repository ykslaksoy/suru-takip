/**
 * Grup (parti / tüm kuzular) sesli komutu — saf ayıklayıcı.
 * "3. parti karma aşısı yapıldı" · "tüm kuzular ivermektin" · "padok B selenyum verildi"
 */
import { partiAdiCoz, type TopluGrup } from '@/kaynak/toplu/secim';
import { programEslestir } from '@/kaynak/toplu/program-esle';
import type { GrupAsiKomutu } from './tipler';

const TUM_RE = /\b(?:tüm|tum|bütün|butun|hepsi|bütün)\s*(?:kuzular(?:a)?|hayvanlar(?:a)?|sürü(?:ye)?|suru(?:ye)?)?/i;
const PARTI_SAYI_RE = /\b(\d{1,2})\s*\.?\s*(?:parti|padok)(?:si|sı|ye|ya|deki|daki)?\b/i;
const PARTI_ON_RE = /\b(?:parti|padok)\s+([a-zçğıöşü]|\d{1,2})\b/i;
const PARTI_HARF_RE = /\b([a-zçğıöşü])\s+(?:partisi|partiye|padoku|padoğu)\b/i;
const DOLGU_RE =
  /\b(?:kuzular(?:a)?|kuzu|hayvanlar(?:a)?|yapıldı|yapildi|verildi|uygulandı|uygulandi|yap|ver|uygula|aşısı|asisi|aşı|asi|ilacı|ilaci|ilaç|ilac|hapı|hapi|vitamini)\b/gi;

export function grupAyikla(metin: string): { grup: Exclude<TopluGrup, { tur: 'liste' }>; kalan: string } | null {
  const t = metin.trim();
  for (const re of [PARTI_SAYI_RE, PARTI_ON_RE, PARTI_HARF_RE]) {
    const m = re.exec(t);
    if (m) return { grup: { tur: 'padok', ad: partiAdiCoz(m[1]) }, kalan: (t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length)).trim() };
  }
  const m = TUM_RE.exec(t);
  if (m) return { grup: { tur: 'tum' }, kalan: (t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length)).trim() };
  return null;
}

/** Grup komutu mu? Değilse null (tek küpe komutlarına dokunmaz) */
export function grupKomutAyikla(metin: string): GrupAsiKomutu | null {
  const g = grupAyikla(metin);
  if (!g) return null;
  const adHam = g.kalan.replace(DOLGU_RE, ' ').replace(/[,.;:!?]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!adHam) return null;
  const p = programEslestir(adHam);
  if (!p) return null;
  return { tur: 'grup_asi', grup: g.grup, asiAdi: p.ad, programId: p.id, programTur: p.tur };
}
