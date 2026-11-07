/**
 * Gözlem incelemesinde mevcut veteriner kayıtlarını özetler; otomatik tedavi başlatmaz.
 */
import type { HealthRecord } from '@/kaynak/cekirdek/tipler';
import type { HastalikTakip } from '@/kaynak/akilli-veteriner/takip';

export type UyumVeterinerOzet = {
  aktifTakipVar: boolean;
  tedaviPlaniVar: boolean;
  veterinerAtanmisKayit: boolean;
  eylemGerekli: boolean;
  ozet: string;
};

type SaglikSatir = Pick<HealthRecord, 'animalId' | 'recordType' | 'treatment' | 'medicine' | 'diagnosis' | 'vetName'>;

type TakipSatir = Pick<HastalikTakip, 'animalId' | 'asama' | 'tedaviUygulandi' | 'vetDanisildi'>;

export function uyumVeterinerOzeti(
  hayvanIds: string[],
  saglik: SaglikSatir[],
  takipler: TakipSatir[],
): UyumVeterinerOzet {
  const hedef = new Set(hayvanIds);
  const ilgiliSaglik = saglik.filter((s) => hedef.has(s.animalId));
  const ilgiliTakip = takipler.filter((t) => t.animalId && hedef.has(t.animalId) && t.asama !== 'taburcu');

  const tedaviPlaniVar = ilgiliSaglik.some(
    (s) =>
      s.recordType === 'treatment' &&
      (s.treatment.trim().length > 0 || s.medicine.trim().length > 0),
  );
  const veterinerAtanmisKayit = ilgiliSaglik.some((s) => s.vetName.trim().length > 0 && s.vetName !== 'Akıllı Veteriner');
  const aktifTakipVar = ilgiliTakip.length > 0;

  const eylemGerekli = hayvanIds.length > 0 && !tedaviPlaniVar && !aktifTakipVar;

  let ozet = 'Seçili hayvanlarda kayıtlı tedavi planı veya aktif hastalık takibi yok — veteriner ataması gerekli.';
  if (aktifTakipVar && tedaviPlaniVar) {
    ozet = 'Aktif takip ve tedavi kaydı mevcut; önerilen doz uygulanmaz, kayıtları inceleyin.';
  } else if (aktifTakipVar) {
    ozet = 'Aktif hastalık takibi var; karantina/taşıma öncesi takip ekranını kullanın.';
  } else if (tedaviPlaniVar) {
    ozet = 'Tedavi kaydı var; ilaç/doz bu ekrandan otomatik eklenmez.';
  } else if (veterinerAtanmisKayit) {
    ozet = 'Veteriner notu var; atanmış plan için sağlık sekmesine gidin.';
  }

  return { aktifTakipVar, tedaviPlaniVar, veterinerAtanmisKayit, eylemGerekli, ozet };
}
