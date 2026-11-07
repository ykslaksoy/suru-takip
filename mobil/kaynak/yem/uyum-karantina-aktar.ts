/**
 * Şüphe ile karantina taşıması — mevcut padok/sağlık mekanizması; teşhis icat etmez.
 */
import { addHealthRecord, getAnimal, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { getPadokByAd, getPadoklar } from '@/kaynak/suru/padok';

export type UyumKarantinaSonuc = {
  ok: boolean;
  animalId: string;
  oncekiPadok: string;
  hedefPadok: string;
  message: string;
};

export async function uyumHayvanKarantinaAktar(
  animalId: string,
  hedefPadokAd: string,
  supheNotu: string,
  neden: string,
): Promise<UyumKarantinaSonuc> {
  const animal = await getAnimal(animalId);
  if (!animal) {
    return { ok: false, animalId, oncekiPadok: '', hedefPadok: hedefPadokAd, message: 'Hayvan bulunamadı' };
  }

  const hedef = await getPadokByAd(hedefPadokAd);
  if (!hedef) {
    return { ok: false, animalId, oncekiPadok: animal.paddock, hedefPadok: hedefPadokAd, message: 'Hedef padok yok' };
  }
  if (!hedef.karantina) {
    return {
      ok: false,
      animalId,
      oncekiPadok: animal.paddock,
      hedefPadok: hedefPadokAd,
      message: 'Hedef padok karantina olarak işaretli değil',
    };
  }

  const oncekiPadok = animal.paddock;
  const tarih = new Date().toISOString().slice(0, 10);
  const notSatir = `[${tarih}] Gözlem inceleme — şüphe (teşhis değil): ${supheNotu.trim()}`;

  await upsertAnimal({
    ...animal,
    paddock: hedef.ad,
    status: animal.status === 'healthy' ? 'sick' : animal.status,
    notes: `${animal.notes}\n${notSatir} · Gerekçe: ${neden.trim()}`.trim(),
  });

  await addHealthRecord({
    animalId,
    recordType: 'checkup',
    symptoms: supheNotu.trim(),
    diagnosis: '',
    treatment: '',
    medicine: '',
    withdrawalDays: 0,
    vetName: '',
    recordedAt: new Date().toISOString(),
    notes: `Gözlem inceleme şüphesi — kullanıcı onaylı taşıma → ${hedef.ad}. Teşhis kaydedilmedi.`,
  });

  return {
    ok: true,
    animalId,
    oncekiPadok,
    hedefPadok: hedef.ad,
    message: `${animal.earTag} → ${hedef.ad} (şüphe; teşhis yok)`,
  };
}

/** Kullanıcı seçimine uygun karantina padokları */
export async function uyumKarantinaPadokSecenekleri(): Promise<string[]> {
  const padoklar = await getPadoklar();
  return padoklar.filter((p) => p.karantina).map((p) => p.ad);
}
