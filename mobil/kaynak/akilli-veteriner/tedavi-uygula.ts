import { getAnimal, getAnimals, addHealthRecord, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { getPadoklar } from '@/kaynak/suru/padok';
import type { HastalikTeshis, IlacDoz } from './teshis';
import {
  getTakip,
  karantinaYapildiIsaretle,
  suruTedaviIsaretle,
  tedaviUygulandiIsaretle,
} from './takip';

function ilacMetni(ilac: IlacDoz): string {
  return `${ilac.ilacAdi} ${ilac.doz} ${ilac.uygulama} (${ilac.siklik})`;
}

/** Hayvanı karantina padokuna taşı */
export async function hayvaniKarantinayaAl(animalId: string): Promise<{ ok: boolean; padok: string; message: string }> {
  const animal = await getAnimal(animalId);
  if (!animal) return { ok: false, padok: '', message: 'Hayvan bulunamadı' };

  const padoklar = await getPadoklar();
  const karantina = padoklar.find((p) => p.karantina) ?? padoklar[0];
  if (!karantina) return { ok: false, padok: '', message: 'Karantina padoku tanımlı değil' };

  await upsertAnimal({
    ...animal,
    paddock: karantina.ad,
    notes: `${animal.notes}\n[${new Date().toISOString().slice(0, 10)}] Akıllı Vet karantina`.trim(),
  });

  return { ok: true, padok: karantina.ad, message: `${animal.earTag} → ${karantina.ad} padokuna alındı` };
}

/** Tek hayvana tedavi kaydı */
export async function tedaviKaydet(
  animalId: string,
  teshis: HastalikTeshis,
  ilaclar: IlacDoz[]
): Promise<void> {
  const metin = ilaclar.map(ilacMetni).join('; ');
  await addHealthRecord({
    animalId,
    recordType: 'treatment',
    symptoms: teshis.aciklama,
    diagnosis: `${teshis.hastalikAdi} (${teshis.dereceEtiket})`,
    treatment: metin,
    medicine: ilaclar.map((i) => i.ilacAdi).join(', '),
    withdrawalDays: ilaclar.some((i) => i.tip === 'igne') ? 14 : 0,
    vetName: 'Akıllı Veteriner',
    recordedAt: new Date().toISOString(),
    notes: `Etki süresi: ${teshis.etkiSuresiGun} gün`,
  });
}

export async function uygulaTedaviVeTakip(
  takipId: string,
  opts?: { vetOnayAtlandi?: boolean; kg?: number }
): Promise<{ ok: boolean; message: string }> {
  const takip = await getTakip(takipId);
  if (!takip) return { ok: false, message: 'Takip kaydı yok' };

  if (takip.teshis.vetDanisma === 'zorunlu' && !takip.vetDanisildi && !opts?.vetOnayAtlandi) {
    return { ok: false, message: 'Önce veterinere danışın veya vet onayı alın' };
  }

  const ilaclar =
    opts?.kg && opts.kg > 0
      ? (await import('./doz-hesap')).ilaclariKgIleHesapla(takip.teshis.ilaclar, opts.kg)
      : takip.teshis.ilaclar;

  if (takip.animalId) {
    await tedaviKaydet(takip.animalId, takip.teshis, ilaclar);
    if (takip.teshis.karantinaGerekli && !takip.karantinaYapildi) {
      const k = await hayvaniKarantinayaAl(takip.animalId);
      if (k.ok) await karantinaYapildiIsaretle(takipId, k.padok);
    }
  }

  await tedaviUygulandiIsaretle(takipId);
  return {
    ok: true,
    message: `Tedavi kaydedildi. ${takip.teshis.etkiSuresiGun} gün sonra kontrol fotoğrafı istenecek.`,
  };
}

/** Aynı padok veya tüm kuzulara sürü tedavisi */
export async function uygulaSuruTedavisi(
  takipId: string,
  hedef: 'ayni_padok' | 'tum_kuzular'
): Promise<{ ok: boolean; sayi: number; message: string }> {
  const takip = await getTakip(takipId);
  if (!takip) return { ok: false, sayi: 0, message: 'Takip yok' };

  const ilaclar = takip.teshis.suruIlaclari.length ? takip.teshis.suruIlaclari : takip.teshis.ilaclar;
  if (ilaclar.length === 0) return { ok: false, sayi: 0, message: 'Sürü tedavisi tanımlı değil' };

  const animals = await getAnimals();
  const now = Date.now();
  let hedefler = animals.filter((a) => a.status !== 'sold' && a.status !== 'dead');

  if (hedef === 'ayni_padok') {
    hedefler = hedefler.filter((a) => a.paddock === takip.paddock && a.id !== takip.animalId);
  } else {
    hedefler = hedefler.filter((a) => {
      const yas = (now - new Date(a.birthDate).getTime()) / 86400000;
      return yas <= 365;
    });
  }

  for (const a of hedefler) {
    await tedaviKaydet(a.id, takip.teshis, ilaclar);
  }

  await suruTedaviIsaretle(takipId, hedef);
  return {
    ok: true,
    sayi: hedefler.length,
    message: `${hedefler.length} hayvana sürü tedavisi kaydedildi`,
  };
}

/** Kulak küpe ile hayvan bul */
export async function hayvanBulKupe(
  kupe: string
): Promise<{ id: string; earTag: string; paddock: string; kiloKg: number | null } | null> {
  const { getLatestWeight } = await import('@/kaynak/cekirdek/veritabani');
  const term = kupe.trim().toLowerCase();
  if (!term) return null;
  const animals = await getAnimals({ search: kupe.trim() });
  const a =
    animals.find((x) => x.earTag.toLowerCase() === term) ??
    animals.find((x) => x.turkvetNo.toLowerCase().includes(term)) ??
    animals[0];
  if (!a) return null;
  const kiloKg = await getLatestWeight(a.id);
  return { id: a.id, earTag: a.earTag, paddock: a.paddock, kiloKg };
}
