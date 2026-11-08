/**
 * t368u — otomatik yenileme: 6 saat TTL, istek birleştirme, açılış/odak/resume.
 */
import type { ReferansYenileSonuc } from './besi-referans-yenile';
import {
  referansSyncMetaOku,
  referansSyncMetaYaz,
  type ReferansSenkronNeden,
  type ReferansSyncMeta,
} from './besi-referans-sync-meta';

/** UKON haftalık — 6 saat yeterli; burst için sunucu 15 dk cache */
export const ISTEMCI_REF_TTL_MS = 6 * 60 * 60 * 1000;

let simdiMs: () => number = () => Date.now();
let inflight: Promise<ReferansYenileSonuc> | null = null;

export function referansOtomatikTestSimdi(fn: () => number): void {
  simdiMs = fn;
}

export function referansOtomatikTestSifirla(): void {
  simdiMs = () => Date.now();
  inflight = null;
}

export function referansSonBasariliMs(): number | null {
  const iso = referansSyncMetaOku().sonBasariliIso;
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

export function referansTazelikGerekliMi(now = simdiMs()): boolean {
  const last = referansSonBasariliMs();
  if (last == null) return true;
  return now - last >= ISTEMCI_REF_TTL_MS;
}

export function referansOtomatikAtlanmaNedeni(force: boolean): string | null {
  if (force) return null;
  if (referansTazelikGerekliMi()) return null;
  const last = referansSonBasariliMs();
  if (last == null) return null;
  const kalan = ISTEMCI_REF_TTL_MS - (simdiMs() - last);
  return `TTL dolmadı (~${Math.ceil(kalan / 60000)} dk kaldı)`;
}

function metaGuncelle(
  parca: Partial<ReferansSyncMeta> & { sonSonuc: ReferansSyncMeta['sonSonuc'] },
  neden: ReferansSenkronNeden,
): ReferansSyncMeta {
  const onceki = referansSyncMetaOku();
  const now = new Date(simdiMs()).toISOString();
  const next: ReferansSyncMeta = {
    ...onceki,
    ...parca,
    sonDenemeIso: now,
    sonNeden: neden,
    kaynakIslemTarihleri: { ...onceki.kaynakIslemTarihleri, ...(parca.kaynakIslemTarihleri ?? {}) },
  };
  referansSyncMetaYaz(next);
  return next;
}

export type ReferansYenileSecenek = {
  force?: boolean;
  neden?: ReferansSenkronNeden;
};

/** Gerçek ağ çağrısı — besi-referans-yenile içinden import edilir (döngü önleme). */
async function uygulaApiYenileme(force: boolean): Promise<ReferansYenileSonuc> {
  const { besiReferanslariYenileAg } = await import('./besi-referans-yenile');
  return besiReferanslariYenileAg({ force });
}

export async function besiReferansOtomatikSenkron(
  opts: ReferansYenileSecenek = {},
): Promise<ReferansYenileSonuc & { atlandi?: boolean; meta: ReferansSyncMeta }> {
  const neden = opts.neden ?? 'ttl';
  const force = opts.force === true;

  const atlanma = referansOtomatikAtlanmaNedeni(force);
  if (atlanma) {
    const meta = metaGuncelle(
      { sonSonuc: 'atlandi', atlanmaNedeni: atlanma, hataMesaji: null },
      neden,
    );
    const { piyasaKayitOku } = await import('./besi-piyasa-kayit');
    const { fiyatReferansDepoOku } = await import('./fiyat-referans-depo');
    return {
      piyasa: piyasaKayitOku(),
      yemTablo: fiyatReferansDepoOku(),
      iz: ['istemci:ttl:skip'],
      kaynakDurum: atlanma,
      atlandi: true,
      meta,
    };
  }

  if (inflight) {
    const sonuc = await inflight;
    return { ...sonuc, meta: referansSyncMetaOku() };
  }

  const promise = uygulaApiYenileme(force);
  inflight = promise;
  try {
    const sonuc = await promise;
    const basarili = sonuc.piyasa.depo.yenilemeSonuc === 'önbellek_ok';
    const meta = metaGuncelle(
      {
        sonSonuc: basarili ? 'ok' : sonuc.piyasa.depo.yenilemeSonuc === 'bayat' ? 'bayat' : 'hata',
        sonBasariliIso: basarili ? new Date(simdiMs()).toISOString() : referansSyncMetaOku().sonBasariliIso,
        sonCekimIso: basarili ? new Date(simdiMs()).toISOString() : referansSyncMetaOku().sonCekimIso,
        hataMesaji: basarili ? null : sonuc.kaynakDurum,
        atlanmaNedeni: null,
      },
      neden,
    );
    return { ...sonuc, meta };
  } finally {
    if (inflight === promise) inflight = null;
  }
}

/** Paralel çağrıların aynı promise’i paylaştığını test eder. */
export function referansInflightVarMi(): boolean {
  return inflight != null;
}
