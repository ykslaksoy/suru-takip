/**
 * t368u — sunucu önbellek (sıcak lambda belleği) + eşzamanlı istek birleştirme.
 * Kalıcı KV/Blob yok — deploy arası paylaşım yok; istemci TTL birincil.
 */

const { referansKaynaklariniCek } = require('./_referans-core');

const SUNUCU_CACHE_TTL_MS = 15 * 60 * 1000;

/** @type {{ govde: object; cekimZamanIso: string; kaydedildiIso: string } | null} */
let bellek = null;
/** @type {Promise<object> | null} */
let inflight = null;

function yasMs() {
  if (!bellek) return null;
  return Date.now() - new Date(bellek.kaydedildiIso).getTime();
}

function tazeMi(force) {
  if (force) return false;
  if (!bellek) return false;
  return yasMs() < SUNUCU_CACHE_TTL_MS;
}

function zamanlamaMeta(hit) {
  return {
    sunucuCacheTtlSaniye: Math.round(SUNUCU_CACHE_TTL_MS / 1000),
    sunucuCacheHit: hit,
    sunucuCacheYasSaniye: hit && bellek ? Math.round(yasMs() / 1000) : null,
    sonBasariliCekimIso: bellek?.cekimZamanIso ?? null,
    sonKayitIso: bellek?.kaydedildiIso ?? null,
    kaliciDepo: false,
    cronTanimi: 'vercel.json (deploy sonrası aktif; KV gerekmez)',
  };
}

async function referansCachetenVeyaCek({ force = false, neden = 'api' } = {}) {
  if (tazeMi(force)) {
    return {
      ...bellek.govde,
      zamanlama: { ...zamanlamaMeta(true), neden: 'sunucu_cache' },
    };
  }

  if (inflight) {
    const govde = await inflight;
    return { ...govde, zamanlama: { ...zamanlamaMeta(false), neden: 'inflight_dedup' } };
  }

  inflight = (async () => {
    try {
      const sonuc = await referansKaynaklariniCek();
      if (sonuc.cekimBasarili) {
        bellek = {
          govde: sonuc.govde,
          cekimZamanIso: sonuc.cekimZamanIso,
          kaydedildiIso: new Date().toISOString(),
        };
        return bellek.govde;
      }
      if (bellek?.govde) {
        return {
          ...bellek.govde,
          uyari: [...(bellek.govde.uyari ?? []), ...sonuc.govde.uyari, 'Upstream başarısız — sunucu son iyi önbellek'],
          yenilemeSonuc: 'bayat',
        };
      }
      return sonuc.govde;
    } finally {
      inflight = null;
    }
  })();

  const govde = await inflight;
  return {
    ...govde,
    zamanlama: { ...zamanlamaMeta(false), neden },
  };
}

function referansDurumOzet() {
  return {
    sunucuCacheVar: !!bellek,
    ...zamanlamaMeta(tazeMi(false)),
    kaynakIslemTarihleri: bellek?.govde?.kaynakIslemTarihleri ?? null,
    yenilemeSonuc: bellek?.govde?.yenilemeSonuc ?? null,
  };
}

module.exports = {
  SUNUCU_CACHE_TTL_MS,
  referansCachetenVeyaCek,
  referansDurumOzet,
  __testCacheSifirla: () => {
    bellek = null;
    inflight = null;
  },
};
