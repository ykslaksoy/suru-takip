import { deleteWeightRecord, getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import { kaydetTartimKaydi } from '@/kaynak/kilo/tartim-kayit';
import { islemKaydet } from '@/kaynak/gecmis/gunluk';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';

export type TartimDuzeltGirdi = {
  animal: Animal;
  kayitId: string;
  eskiKg: number;
  yeniKg: number;
};

/** Son tartım kaydını düzeltir — sil + yeni kanonik kayıt, denetim notu */
export async function tartimKaydiDuzelt(
  girdi: TartimDuzeltGirdi,
): Promise<{ ok: true } | { ok: false; neden: string }> {
  const mevcut = await getWeightRecords(girdi.animal.id);
  const hedef = mevcut.find((w) => w.id === girdi.kayitId);
  if (!hedef) return { ok: false, neden: 'Tartım kaydı bulunamadı.' };
  if (Math.abs(hedef.weightKg - girdi.eskiKg) > 0.05) {
    return {
      ok: false,
      neden: `Kayıt ${hedef.weightKg} kg; beklenen eski ${girdi.eskiKg} kg — yeniden okuyun.`,
    };
  }
  const recordedAt = hedef.recordedAt;
  await deleteWeightRecord(hedef.id);
  const kayit = await kaydetTartimKaydi({
    animalId: girdi.animal.id,
    weightKg: girdi.yeniKg,
    recordedAt,
    notes: `Düzeltme (ses) · eski ${girdi.eskiKg} kg → ${girdi.yeniKg} kg`,
    yinelenenPencereMs: 0,
  });
  if (!kayit.ok) return { ok: false, neden: kayit.neden };
  await islemKaydet({
    tur: 'tartim',
    ozet: `${hayvanAnaEtiket(girdi.animal)} tartım düzeltme ${girdi.eskiKg}→${girdi.yeniKg} kg`,
    detay: 'Sesli komut · denetim',
    animalId: girdi.animal.id,
  });
  return { ok: true };
}

export async function sonTartimKaydi(animalId: string) {
  const list = (await getWeightRecords(animalId)).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  return list[0] ?? null;
}
