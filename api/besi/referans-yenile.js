/**
 * t366u — güvenli sunucu proxy: TOBB + UKON + USK (balikesir PDF yok).
 * GET /api/besi/referans-yenile
 */

const { parseTobbOtKuzusuHtml, parseUkonKuzuHtml, parseUskYemHtml } = require('./_referans-parse');

const UA = 'SuruYon-besi-referans/1.0 (+https://github.com/ykslaksoy/suru-takip)';

const KAYNAKLAR = {
  tobb: 'https://borsa.tobb.org.tr/fiyat_urun3.php?alt_kod=108&ana_kod=13',
  ukon: 'https://www.ukon.org.tr/fiyatlar',
  usk: 'https://ulusalsutkonseyi.org.tr/yemlerin-ortalama-fiyatlari/',
};

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function cek(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
  const metin = await r.text();
  if (!r.ok) {
    const err = new Error(`HTTP ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return metin;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false, hata: 'Yalnız GET' });
  }

  const iz = [];
  const hatalar = [];
  const now = new Date().toISOString().slice(0, 10);

  let tobb = null;
  let ukon = null;
  let usk = null;

  try {
    const html = await cek(KAYNAKLAR.tobb);
    iz.push('fetch:tobb:ok');
    tobb = parseTobbOtKuzusuHtml(html);
    if (tobb.ok) iz.push(...tobb.iz);
    else hatalar.push(`TOBB: ${tobb.hata}`);
  } catch (e) {
    hatalar.push(`TOBB ağ: ${e.message}`);
    iz.push('fetch:tobb:fail');
  }

  try {
    const html = await cek(KAYNAKLAR.ukon);
    iz.push('fetch:ukon:ok');
    ukon = parseUkonKuzuHtml(html);
    if (ukon.ok) iz.push(...ukon.iz);
    else hatalar.push(`UKON: ${ukon.hata}`);
  } catch (e) {
    hatalar.push(`UKON ağ: ${e.message}`);
    iz.push('fetch:ukon:fail');
  }

  try {
    const html = await cek(KAYNAKLAR.usk);
    iz.push('fetch:usk:ok');
    usk = parseUskYemHtml(html);
    if (usk.ok) iz.push(...usk.iz);
    else hatalar.push(`USK: ${usk.hata}`);
  } catch (e) {
    hatalar.push(`USK ağ: ${e.message}`);
    iz.push('fetch:usk:fail');
  }

  const piyasaTamam = tobb?.ok && ukon?.ok;
  const yemTamam = usk?.ok;
  const ok = piyasaTamam || yemTamam;

  return json(res, 200, {
    ok,
    alinmaTarihi: now,
    yenilemeSonuc: ok ? (hatalar.length ? 'kısmi' : 'ag_ok') : 'hata',
    kaynaklar: KAYNAKLAR,
    otomatik: {
      tobb: true,
      ukon: true,
      usk_yonca_saman: true,
      balikesir_pdf: false,
      besi_yemi_tzob: false,
    },
    parse: { tobb, ukon, usk },
    uyari: hatalar,
    iz,
    not: 'Besi yemi ve Balıkesir bülteni manuel/gömülü — aylık USK yonca/saman ile karıştırılmaz.',
  });
};
