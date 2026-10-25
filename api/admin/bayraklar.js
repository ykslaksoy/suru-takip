const { json, supabaseFetch, bearer, kullaniciIdFromToken, adminMi, supabaseYapilandirildi } = require('./_lib');

module.exports = async function handler(req, res) {
  if (!supabaseYapilandirildi()) {
    return json(res, 503, { ok: false, hata: 'Supabase service role yapılandırılmadı' });
  }

  const uid = await kullaniciIdFromToken(bearer(req));
  if (!uid || !(await adminMi(uid))) {
    return json(res, 401, { ok: false, hata: 'Admin oturumu gerekli' });
  }

  try {
    if (req.method === 'GET') {
      const rows = await supabaseFetch('/rest/v1/admin_ozellik_bayrak?select=*&order=id');
      return json(res, 200, { ok: true, bayraklar: rows });
    }

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const id = String(body.id ?? '').trim();
      if (!id) return json(res, 400, { ok: false, hata: 'id gerekli' });
      const patch = { updated_at: new Date().toISOString() };
      if (typeof body.acik === 'boolean') patch.acik = body.acik;
      if (body.aciklama != null) patch.aciklama = String(body.aciklama);
      const updated = await supabaseFetch(`/rest/v1/admin_ozellik_bayrak?id=eq.${id}`, {
        method: 'PATCH',
        body: patch,
        prefer: 'return=representation',
      });
      return json(res, 200, { ok: true, bayrak: Array.isArray(updated) ? updated[0] : updated });
    }

    res.setHeader('Allow', 'GET, PATCH');
    return json(res, 405, { ok: false, hata: 'Desteklenmeyen metod' });
  } catch (e) {
    return json(res, e.status || 500, { ok: false, hata: e.message });
  }
};
