import { addHealthRecord, addWeightRecord, adjustStock, getAnimals, getStockItems } from '@/kaynak/cekirdek/veritabani';
import { getTabancaDurum, tabancaAyariGetir } from '@/kaynak/akilli-veteriner/tabanca-ayar';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { v4 as uuidv4 } from 'uuid';
import type { GrupAsiKomutu, SesKomutEylemi } from './tipler';
import { topluSec } from '@/kaynak/toplu/secim';
import { topluUygula } from '@/kaynak/toplu/uygula';
import { islemKaydet } from '@/kaynak/gecmis/gunluk';

/** Grup komutundaki aktif kuzu sayısı (geri okuma için) */
export async function grupHayvanSayisi(e: GrupAsiKomutu): Promise<number> {
  return topluSec(await getAnimals(), e.grup).secilen.length;
}

/** Tabanca açıksa grubun tabanca ayarı (ml); kapalı/uygun değilse undefined */
export async function grupTabancaMl(e: GrupAsiKomutu): Promise<number | undefined> {
  const durum = await getTabancaDurum();
  if (!durum.aktif) return undefined;
  const { secilen } = topluSec(await getAnimals(), e.grup);
  const ayar = await tabancaAyariGetir(e.programId, secilen, durum.kapasite);
  return ayar.uygun ? ayar.ayarMl : undefined;
}

export async function hayvanBul(arama: string) {
  const term = arama.trim();
  if (!term) return null;
  const list = await getAnimals({ search: term });
  const upper = term.toUpperCase();
  const digits = term.replace(/\D/g, '');
  return (
    list.find((a) => a.sirtNo?.trim() === term || a.sirtNo?.trim() === digits) ??
    list.find((a) => a.earTag.toUpperCase() === upper) ??
    list.find(
      (a) =>
        a.earTag.toUpperCase().includes(upper) ||
        a.turkvetNo.toUpperCase().includes(upper) ||
        (a.gehisId ?? '').toUpperCase().includes(upper) ||
        (a.sirtNo ?? '').includes(digits || term),
    ) ??
    list[0] ??
    null
  );
}

/** Onaylandıktan sonra eylemi veritabanına yazar */
export async function komutuUygula(eylem: SesKomutEylemi): Promise<{ ok: true } | { ok: false; hata: string }> {
  switch (eylem.tur) {
    case 'tartim': {
      const animal = await hayvanBul(eylem.kupeArama);
      if (!animal) {
        return { ok: false, hata: `${eylem.kupeArama} kayıtlı hayvan bulunamadı.` };
      }
      await addWeightRecord({
        id: uuidv4(),
        animalId: animal.id,
        weightKg: eylem.kiloKg,
        recordedAt: new Date().toISOString(),
        notes: 'Sesli komut',
      });
      await islemKaydet({ tur: 'tartim', ozet: `${hayvanAnaEtiket(animal)} · ${eylem.kiloKg} kg`, detay: 'Sesli komut', animalId: animal.id });
      return { ok: true };
    }
    case 'asi': {
      const animal = await hayvanBul(eylem.kupeArama);
      if (!animal) {
        return { ok: false, hata: `${eylem.kupeArama} kayıtlı hayvan bulunamadı.` };
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
        notes: `Sesli komut · ${hayvanAnaEtiket(animal)}`,
      });
      await islemKaydet({ tur: 'asi', ozet: `${hayvanAnaEtiket(animal)} · ${eylem.asiAdi}`, detay: 'Sesli komut', animalId: animal.id });
      return { ok: true };
    }
    case 'grup_asi': {
      const { secilen } = topluSec(await getAnimals(), eylem.grup);
      if (secilen.length === 0) return { ok: false, hata: 'Bu grupta kuzu bulunamadı.' };
      await topluUygula({ hayvanlar: secilen, programId: eylem.programId, programTur: eylem.programTur, kaynak: 'Sesli komut', tabanca: eylem.tabancaMl != null });
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
      await islemKaydet({ tur: 'stok', ozet: `${item.name} ${eylem.yon === 'giris' ? '+' : '−'}${eylem.miktar} ${item.unit}`, detay: 'Sesli komut' });
      return { ok: true };
    }
    default:
      return { ok: false, hata: 'Desteklenmeyen komut.' };
  }
}
