import { v4 as uuidv4 } from 'uuid';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import {
  addWeightRecord,
  countAnimals,
  getAnimal,
  upsertAnimal,
} from '@/kaynak/cekirdek/veritabani';
import { dogumGirdiDogrula, type DogumKayitGirdi } from './dogum-dogrula';

export type DogumKayitSonuc =
  | { ok: true; anne: Animal; kuzular: Animal[] }
  | { ok: false; message: string };

/**
 * Doğum kaydı: kuzu(lar) oluşturur, anne UUID bağlar, anneyi sağmal yapar.
 * motherId alanı anne hayvan UUID’sidir (Mod2 bağlama ile aynı).
 */
export async function dogumKaydet(girdi: DogumKayitGirdi): Promise<DogumKayitSonuc> {
  const hata = dogumGirdiDogrula(girdi);
  if (hata) return { ok: false, message: hata };

  const anne = await getAnimal(girdi.anneId);
  if (!anne) return { ok: false, message: 'Anne bulunamadı' };
  if (anne.sex !== 'female') return { ok: false, message: 'Doğum kaydı yalnızca dişi için' };
  if (anne.status === 'sold' || anne.status === 'dead') {
    return { ok: false, message: 'Satılmış veya ölü hayvan için doğum kaydı yapılamaz' };
  }

  const mevcut = await countAnimals();
  if (mevcut + girdi.kuzular.length > 5000) {
    return { ok: false, message: 'Hayvan limiti aşıldı' };
  }

  const padok = (girdi.paddock?.trim() || anne.paddock || 'Padok A').trim();
  const dogumNot = (girdi.notes ?? '').trim();
  const created: Animal[] = [];

  for (const k of girdi.kuzular) {
    const earTag = k.earTag.trim();
    const kuzuId = uuidv4();
    const notParts = [
      'doğum kaydı',
      anne.earTag ? `anne küpe ${anne.earTag}` : null,
      anne.turkvetNo ? `anne TÜRKVET ${anne.turkvetNo}` : null,
      dogumNot || null,
    ].filter(Boolean);

    const kuzu = await upsertAnimal({
      id: kuzuId,
      earTag,
      turkvetNo: '',
      gehisId: null,
      sirtNo: k.sirtNo?.trim() || null,
      name: '',
      breed: anne.breed || 'Merinos',
      species: anne.species ?? 'sheep',
      sex: k.sex,
      birthDate: girdi.birthDate.trim(),
      paddock: padok,
      status: 'healthy',
      motherId: anne.id,
      modId: anne.modId,
      notes: notParts.join(' · '),
    });
    created.push(kuzu);

    if (k.birthWeightKg != null && k.birthWeightKg > 0) {
      await addWeightRecord({
        animalId: kuzuId,
        weightKg: k.birthWeightKg,
        recordedAt: `${girdi.birthDate.trim()}T12:00:00.000Z`,
        notes: 'Doğum kilosu',
      });
    }
  }

  const guncelAnne = await upsertAnimal({
    ...anne,
    status: 'lactating',
    notes: anne.notes.includes('doğum')
      ? anne.notes
      : `${anne.notes ? `${anne.notes} · ` : ''}doğum ${girdi.birthDate.trim()}`.trim(),
  });

  return { ok: true, anne: guncelAnne, kuzular: created };
}

/** Dişiyi gebe işaretle (üreme temel). */
export async function gebeIsaretle(
  anneId: string,
): Promise<{ ok: true; animal: Animal } | { ok: false; message: string }> {
  const anne = await getAnimal(anneId);
  if (!anne) return { ok: false, message: 'Hayvan bulunamadı' };
  if (anne.sex !== 'female') return { ok: false, message: 'Yalnızca dişi gebe işaretlenebilir' };
  if (anne.status === 'sold' || anne.status === 'dead') {
    return { ok: false, message: 'Satılmış veya ölü hayvan güncellenemez' };
  }
  const animal = await upsertAnimal({ ...anne, status: 'pregnant' });
  return { ok: true, animal };
}
