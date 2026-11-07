/**
 * Tek kanonik tartım yazımı — doğrulama, yinelenen engeli, rasyon güncellemesi, senkron durumu.
 */
import { v4 as uuidv4 } from 'uuid';
import type { Animal, WeightRecord } from '@/kaynak/cekirdek/tipler';
import { addWeightRecord, getAnimal, getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import { upsertRationPlanFromWeight } from '@/kaynak/rasyon/hayvan-plani';
import { tartimKgDogrula, tartimTarihNormalize, tartimYinelenenMi } from '@/kaynak/kilo/tartim-siralama';
import { tartimBulutDurumu, tartimBulutMesaji, type TartimBulutDurum } from '@/kaynak/kilo/tartim-bulut-durum';

export type { TartimBulutDurum } from '@/kaynak/kilo/tartim-bulut-durum';
export { tartimBulutMesaji } from '@/kaynak/kilo/tartim-bulut-durum';

export type TartimKayitSonuc =
  | { ok: true; kayit: WeightRecord; bulut: TartimBulutDurum; yinelenenAtlandi: false }
  | { ok: true; kayit: WeightRecord; bulut: TartimBulutDurum; yinelenenAtlandi: true }
  | { ok: false; neden: string };

export type TartimKayitGirdi = {
  animalId: string;
  weightKg: number;
  recordedAt?: string;
  notes?: string;
  id?: string;
  /** Yinelenen kayıt penceresi (ms); 0 = kontrol yok */
  yinelenenPencereMs?: number;
  /** Kayıt sonrası rasyon planı güncelle (varsayılan true) */
  rasyonGuncelle?: boolean;
};

export async function kaydetTartimKaydi(girdi: TartimKayitGirdi): Promise<TartimKayitSonuc> {
  const kgOk = tartimKgDogrula(girdi.weightKg);
  if (!kgOk.ok) return { ok: false, neden: kgOk.neden };

  const recordedAt = tartimTarihNormalize(girdi.recordedAt ?? new Date());
  const pencere = girdi.yinelenenPencereMs ?? 60_000;
  const mevcut = await getWeightRecords(girdi.animalId);
  const dup = tartimYinelenenMi(mevcut, { animalId: girdi.animalId, weightKg: kgOk.kg, recordedAt }, pencere);
  if (dup) {
    return { ok: true, kayit: dup, bulut: tartimBulutDurumu(), yinelenenAtlandi: true };
  }

  const kayit = await addWeightRecord({
    id: girdi.id ?? uuidv4(),
    animalId: girdi.animalId,
    weightKg: kgOk.kg,
    recordedAt,
    notes: girdi.notes?.trim() ?? '',
  });

  if (girdi.rasyonGuncelle !== false) {
    const animal = await getAnimal(girdi.animalId);
    if (animal) await upsertRationPlanFromWeight(animal as Animal, kgOk.kg);
  }

  return { ok: true, kayit, bulut: tartimBulutDurumu(), yinelenenAtlandi: false };
}
