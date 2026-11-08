/** t368u — istemci otomatik senkron meta (override’a dokunmaz). */

export type ReferansSenkronNeden = 'acilis' | 'resume' | 'manuel' | 'ttl' | 'cron_istemci';

export type ReferansSyncMeta = {
  sonBasariliIso: string | null;
  sonDenemeIso: string | null;
  sonNeden: ReferansSenkronNeden | null;
  sonSonuc: 'ok' | 'bayat' | 'hata' | 'atlandi' | null;
  kaynakIslemTarihleri: Record<string, string | null>;
  sonCekimIso: string | null;
  hataMesaji: string | null;
  atlanmaNedeni: string | null;
};

const KEY = 'sy_besi_ref_sync_meta_v1';

let bellekMeta: ReferansSyncMeta | null = null;

const BOS: ReferansSyncMeta = {
  sonBasariliIso: null,
  sonDenemeIso: null,
  sonNeden: null,
  sonSonuc: null,
  kaynakIslemTarihleri: {},
  sonCekimIso: null,
  hataMesaji: null,
  atlanmaNedeni: null,
};

export function referansSyncMetaOku(): ReferansSyncMeta {
  if (bellekMeta) return { ...bellekMeta, kaynakIslemTarihleri: { ...bellekMeta.kaynakIslemTarihleri } };
  if (typeof localStorage === 'undefined') return { ...BOS, kaynakIslemTarihleri: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...BOS, kaynakIslemTarihleri: {} };
    const p = JSON.parse(raw) as ReferansSyncMeta;
    bellekMeta = p;
    return { ...p, kaynakIslemTarihleri: { ...(p.kaynakIslemTarihleri ?? {}) } };
  } catch {
    return { ...BOS, kaynakIslemTarihleri: {} };
  }
}

export function referansSyncMetaYaz(meta: ReferansSyncMeta): void {
  bellekMeta = meta;
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(meta));
}
