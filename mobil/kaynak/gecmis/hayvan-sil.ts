/** Hayvanı geri alınabilir şekilde sil / geri yükle */
import { deleteAnimal, getAnimal, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { copeAt, coptenCikar, islemKaydet } from './gunluk';

export async function hayvanSilGeriAlinabilir(id: string): Promise<boolean> {
  const a = await getAnimal(id);
  if (!a) return false;
  await copeAt({ id: a.id, tur: 'hayvan', etiket: hayvanAnaEtiket(a), veri: a });
  await deleteAnimal(id);
  await islemKaydet({ tur: 'silme', ozet: `${hayvanAnaEtiket(a)} silindi (çöp kutusunda)`, animalId: a.id });
  return true;
}

export async function hayvanGeriYukle(id: string): Promise<boolean> {
  const k = await coptenCikar(id);
  if (!k || k.tur !== 'hayvan') return false;
  const a = k.veri as Animal;
  await upsertAnimal(a);
  await islemKaydet({ tur: 'geri_alma', ozet: `${k.etiket} geri alındı`, animalId: a.id });
  return true;
}
