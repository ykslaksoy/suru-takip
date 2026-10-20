/**
 * Geri dönüşüm kutusu — kuzu ve kayıtları geri alınabilir şekilde sil, geri yükle, kalıcı sil.
 * Kuzu silinince tartım ve sağlık kayıtları da kutuya taşınır; geri alınca hepsi döner.
 */
import { yetkiGerekli } from '@/kaynak/ekip/kapi';
import {
  addHealthRecord,
  addWeightRecord,
  deleteAnimal,
  deleteHealthRecord,
  deleteWeightRecord,
  getAnimal,
  getHealthRecords,
  getWeightRecords,
  upsertAnimal,
} from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal, HealthRecord, WeightRecord } from '@/kaynak/cekirdek/tipler';
import { denetimYaz } from '@/kaynak/cekirdek/denetim';
import { copeAt, coptenCikar, getCopKutusu, islemKaydet } from './gunluk';
import { COP_TUR_ETIKET, hayvanCopVerisi } from './cop';
import { rasyonGeriYukle } from '@/kaynak/yem/kayit';
import { fotoGeriYukle, metaOku, metaYaz } from '@/kaynak/galeri/meta';
import { ciftlesmeGeriYukle } from '@/kaynak/ciftlesme/kayit';
import type { CiftlesmeKaydi } from '@/kaynak/ciftlesme/hesap';
import { gorselSil } from '@/kaynak/galeri/gorsel';
import type { FotoKaydi } from '@/kaynak/galeri/hesap';
import { silinenDemoIsaretle } from '@/kaynak/cekirdek/demo-silinen';
import type { PartiRasyonu } from '@/kaynak/yem/hesap';
import type { CopKaydi, CopTur } from './tipler';
import { policeGeriYukle } from '@/kaynak/sigorta/depo';
import type { SigortaPolice } from '@/kaynak/sigorta/hesap';
import { sablonGeriYukle } from '@/kaynak/sablon/depo';
import type { KayitSablonu } from '@/kaynak/sablon/hesap';

export async function hayvanSilGeriAlinabilir(id: string): Promise<boolean> {
  yetkiGerekli('silme');
  const a = await getAnimal(id);
  if (!a) return false;
  const [weights, health] = await Promise.all([getWeightRecords(id).catch(() => []), getHealthRecords(id).catch(() => [])]);
  const temizSaglik = health.map(({ earTag: _e, sirtNo: _s, ...h }) => h as HealthRecord);
  await copeAt({ id: a.id, tur: 'hayvan', etiket: hayvanAnaEtiket(a), veri: { animal: a, weights, health: temizSaglik }, animalId: a.id });
  for (const w of weights) await deleteWeightRecord(w.id);
  for (const h of temizSaglik) await deleteHealthRecord(h.id);
  await deleteAnimal(id);
  await silinenDemoIsaretle(id, true);
  await islemKaydet({ tur: 'silme', ozet: `${hayvanAnaEtiket(a)} silindi (geri dönüşüm kutusunda)`, animalId: a.id });
  return true;
}

export async function saglikKaydiSil(r: HealthRecord, etiket: string): Promise<void> {
  const { earTag: _e, sirtNo: _s, ...temiz } = r as HealthRecord & { earTag?: string; sirtNo?: string | null };
  await copeAt({ id: r.id, tur: 'saglik', etiket: `${etiket} · ${r.medicine || r.treatment || r.diagnosis || 'Sağlık kaydı'}`, veri: temiz, animalId: r.animalId });
  await deleteHealthRecord(r.id);
  await islemKaydet({ tur: 'silme', ozet: `Sağlık kaydı silindi · ${etiket}`, animalId: r.animalId });
}

export async function tartimSil(w: WeightRecord, etiket: string): Promise<void> {
  await copeAt({ id: w.id, tur: 'tartim', etiket: `${etiket} · ${w.weightKg} kg`, veri: w, animalId: w.animalId });
  await deleteWeightRecord(w.id);
  await islemKaydet({ tur: 'silme', ozet: `Tartım silindi · ${etiket} · ${w.weightKg} kg`, animalId: w.animalId });
}

type GeriYukleyici = (veri: unknown) => Promise<void>;
const yukleyiciler: Partial<Record<CopTur, GeriYukleyici>> = {};
/** Diğer modüller kendi kayıt türü için geri yükleyici bağlar (poliçe, şablon, foto…) */
export function copGeriYukleyiciBagla(tur: CopTur, f: GeriYukleyici): void {
  yukleyiciler[tur] = f;
}

export async function copGeriYukle(id: string): Promise<CopKaydi | null> {
  const k = (await getCopKutusu()).find((x) => x.id === id);
  if (!k) return null;
  if (k.tur === 'hayvan') {
    const { animal, weights, health } = hayvanCopVerisi(k.veri);
    await upsertAnimal(animal as unknown as Animal);
    await silinenDemoIsaretle((animal as unknown as Animal).id, false);
    for (const w of weights as WeightRecord[]) await addWeightRecord(w);
    for (const h of health as HealthRecord[]) await addHealthRecord(h);
  } else if (k.tur === 'saglik') {
    await addHealthRecord(k.veri as HealthRecord);
  } else if (k.tur === 'tartim') {
    await addWeightRecord(k.veri as WeightRecord);
  } else if (k.tur === 'police') {
    await policeGeriYukle(k.veri as SigortaPolice);
  } else if (k.tur === 'sablon') {
    await sablonGeriYukle(k.veri as KayitSablonu);
  } else if (k.tur === 'foto' && !yukleyiciler.foto) {
    await fotoGeriYukle(k.veri as FotoKaydi);
  } else if (k.tur === 'ureme' && !yukleyiciler.ureme) {
    await ciftlesmeGeriYukle(k.veri as CiftlesmeKaydi);
  } else if (k.tur === 'yem' && !yukleyiciler.yem) {
    await rasyonGeriYukle(k.veri as PartiRasyonu);
  } else {
    const f = yukleyiciler[k.tur];
    if (!f) return null;
    await f(k.veri);
  }
  await coptenCikar(id);
  denetimYaz({ eylem: 'geri_alma', tablo: k.tur === 'hayvan' ? 'hayvan' : k.tur === 'saglik' ? 'saglik' : k.tur === 'tartim' ? 'tartim' : k.tur === 'police' ? 'police' : k.tur === 'sablon' ? 'sablon' : k.tur === 'foto' ? 'foto' : k.tur === 'yem' ? 'yem' : k.tur === 'ureme' ? 'ureme' : 'diger', kayitId: id, animalId: k.animalId, ozet: `${COP_TUR_ETIKET[k.tur]} geri alındı · ${k.etiket}` });
  await islemKaydet({ tur: 'geri_alma', ozet: `${k.etiket} geri alındı`, animalId: k.animalId });
  return k;
}

/** Eski ad — İşlem geçmişi ekranı uyumu */
export async function hayvanGeriYukle(id: string): Promise<boolean> {
  return (await copGeriYukle(id)) != null;
}

export async function copKaliciSil(id: string): Promise<CopKaydi | null> {
  yetkiGerekli('silme');
  const k = await coptenCikar(id);
  if (!k) return null;
  if (k.tur === 'foto') {
    const f = k.veri as FotoKaydi;
    await gorselSil(f).catch(() => undefined);
    await metaYaz((await metaOku()).filter((x) => x.id !== f.id));
  }
  denetimYaz({ eylem: 'kalici_silme', tablo: 'diger', kayitId: id, animalId: k.animalId, ozet: `${COP_TUR_ETIKET[k.tur]} kalıcı silindi · ${k.etiket}` });
  return k;
}
