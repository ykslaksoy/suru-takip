/**
 * GET /api/besi/model — birleşik teknik model (herkese açık okuma).
 */
const { json, supabaseFetch, supabaseYapilandirildi } = require('../admin/_lib');
const { birlesBesiModel } = require('./_model-birles');

async function aktifAdminGovde() {
  if (!supabaseYapilandirildi()) return null;
  const rows = await supabaseFetch(
    '/rest/v1/admin_besi_model_surum?gecerli=eq.true&select=id,model,surum_no,created_at&limit=1',
  );
  if (!Array.isArray(rows) || !rows[0]) return null;
  const r = rows[0];
  return { id: r.id, guncelleme: r.created_at, govde: r.model };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    json(res, 405, { ok: false, hata: 'Yalnızca GET' });
    return;
  }
  try {
    const aktif = await aktifAdminGovde();
    const birles = birlesBesiModel(aktif?.govde ?? null, {
      id: aktif?.id ?? null,
      guncelleme: aktif?.guncelleme ?? null,
    });
    json(res, 200, {
      ok: true,
      model: birles,
      supabase: supabaseYapilandirildi(),
      adminSurum: aktif?.surum_no ?? null,
    });
  } catch (e) {
    json(res, 500, { ok: false, hata: e.message || 'model okunamadı' });
  }
};
