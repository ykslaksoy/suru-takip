const { VARSAYILAN_BESI_MODEL_GOVDE } = require('./_model-varsayilan');

function sayiAralik(v, min, max) {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n);
}

function grupBandDogrula(raw, varsayilan) {
  if (raw == null || typeof raw !== 'object') return null;
  const muh = sayiAralik(raw.muhafazakar, 80, 500);
  const bek = sayiAralik(raw.beklenen, 80, 500);
  const iyi = sayiAralik(raw.iyimser, 80, 500);
  if (muh == null || bek == null || iyi == null) return null;
  return {
    muhafazakar: muh,
    beklenen: bek,
    iyimser: iyi,
    min: sayiAralik(raw.min, 50, 600) ?? varsayilan.min,
    max: sayiAralik(raw.max, 50, 600) ?? varsayilan.max,
    kaynakAd: typeof raw.kaynakAd === 'string' ? raw.kaynakAd : varsayilan.kaynakAd,
    kaynakUrl: typeof raw.kaynakUrl === 'string' ? raw.kaynakUrl : varsayilan.kaynakUrl,
    baglam: typeof raw.baglam === 'string' ? raw.baglam : varsayilan.baglam,
  };
}

function pazarDogrula(raw, varsayilan) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const pct = (k) => sayiAralik(o[k], 0, 40) ?? varsayilan[k];
  return {
    irk_belli: pct('irk_belli'),
    irk_kismen: pct('irk_kismen'),
    irk_bilinmiyor: pct('irk_bilinmiyor'),
  };
}

function beslemeKatsayiDogrula(raw, varsayilan) {
  const o = raw && typeof raw === 'object' ? raw : {};
  return {
    meraGcaaKademeDusus: sayiAralik(o.meraGcaaKademeDusus, 0, 80) ?? varsayilan.meraGcaaKademeDusus,
    disiGcaaDusus: sayiAralik(o.disiGcaaDusus, 0, 80) ?? varsayilan.disiGcaaDusus,
    meraMuhafazakarEkDusus: sayiAralik(o.meraMuhafazakarEkDusus, 0, 80) ?? varsayilan.meraMuhafazakarEkDusus,
  };
}

function birlesBesiModel(adminGovde, meta = {}) {
  const base = VARSAYILAN_BESI_MODEL_GOVDE;
  if (adminGovde == null || typeof adminGovde !== 'object') {
    return { ...base, kaynak: 'varsayilan', adminSurumId: null, guncelleme: null };
  }
  const adgIn = adminGovde.adgGrupBand && typeof adminGovde.adgGrupBand === 'object' ? adminGovde.adgGrupBand : {};
  const adgGrupBand = { ...base.adgGrupBand };
  for (const kod of Object.keys(adgGrupBand)) {
    const birles = grupBandDogrula(adgIn[kod], base.adgGrupBand[kod]);
    if (birles) adgGrupBand[kod] = birles;
  }
  return {
    surum: typeof adminGovde.surum === 'number' && adminGovde.surum > 0 ? Math.floor(adminGovde.surum) : base.surum + 1,
    adgGrupBand,
    pazarUyumDususYuzde: pazarDogrula(adminGovde.pazarUyumDususYuzde, base.pazarUyumDususYuzde),
    beslemeKatsayi: beslemeKatsayiDogrula(adminGovde.beslemeKatsayi, base.beslemeKatsayi),
    kaynak: 'admin_surum',
    adminSurumId: meta.id ?? null,
    guncelleme: meta.guncelleme ?? null,
  };
}

module.exports = { birlesBesiModel, VARSAYILAN_BESI_MODEL_GOVDE };
