import { getPadoklar, padokDoluluk, type Padok } from '@/kaynak/suru/padok';
import { meraHaritaOku } from '@/kaynak/mera/harita';

export type PadokPlanSatir = Padok & {
  hayvan: number;
  bos: number;
  dolu: boolean;
  konumKayitli: boolean;
  koordinat?: [number, number];
};

/** Ahır planı — gerçek kayıtlı kapasite/doluluk; koordinat yoksa uydurma yok */
export async function padokPlaniYukle(): Promise<PadokPlanSatir[]> {
  const padoklar = await getPadoklar();
  const harita = await meraHaritaOku();
  const koord = new Map<string, [number, number]>();
  for (const f of harita?.padoklar.features ?? []) {
    if (f.geometry?.type === 'Point' && f.properties.padokAd) {
      koord.set(f.properties.padokAd, f.geometry.coordinates);
    }
  }
  return Promise.all(
    padoklar.map(async (p) => {
      const d = await padokDoluluk(p);
      const c = koord.get(p.ad);
      return {
        ...p,
        ...d,
        konumKayitli: Boolean(c),
        koordinat: c,
      };
    }),
  );
}

export function padokPlaniOzet(satirlar: PadokPlanSatir[]): { padok: number; hayvan: number; kapasite: number } {
  return {
    padok: satirlar.length,
    hayvan: satirlar.reduce((s, p) => s + p.hayvan, 0),
    kapasite: satirlar.reduce((s, p) => s + p.kapasite, 0),
  };
}
