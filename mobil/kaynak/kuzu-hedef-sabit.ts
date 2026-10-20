/**
 * Kuzu damızlık/besi hedefi — saf yardımcılar (test / veri tespiti).
 */
import type { Animal } from '@/kaynak/cekirdek/tipler';

export type KuzuYonHedef = 'damizlik' | 'besi';

export function yasAy(birthDate: string): number | null {
  const b = new Date(birthDate).getTime();
  if (Number.isNaN(b)) return null;
  return (Date.now() - b) / (30.44 * 86400000);
}

export function satinAlinanKuzuMu(a: Animal): boolean {
  if (/satın|satin|alım|alim|giriş|giris|satın al/i.test(a.notes)) return true;
  const ay = yasAy(a.birthDate);
  if (ay == null || ay > 8) return false;
  return !a.motherId;
}

export function besiYolundaMi(a: Animal, hedef: Record<string, KuzuYonHedef>): boolean {
  if (hedef[a.id] === 'besi') return true;
  if (hedef[a.id] === 'damizlik') return false;
  if (satinAlinanKuzuMu(a)) return true;
  return /besi/i.test(`${a.notes} ${a.paddock}`);
}

export function sutDoganKuzuAdaylari(animals: Animal[], sutAnneIds: Set<string>): Animal[] {
  return animals.filter((a) => {
    const ay = yasAy(a.birthDate);
    if (ay == null || ay > 8) return false;
    if (!a.motherId || !sutAnneIds.has(a.motherId)) return false;
    return true;
  });
}

export function sutDisiAnneIds(animals: Animal[]): Set<string> {
  return new Set(
    animals
      .filter(
        (a) =>
          a.sex === 'female' &&
          a.status !== 'sold' &&
          a.status !== 'dead' &&
          (/sağmal|sagmal|süt|sut|laktasyon/i.test(`${a.notes} ${a.paddock}`) ||
            a.status === 'lactating' ||
            a.status === 'pregnant' ||
            a.status === 'dry'),
      )
      .map((a) => a.id),
  );
}
