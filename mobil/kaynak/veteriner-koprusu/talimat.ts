import { v4 as uuidv4 } from 'uuid';
import { vakaKapat, vakaTalimatGuncelle, type VetTalimat } from './case-thread';

export type { VetTalimat };

export type TalimatGirdi = {
  metin: string;
  ilac?: string;
  bekletmeGun?: number;
  acil?: boolean;
};

export function talimatOlustur(girdi: TalimatGirdi): VetTalimat {
  return {
    id: uuidv4(),
    metin: girdi.metin.trim(),
    ilac: girdi.ilac?.trim() ?? '',
    bekletmeGun: girdi.bekletmeGun ?? 0,
    acil: girdi.acil ?? false,
    createdAt: new Date().toISOString(),
    uygulandi: false,
    uygulamaNotu: '',
  };
}

/** Çoban/sahip talimatı uyguladı işaretler (vet yanıtı sonrası). */
export async function talimatUygulandi(
  vakaId: string,
  talimat: VetTalimat,
  not = ''
): Promise<VetTalimat> {
  const guncel: VetTalimat = {
    ...talimat,
    uygulandi: true,
    uygulamaNotu: not.trim(),
  };
  await vakaTalimatGuncelle(vakaId, guncel);
  await vakaKapat(vakaId);
  return guncel;
}
