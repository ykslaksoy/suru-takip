/** Satış / çıkış — toplu çıkış kaydı (Satış, Kesim, Ölüm) */
import type { Animal, AnimalStatus } from '@/kaynak/cekirdek/tipler';

export type CikisTur = 'satis' | 'kesim' | 'olum';

export const CIKIS_ETIKET: Record<CikisTur, string> = { satis: 'Satış', kesim: 'Kesim', olum: 'Ölüm' };

export function cikisDurumu(tur: CikisTur): AnimalStatus {
  return tur === 'olum' ? 'dead' : 'sold';
}

/** Arınma kontrolü gereken çıkışlar (et tüketimine gidebilir) */
export function arinmaKontroluGerekli(tur: CikisTur): boolean {
  return tur !== 'olum';
}

/** Hayvan notuna eklenecek çıkış satırı */
export function cikisNotu(a: Pick<Animal, 'notes'>, tur: CikisTur, tarihTr: string, tutar?: number | null): string {
  const satir = `Çıkış: ${CIKIS_ETIKET[tur]} ${tarihTr}${tutar ? ` · ${Math.round(tutar).toLocaleString('tr-TR')} ₺` : ''}`;
  return a.notes?.trim() ? `${a.notes.trim()}\n${satir}` : satir;
}

export function cikisaHazirla(a: Animal, tur: CikisTur, tarihTr: string, tutar?: number | null): Animal {
  return { ...a, status: cikisDurumu(tur), notes: cikisNotu(a, tur, tarihTr, tutar) };
}
