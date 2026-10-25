/** Global özellik bayrakları (DB); istemci isteğe bağlı çeker. */
const { json, supabaseFetch, supabaseYapilandirildi } = require('./admin/_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false });
  }
  if (!supabaseYapilandirildi()) {
    return json(res, 200, { ok: true, bayraklar: {} });
  }
  try {
    const rows = await supabaseFetch('/rest/v1/admin_ozellik_bayrak?select=id,acik,aciklama');
    const map = {};
    for (const r of rows ?? []) map[r.id] = { acik: r.acik, aciklama: r.aciklama };
    return json(res, 200, { ok: true, bayraklar: map });
  } catch {
    return json(res, 200, { ok: true, bayraklar: {} });
  }
};
