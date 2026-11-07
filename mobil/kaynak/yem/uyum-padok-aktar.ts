/**
 * Besiye / normal padok taşıması — rasyon veya klinik planı otomatik değiştirmez.
 */
import { getAnimal, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { getPadokByAd } from '@/kaynak/suru/padok';

export type UyumPadokTasimaSonuc = {
  ok: boolean;
  animalId: string;
  oncekiPadok: string;
  hedefPadok: string;
  atlandi?: boolean;
  message: string;
};

export async function uyumHayvanNormalPadokaAktar(
  animalId: string,
  hedefPadokAd: string,
  neden: string,
): Promise<UyumPadokTasimaSonuc> {
  const animal = await getAnimal(animalId);
  if (!animal) {
    return { ok: false, animalId, oncekiPadok: '', hedefPadok: hedefPadokAd, message: 'Hayvan bulunamadı' };
  }

  if (animal.paddock.trim() === hedefPadokAd.trim()) {
    return {
      ok: true,
      animalId,
      oncekiPadok: animal.paddock,
      hedefPadok: hedefPadokAd,
      atlandi: true,
      message: `${animal.earTag} zaten ${hedefPadokAd} padokunda`,
    };
  }

  const hedef = await getPadokByAd(hedefPadokAd);
  if (!hedef) {
    return { ok: false, animalId, oncekiPadok: animal.paddock, hedefPadok: hedefPadokAd, message: 'Hedef padok yok' };
  }
  if (hedef.karantina) {
    return {
      ok: false,
      animalId,
      oncekiPadok: animal.paddock,
      hedefPadok: hedefPadokAd,
      message: 'Besiye geçiş karantina padokuna yapılamaz',
    };
  }

  const oncekiPadok = animal.paddock;
  const tarih = new Date().toISOString().slice(0, 10);
  const notSatir = `[${tarih}] Gözlem inceleme — besiye geçiş (plan otomatik değişmez): ${neden.trim()}`;

  await upsertAnimal({
    ...animal,
    paddock: hedef.ad,
    notes: `${animal.notes}\n${notSatir}`.trim(),
  });

  return {
    ok: true,
    animalId,
    oncekiPadok,
    hedefPadok: hedef.ad,
    message: `${animal.earTag} → ${hedef.ad}`,
  };
}
