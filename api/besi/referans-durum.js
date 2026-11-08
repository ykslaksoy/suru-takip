/**
 * t368u — GET /api/besi/referans-durum (hafif tanı; upstream çekmez)
 */

const { referansDurumOzet } = require('./_referans-cache');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false });
  }
  return json(res, 200, {
    ok: true,
    ...referansDurumOzet(),
    istemciOneri: {
      ttlSaat: 6,
      tetikleyiciler: ['uygulama_acilis', 'sekme_odak', 'app_resume', 'manuel'],
    },
    vercelCron: {
      tanimli: true,
      yol: '/api/besi/referans-yenile?cron=1',
      zamanlama: '0 */6 * * * (UTC)',
      uretimdeAktif: 'Yalnız Vercel deploy sonrası; yerel repoda çalışmaz',
    },
  });
};
