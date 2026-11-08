import type { BesiIrkBilgi, BesiPlanIrkTaslak } from './besi-plan-irk';
import {
  VARSAYILAN_BESI_MODEL_GOVDE,
  type AdgGrupBandModel,
  type BesiBeslemeKatsayiModel,
  type BesiModelGovde,
  type BesiPazarUyumModel,
} from './besi-model-varsayilan';
import type { AdgGrupKodu } from './besi-model-varsayilan';

export type BesiModelBirlesik = BesiModelGovde & {
  kaynak: 'varsayilan' | 'admin_surum';
  adminSurumId?: string | null;
  guncelleme?: string | null;
};

function sayiAralik(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n);
}

function grupBandDogrula(raw: unknown, varsayilan: AdgGrupBandModel): AdgGrupBandModel | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const muh = sayiAralik(o.muhafazakar, 80, 500);
  const bek = sayiAralik(o.beklenen, 80, 500);
  const iyi = sayiAralik(o.iyimser, 80, 500);
  if (muh == null || bek == null || iyi == null) return null;
  return {
    muhafazakar: muh,
    beklenen: bek,
    iyimser: iyi,
    min: sayiAralik(o.min, 50, 600) ?? varsayilan.min,
    max: sayiAralik(o.max, 50, 600) ?? varsayilan.max,
    kaynakAd: typeof o.kaynakAd === 'string' ? o.kaynakAd : varsayilan.kaynakAd,
    kaynakUrl: typeof o.kaynakUrl === 'string' ? o.kaynakUrl : varsayilan.kaynakUrl,
    baglam: typeof o.baglam === 'string' ? o.baglam : varsayilan.baglam,
  };
}

function pazarDogrula(raw: unknown, varsayilan: BesiPazarUyumModel): BesiPazarUyumModel {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const pct = (k: keyof BesiPazarUyumModel) =>
    sayiAralik(o[k], 0, 40) ?? varsayilan[k];
  return {
    irk_belli: pct('irk_belli'),
    irk_kismen: pct('irk_kismen'),
    irk_bilinmiyor: pct('irk_bilinmiyor'),
  };
}

function beslemeKatsayiDogrula(raw: unknown, varsayilan: BesiBeslemeKatsayiModel): BesiBeslemeKatsayiModel {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    meraGcaaKademeDusus: sayiAralik(o.meraGcaaKademeDusus, 0, 80) ?? varsayilan.meraGcaaKademeDusus,
    disiGcaaDusus: sayiAralik(o.disiGcaaDusus, 0, 80) ?? varsayilan.disiGcaaDusus,
    meraMuhafazakarEkDusus: sayiAralik(o.meraMuhafazakarEkDusus, 0, 80) ?? varsayilan.meraMuhafazakarEkDusus,
  };
}

/** Admin gövdesini varsayılanla birleştir — eksik anahtarlar kod varsayılanından */
export function birlesBesiModel(
  adminGovde: unknown,
  meta?: { id?: string | null; guncelleme?: string | null },
): BesiModelBirlesik {
  const base = VARSAYILAN_BESI_MODEL_GOVDE;
  if (adminGovde == null || typeof adminGovde !== 'object') {
    return { ...base, kaynak: 'varsayilan', adminSurumId: null, guncelleme: null };
  }
  const g = adminGovde as Record<string, unknown>;
  const adgIn = g.adgGrupBand && typeof g.adgGrupBand === 'object' ? (g.adgGrupBand as Record<string, unknown>) : {};
  const adgGrupBand = { ...base.adgGrupBand };
  for (const kod of Object.keys(adgGrupBand) as AdgGrupKodu[]) {
    const birles = grupBandDogrula(adgIn[kod], base.adgGrupBand[kod]);
    if (birles) adgGrupBand[kod] = birles;
  }
  return {
    surum: typeof g.surum === 'number' && g.surum > 0 ? Math.floor(g.surum) : base.surum + 1,
    adgGrupBand,
    pazarUyumDususYuzde: pazarDogrula(g.pazarUyumDususYuzde, base.pazarUyumDususYuzde),
    beslemeKatsayi: beslemeKatsayiDogrula(g.beslemeKatsayi, base.beslemeKatsayi),
    kaynak: 'admin_surum',
    adminSurumId: meta?.id ?? null,
    guncelleme: meta?.guncelleme ?? null,
  };
}

export function varsayilanBesiModel(): BesiModelBirlesik {
  return birlesBesiModel(null);
}

/** Yalnızca modelden — kullanıcı girdisi yok */
export function pazarUyumYuzdeModel(
  model: BesiModelBirlesik,
  t: Pick<BesiPlanIrkTaslak, 'koken' | 'irkBilgi'>,
): number | null {
  if (t.koken !== 'pazar_toplama') return null;
  const k: BesiIrkBilgi = t.irkBilgi;
  const v = model.pazarUyumDususYuzde[k];
  return v > 0 ? v : null;
}

export function besiModelAdminGuncellemeGecerliMi(govde: unknown): { ok: true } | { ok: false; hata: string } {
  try {
    birlesBesiModel(govde, { id: 'test' });
    return { ok: true };
  } catch (e) {
    return { ok: false, hata: e instanceof Error ? e.message : 'geçersiz model' };
  }
}
