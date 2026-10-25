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
      const rows = await supabaseFetch('/rest/v1/icerik_surum?select=*&id=eq.genel');
      const row = Array.isArray(rows) ? rows[0] : rows;
      return json(res, 200, { ok: true, icerik: row });
    }

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const patch = { updated_at: new Date().toISOString() };
      if (body.surum != null) patch.surum = String(body.surum);
      if (body.duyuru_metni != null) patch.duyuru_metni = String(body.duyuru_metni);
      if (typeof body.yayinlandi === 'boolean') patch.yayinlandi = body.yayinlandi;
      if (body.ek != null) patch.ek = body.ek;
      const updated = await supabaseFetch('/rest/v1/icerik_surum?id=eq.genel', {
        method: 'PATCH',
        body: patch,
        prefer: 'return=representation',
      });
      return json(res, 200, { ok: true, icerik: Array.isArray(updated) ? updated[0] : updated });
    }

    res.setHeader('Allow', 'GET, PATCH');
    return json(res, 405, { ok: false, hata: 'Desteklenmeyen metod' });
  } catch (e) {
    return json(res, e.status || 500, { ok: false, hata: e.message });
  }
};
