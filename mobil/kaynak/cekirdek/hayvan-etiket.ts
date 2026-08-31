import type { Animal } from './tipler';

/** Birincil tanımlayıcı — sırt/küpe kayıt numarası (isim değil) */
export function hayvanAnaEtiket(a: Pick<Animal, 'earTag' | 'sirtNo' | 'gehisId' | 'name'>): string {
  if (a.sirtNo?.trim()) return `Sırt ${a.sirtNo.trim()}`;
  if (a.earTag?.trim()) return a.earTag.trim();
  if (a.gehisId?.trim()) return a.gehisId.trim();
  if (a.name?.trim()) return a.name.trim();
  return 'Kayıtsız';
}

/** Alt satır: küpe + Aref */
export function hayvanAltEtiket(a: Pick<Animal, 'earTag' | 'sirtNo' | 'gehisId'>): string {
  const p: string[] = [];
  if (a.earTag?.trim()) p.push(`Küpe ${a.earTag.trim()}`);
  if (a.gehisId?.trim()) p.push(`Aref ${a.gehisId.trim()}`);
  return p.join(' · ');
}

/** Seed kayıtları — isim alanı boş; tanımlama numaralarla */
export function hayvanKayitAdi(_: { earTag: string; sirtNo: string }): string {
  return '';
}
