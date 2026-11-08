import { v4 as uuidv4 } from 'uuid';
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import {
  fcrEsikDogrula,
  gcaaEsikDogrula,
  kapsamAnahtar,
  type PerformansEsikDepo,
  type PerformansEsikDeger,
  type PerformansEsikKayit,
  type PerformansEsikKapsam,
} from '@/kaynak/kilo/performans-esik-tipler';

const KEY = 'sy_performans_esik_v1';

const BOS: PerformansEsikDepo = { surum: 1, kayitlar: [] };

export async function getPerformansEsikDepo(): Promise<PerformansEsikDepo> {
  const raw = await kaliciGetItem(KEY);
  if (!raw) return { ...BOS, kayitlar: [] };
  try {
    const p = JSON.parse(raw) as PerformansEsikDepo;
    if (p?.surum !== 1 || !Array.isArray(p.kayitlar)) return { ...BOS };
    return p;
  } catch {
    return { ...BOS };
  }
}

async function yaz(depo: PerformansEsikDepo): Promise<void> {
  await kaliciSetItem(KEY, JSON.stringify(depo));
}

function esikGirdiyiTemizle(d: PerformansEsikDeger | null | undefined): PerformansEsikDeger | null {
  if (d == null) return null;
  if (!d.etkin) return { etkin: false, deger: d.deger };
  return { etkin: true, deger: d.deger };
}

export type EsikKayitGirdi = {
  kapsam: PerformansEsikKapsam;
  gcaaAlt?: { etkin: boolean; deger: unknown } | null;
  fcrUst?: { etkin: boolean; deger: unknown } | null;
};

export type EsikKayitSonuc =
  | { ok: true; kayit: PerformansEsikKayit }
  | { ok: false; hatalar: string[] };

/** Tek kapsam kaydını doğrula ve kaydet (aynı kapsamda günceller). */
export async function kaydetPerformansEsikKaydi(girdi: EsikKayitGirdi): Promise<EsikKayitSonuc> {
  const hatalar: string[] = [];
  let gcaaAlt: PerformansEsikDeger | null = null;
  let fcrUst: PerformansEsikDeger | null = null;

  if (girdi.gcaaAlt != null) {
    if (girdi.gcaaAlt.etkin) {
      const d = gcaaEsikDogrula(girdi.gcaaAlt.deger);
      if (!d.ok) hatalar.push(d.hata);
      else gcaaAlt = { etkin: true, deger: d.deger };
    } else {
      gcaaAlt = { etkin: false, deger: typeof girdi.gcaaAlt.deger === 'number' ? girdi.gcaaAlt.deger : 0 };
    }
  }

  if (girdi.fcrUst != null) {
    if (girdi.fcrUst.etkin) {
      const d = fcrEsikDogrula(girdi.fcrUst.deger);
      if (!d.ok) hatalar.push(d.hata);
      else fcrUst = { etkin: true, deger: d.deger };
    } else {
      fcrUst = { etkin: false, deger: typeof girdi.fcrUst.deger === 'number' ? girdi.fcrUst.deger : 0 };
    }
  }

  if (hatalar.length) return { ok: false, hatalar };

  const depo = await getPerformansEsikDepo();
  const anahtar = kapsamAnahtar(girdi.kapsam);
  const mevcutIdx = depo.kayitlar.findIndex((k) => kapsamAnahtar(k.kapsam) === anahtar);
  const mevcut = mevcutIdx >= 0 ? depo.kayitlar[mevcutIdx] : null;

  const gcaaSon =
    girdi.gcaaAlt !== undefined ? esikGirdiyiTemizle(gcaaAlt) : (mevcut?.gcaaAlt ?? null);
  const fcrSon = girdi.fcrUst !== undefined ? esikGirdiyiTemizle(fcrUst) : (mevcut?.fcrUst ?? null);

  const kayit: PerformansEsikKayit = {
    id: mevcut?.id ?? uuidv4(),
    kapsam: girdi.kapsam,
    gcaaAlt: gcaaSon,
    fcrUst: fcrSon,
    guncelleme: new Date().toISOString(),
  };

  const etkinYok =
    (kayit.gcaaAlt == null || !kayit.gcaaAlt.etkin) && (kayit.fcrUst == null || !kayit.fcrUst.etkin);
  if (etkinYok) {
    if (mevcutIdx >= 0) depo.kayitlar.splice(mevcutIdx, 1);
  } else if (mevcutIdx >= 0) {
    depo.kayitlar[mevcutIdx] = kayit;
  } else {
    depo.kayitlar.push(kayit);
  }

  await yaz(depo);
  return { ok: true, kayit };
}

/** Test / yeniden yükleme — JSON’dan depo */
export function performansEsikDepoParse(raw: string): PerformansEsikDepo {
  return JSON.parse(raw) as PerformansEsikDepo;
}
