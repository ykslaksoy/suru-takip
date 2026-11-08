/**
 * t366u/t368u — GET /api/besi/referans-yenile
 * Query: force=1 (cache bypass), cron=1 (Vercel Cron tetikleyici — deploy gerekir)
 */

const { referansCachetenVeyaCek } = require('./_referans-cache');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  const hit = body?.zamanlama?.sunucuCacheHit;
  res.setHeader(
    'Cache-Control',
    hit ? 'public, max-age=60, stale-while-revalidate=300' : 'no-store',
  );
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false, hata: 'Yalnız GET' });
  }

  const force = req.query?.force === '1' || req.query?.force === 'true';
  const cron = req.query?.cron === '1';
  const neden = cron ? 'vercel_cron' : force ? 'force' : 'istemci';

  try {
    const govde = await referansCachetenVeyaCek({ force, neden });
    return json(res, 200, govde);
  } catch (e) {
    return json(res, 200, {
      ok: false,
      yenilemeSonuc: 'hata',
      uyari: [String(e.message || 'Sunucu hatası')],
      zamanlama: { sunucuCacheHit: false, neden: 'exception' },
    });
  }
};
