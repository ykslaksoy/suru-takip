import type { AnimalSex } from '@/kaynak/cekirdek/tipler';

/** Tek kuzu satırı — doğum formundan */
export type DogumKuzuGirdi = {
  earTag: string;
  sex: AnimalSex;
  /** Doğum kilosu (kg); yoksa tartım yazılmaz */
  birthWeightKg?: number | null;
  sirtNo?: string | null;
};

export type DogumKayitGirdi = {
  anneId: string;
  /** YYYY-MM-DD */
  birthDate: string;
  kuzular: DogumKuzuGirdi[];
  paddock?: string;
  notes?: string;
};

const TARIH_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Saf doğrulama — UI ve test için (DB / RN yok). */
export function dogumGirdiDogrula(girdi: DogumKayitGirdi): string | null {
  if (!girdi.anneId?.trim()) return 'Anne seçilmedi';
  if (!TARIH_RE.test(girdi.birthDate?.trim() ?? '')) {
    return 'Doğum tarihi YYYY-MM-DD olmalı';
  }
  if (!girdi.kuzular?.length) return 'En az bir kuzu girin';
  if (girdi.kuzular.length > 4) return 'En fazla 4 kuzu kaydedilebilir';
  const kupeSet = new Set<string>();
  for (let i = 0; i < girdi.kuzular.length; i++) {
    const k = girdi.kuzular[i];
    const kupe = (k.earTag ?? '').trim();
    if (!kupe) return `${i + 1}. kuzu: küpe numarası zorunlu`;
    const key = kupe.toLocaleLowerCase('tr');
    if (kupeSet.has(key)) return `Tekrarlayan küpe: ${kupe}`;
    kupeSet.add(key);
    if (k.sex !== 'female' && k.sex !== 'male') {
      return `${i + 1}. kuzu: cinsiyet seçin`;
    }
    if (k.birthWeightKg != null && (Number.isNaN(k.birthWeightKg) || k.birthWeightKg <= 0)) {
      return `${i + 1}. kuzu: doğum kilosu geçersiz`;
    }
  }
  return null;
}
