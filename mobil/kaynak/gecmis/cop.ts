/** Geri dönüşüm kutusu — saf yardımcılar (30 gün saklama) */
import type { CopKaydi, CopTur } from './tipler';

export const COP_SAKLAMA_GUN = 30;
const GUN = 86400000;

export const COP_TUR_ETIKET: Record<CopTur, string> = {
  hayvan: 'Kuzu',
  saglik: 'Sağlık kaydı',
  tartim: 'Tartım',
  police: 'Sigorta poliçesi',
  sablon: 'Kayıt şablonu',
  foto: 'Fotoğraf',
  yem: 'Yem / rasyon',
  ureme: 'Çiftleşme / doğum',
};

export const COP_TUR_SIMGE: Record<CopTur, string> = {
  hayvan: '🐑',
  saglik: '💊',
  tartim: '⚖️',
  police: '🛡️',
  sablon: '📋',
  foto: '📷',
  yem: '🌾',
  ureme: '🐏',
};

/** Kalıcı silinmeye kalan gün (0 = bugün siliniyor) */
export function copKalanGun(k: Pick<CopKaydi, 'silinme'>, simdi = Date.now()): number {
  const bitis = new Date(k.silinme).getTime() + COP_SAKLAMA_GUN * GUN;
  return Math.max(0, Math.ceil((bitis - simdi) / GUN));
}

/** 30 günü dolanları ayıkla */
export function copSuresiDolanlar<T extends Pick<CopKaydi, 'silinme'>>(l: T[], simdi = Date.now()): { kalan: T[]; dolan: T[] } {
  const kalan: T[] = [];
  const dolan: T[] = [];
  for (const k of l) (new Date(k.silinme).getTime() + COP_SAKLAMA_GUN * GUN <= simdi ? dolan : kalan).push(k);
  return { kalan, dolan };
}

/** Eski biçim: veri doğrudan Animal; yeni: { animal, weights, health } */
export function hayvanCopVerisi(veri: unknown): { animal: Record<string, unknown> & { id: string }; weights: unknown[]; health: unknown[] } {
  const v = veri as { animal?: unknown; weights?: unknown[]; health?: unknown[] };
  if (v && typeof v === 'object' && 'animal' in v && v.animal) {
    return { animal: v.animal as Record<string, unknown> & { id: string }, weights: v.weights ?? [], health: v.health ?? [] };
  }
  return { animal: veri as Record<string, unknown> & { id: string }, weights: [], health: [] };
}
