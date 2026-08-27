import { addHealthRecord, addWeightRecord, adjustStock, getAnimals, getStockItems } from '@/kaynak/cekirdek/veritabani';
import { v4 as uuidv4 } from 'uuid';
import type { SesKomutEylemi } from './tipler';

async function hayvanBul(kupeArama: string) {
  const list = await getAnimals({ search: kupeArama });
  return list.find(
    (a) =>
      a.earTag.toUpperCase().includes(kupeArama.toUpperCase()) ||
      a.turkvetNo.includes(kupeArama)
  ) ?? list[0] ?? null;
}

/** Onaylandıktan sonra eylemi veritabanına yazar */
export async function komutuUygula(eylem: SesKomutEylemi): Promise<{ ok: true } | { ok: false; hata: string }> {
  switch (eylem.tur) {
    case 'tartim': {
      const animal = await hayvanBul(eylem.kupeArama);
      if (!animal) {
        return { ok: false, hata: `${eylem.kupeArama} küpeli hayvan bulunamadı.` };
      }
      await addWeightRecord({
        id: uuidv4(),
        animalId: animal.id,
        weightKg: eylem.kiloKg,
        recordedAt: new Date().toISOString(),
        notes: 'Sesli komut',
      });
      return { ok: true };
    }
    case 'asi': {
      const animal = await hayvanBul(eylem.kupeArama);
      if (!animal) {
        return { ok: false, hata: `${eylem.kupeArama} küpeli hayvan bulunamadı.` };
      }
      await addHealthRecord({
        id: uuidv4(),
        animalId: animal.id,
        recordType: 'vaccine',
        symptoms: '',
        diagnosis: 'Sesli komut aşı',
        treatment: eylem.asiAdi,
        medicine: eylem.asiAdi,
        withdrawalDays: 0,
        vetName: '',
        recordedAt: new Date().toISOString().split('T')[0],
        notes: 'Sesli komut',
      });
      return { ok: true };
    }
    case 'stok': {
      const items = await getStockItems();
      const item =
        items.find((i) => i.name.toLowerCase().includes(eylem.stokAdi.toLowerCase())) ?? items[0];
      if (!item) {
        return { ok: false, hata: 'Eşleşen stok kalemi bulunamadı.' };
      }
      await adjustStock(item.id, eylem.yon === 'giris' ? 'in' : 'out', eylem.miktar, 'Sesli komut');
      return { ok: true };
    }
    default:
      return { ok: false, hata: 'Desteklenmeyen komut.' };
  }
}
