/** Salt okunur yayınlanmış içerik sürümü (duyuru bandı). */
const { json, supabaseFetch, supabaseYapilandirildi } = require('../admin/_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false });
  }
  if (!supabaseYapilandirildi()) {
    return json(res, 200, { ok: true, surum: '0', duyuru_metni: '' });
  }
  try {
    const rows = await supabaseFetch(
      '/rest/v1/icerik_surum?select=surum,duyuru_metni,yayinlandi,updated_at&id=eq.genel',
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row || !row.yayinlandi) {
      return json(res, 200, { ok: true, surum: '0', duyuru_metni: '' });
    }
    return json(res, 200, {
      ok: true,
      surum: row.surum,
      duyuru_metni: row.duyuru_metni,
      updated_at: row.updated_at,
    });
  } catch {
    return json(res, 200, { ok: true, surum: '0', duyuru_metni: '' });
  }
};
