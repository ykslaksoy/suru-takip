import { v4 as uuidv4 } from 'uuid';
import { getAnimal } from '@/kaynak/cekirdek/veritabani';
import type { UyumBeslemeKayit } from './uyum-besleme';
import {
  bolmeKismiHataMesaji,
  idempotentTasimaGerekli,
  type UyumBolmeGirdi,
  type UyumBolmeKolu,
  type UyumIncelemeOturumu,
  type UyumTasimaSonucu,
  uyumBolmeKaydaUygula,
} from './uyum-inceleme-bolme';
import { uyumHayvanKarantinaAktar } from './uyum-karantina-aktar';
import { uyumHayvanNormalPadokaAktar } from './uyum-padok-aktar';

async function tasimaYap(
  kol: UyumBolmeKolu,
  oturumId: string,
  neden: string,
  idempotansi: UyumBeslemeKayit['tasimaIdempotansi'],
): Promise<UyumTasimaSonucu[]> {
  const out: UyumTasimaSonucu[] = [];
  if (kol.karar === 'gozlem_uzat' || !kol.hayvanIds.length) return out;

  for (const animalId of kol.hayvanIds) {
    const hedef = kol.hedefPadok ?? '';
    const animal = await getAnimal(animalId);
    const gerekli = idempotentTasimaGerekli(animalId, hedef, oturumId, idempotansi, animal?.paddock);

    if (!gerekli) {
      out.push({
        animalId,
        ok: true,
        atlandi: true,
        message: 'Zaten taşınmış — atlandı',
      });
      continue;
    }

    if (kol.karar === 'besiye_gecis') {
      const r = await uyumHayvanNormalPadokaAktar(animalId, hedef, neden);
      out.push({
        animalId,
        ok: r.ok,
        atlandi: r.atlandi,
        message: r.message,
      });
    } else if (kol.karar === 'karantina_suphe') {
      const r = await uyumHayvanKarantinaAktar(animalId, hedef, kol.supheNotu ?? '', neden);
      out.push({
        animalId,
        ok: r.ok,
        message: r.message,
      });
    }
  }
  return out;
}

export type BolmeUygulaSonuc = {
  kayit: UyumBeslemeKayit | null;
  kismiHata: string | null;
  tasimaSonuclari: UyumTasimaSonucu[];
};

export async function uyumBolmeOturumunuUygula(
  kayit: UyumBeslemeKayit,
  g: UyumBolmeGirdi,
): Promise<BolmeUygulaSonuc> {
  const oturumId = uuidv4();
  const oturum: UyumIncelemeOturumu = {
    id: oturumId,
    zaman: new Date().toISOString(),
    neden: g.neden.trim(),
    kollar: g.kollar,
    degismeyenHayvanIds: [],
  };

  const idempotansi = { ...(kayit.tasimaIdempotansi ?? {}) };
  const tumSonuc: UyumTasimaSonucu[] = [];

  for (const kol of g.kollar) {
    const son = await tasimaYap(kol, oturumId, g.neden, idempotansi);
    tumSonuc.push(...son);
    for (const s of son) {
      if (s.ok && !s.atlandi && kol.hedefPadok) {
        idempotansi[s.animalId] = { oturumId, hedefPadok: kol.hedefPadok };
      }
    }
  }

  oturum.tasimaSonuclari = tumSonuc;
  const yeni = uyumBolmeKaydaUygula(kayit, oturum, g);
  yeni.tasimaIdempotansi = { ...yeni.tasimaIdempotansi, ...idempotansi };

  return {
    kayit: yeni,
    kismiHata: bolmeKismiHataMesaji(tumSonuc),
    tasimaSonuclari: tumSonuc,
  };
}
