/** İçe aktarma önizlemesini depoya yazar (kuzu + isteğe bağlı ilk tartım) */
import { yetkiGerekli } from '@/kaynak/ekip/kapi';
import { v4 as uuidv4 } from 'uuid';
import { addWeightRecord, getAnimals, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { islemKaydet } from '@/kaynak/gecmis/gunluk';
import { kupeAnahtar, uygulanacaklar, type Onizleme, type TekrarPolitika } from './ice-aktar';

export async function mevcutKupeAnahtarlari(): Promise<Set<string>> {
  return new Set((await getAnimals()).map((a) => kupeAnahtar(a.earTag || '')).filter(Boolean));
}

export type IceAktarSonuc = { eklenen: number; guncellenen: number; tartim: number; atlanan: number };

export async function iceAktarUygula(o: Onizleme, politika: TekrarPolitika): Promise<IceAktarSonuc> {
  yetkiGerekli('duzenleme');
  const hayvanlar = await getAnimals();
  const kupeyeGore = new Map<string, Animal>();
  for (const a of hayvanlar) if (a.earTag) kupeyeGore.set(kupeAnahtar(a.earTag), a);
  const secilen = uygulanacaklar(o, politika);
  const bugun = new Date().toISOString().slice(0, 10);
  let eklenen = 0;
  let guncellenen = 0;
  let tartim = 0;

  // Önce hepsini yaz ki dosyadaki ana küpeleri de bulabilelim
  const yazilan: { a: Animal; motherTag?: string; fatherTag?: string; kiloKg?: number; kiloTarih?: string }[] = [];
  for (const s of secilen) {
    const v = s.veri;
    const anahtar = kupeAnahtar(v.earTag!);
    const eski = kupeyeGore.get(anahtar);
    const temel: Omit<Animal, 'createdAt' | 'updatedAt' | 'syncStatus'> = eski
      ? { ...eski }
      : {
          id: uuidv4(),
          earTag: v.earTag!,
          turkvetNo: '',
          name: '',
          breed: '',
          species: 'sheep',
          sex: 'female',
          birthDate: '',
          paddock: '',
          status: 'healthy',
          motherId: null,
          gehisId: null,
          sirtNo: null,
          modId: 'mod1',
          notes: '',
        };
    const birlesik = {
      ...temel,
      ...(v.turkvetNo ? { turkvetNo: v.turkvetNo } : {}),
      ...(v.sirtNo ? { sirtNo: v.sirtNo } : {}),
      ...(v.gehisId ? { gehisId: v.gehisId } : {}),
      ...(v.name ? { name: v.name } : {}),
      ...(v.species ? { species: v.species } : {}),
      ...(v.breed ? { breed: v.breed } : {}),
      ...(v.sex ? { sex: v.sex } : {}),
      ...(v.birthDate ? { birthDate: v.birthDate } : {}),
      ...(v.paddock ? { paddock: v.paddock } : {}),
      ...(v.status ? { status: v.status } : {}),
      ...(v.notes ? { notes: eski?.notes ? `${eski.notes}\n${v.notes}` : v.notes } : {}),
    };
    const kayit = await upsertAnimal(birlesik);
    kupeyeGore.set(anahtar, kayit);
    if (eski) guncellenen += 1;
    else eklenen += 1;
    yazilan.push({ a: kayit, motherTag: v.motherTag, fatherTag: v.fatherTag, kiloKg: v.kiloKg, kiloTarih: v.kiloTarih });
  }
  for (const y of yazilan) {
    if (y.motherTag) {
      const ana = kupeyeGore.get(kupeAnahtar(y.motherTag));
      if (ana && ana.id !== y.a.id && y.a.motherId !== ana.id) y.a = await upsertAnimal({ ...y.a, motherId: ana.id });
    }
    if (y.fatherTag) {
      const baba = kupeyeGore.get(kupeAnahtar(y.fatherTag));
      if (baba && baba.id !== y.a.id && y.a.fatherId !== baba.id) y.a = await upsertAnimal({ ...y.a, fatherId: baba.id });
    }
    if (y.kiloKg) {
      await addWeightRecord({
        animalId: y.a.id,
        weightKg: y.kiloKg,
        recordedAt: `${y.kiloTarih ?? bugun}T12:00:00.000Z`,
        notes: 'Excel içe aktarma',
      });
      tartim += 1;
    }
  }
  const atlanan = o.satirlar.length - secilen.length;
  await islemKaydet({
    tur: 'hayvan',
    ozet: `Excel içe aktarma: ${eklenen} yeni, ${guncellenen} güncellendi`,
    detay: `${tartim} tartım · ${atlanan} satır atlandı`,
    adet: eklenen + guncellenen,
  }).catch(() => undefined);
  return { eklenen, guncellenen, tartim, atlanan };
}
