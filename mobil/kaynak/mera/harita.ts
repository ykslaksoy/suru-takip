import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { getPadoklar, type Padok } from '@/kaynak/suru/padok';
import { padokDoluluk } from '@/kaynak/suru/padok';

export const MERA_HARITA_ANAHTAR = 'sy_mera_harita_v1';

export type MeraPadokTur = 'padok' | 'mera' | 'su' | 'yonca';

export type MeraHaritaMeta = {
  surum: number;
  sonGuncelleme: string;
  merkez: [number, number];
  zoom: number;
};

export type MeraPadokOzellik = {
  padokAd: string;
  padokId?: string;
  tur: MeraPadokTur;
  not?: string;
  hayvan?: number;
  kapasite?: number;
};

export type MeraHaritaBelge = {
  meta: MeraHaritaMeta;
  padoklar: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      geometry: { type: 'Point'; coordinates: [number, number] };
      properties: MeraPadokOzellik;
    }>;
  };
};

const VARSAYILAN_MERKEZ: [number, number] = [32.5, 39.0];

function padokKonum(p: Padok, i: number, n: number): [number, number] {
  const r = 0.008;
  const a = (2 * Math.PI * i) / Math.max(1, n);
  return [VARSAYILAN_MERKEZ[0] + r * Math.cos(a), VARSAYILAN_MERKEZ[1] + r * Math.sin(a)];
}

export async function meraHaritaOku(): Promise<MeraHaritaBelge | null> {
  const raw = await kaliciGetItem(MERA_HARITA_ANAHTAR);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MeraHaritaBelge;
  } catch {
    return null;
  }
}

async function meraHaritaYaz(belge: MeraHaritaBelge): Promise<void> {
  await kaliciSetItem(MERA_HARITA_ANAHTAR, JSON.stringify(belge));
}

/** Padok listesinden nokta katmanı üretir veya mevcut koordinatları günceller. */
export async function meraHaritaPadoklarlaSenkron(): Promise<MeraHaritaBelge> {
  const padoklar = await getPadoklar();
  const onceki = await meraHaritaOku();
  const koordinatMap = new Map<string, [number, number]>();
  for (const f of onceki?.padoklar.features ?? []) {
    const ad = f.properties.padokAd;
    if (ad && f.geometry.type === 'Point') {
      koordinatMap.set(ad, f.geometry.coordinates);
    }
  }

  const n = padoklar.length;
  const features = await Promise.all(
    padoklar.map(async (p, i) => {
      const d = await padokDoluluk(p);
      const coords = koordinatMap.get(p.ad) ?? padokKonum(p, i, n);
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: coords },
        properties: {
          padokAd: p.ad,
          padokId: p.id,
          tur: (p.karantina ? 'yonca' : 'padok') as MeraPadokTur,
          not: p.not || undefined,
          hayvan: d.hayvan,
          kapasite: p.kapasite,
        },
      };
    }),
  );

  const belge: MeraHaritaBelge = {
    meta: {
      surum: (onceki?.meta.surum ?? 0) + 1,
      sonGuncelleme: new Date().toISOString(),
      merkez: onceki?.meta.merkez ?? VARSAYILAN_MERKEZ,
      zoom: onceki?.meta.zoom ?? 13,
    },
    padoklar: { type: 'FeatureCollection', features },
  };
  await meraHaritaYaz(belge);
  return belge;
}

export async function meraHaritaGuncelleKoordinat(
  padokAd: string,
  lon: number,
  lat: number,
): Promise<MeraHaritaBelge> {
  const belge = (await meraHaritaOku()) ?? (await meraHaritaPadoklarlaSenkron());
  const features = belge.padoklar.features.map((f) => {
    if (f.properties.padokAd !== padokAd) return f;
    return {
      ...f,
      geometry: { type: 'Point' as const, coordinates: [lon, lat] as [number, number] },
    };
  });
  const yeni: MeraHaritaBelge = {
    ...belge,
    meta: { ...belge.meta, sonGuncelleme: new Date().toISOString(), surum: belge.meta.surum + 1 },
    padoklar: { type: 'FeatureCollection', features },
  };
  await meraHaritaYaz(yeni);
  return yeni;
}
