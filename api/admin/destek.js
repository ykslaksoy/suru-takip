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
      const rows = await supabaseFetch(
        '/rest/v1/destek_talebi?select=*&order=created_at.desc&limit=200',
      );
      return json(res, 200, { ok: true, talepler: rows });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    if (req.method === 'POST') {
      const konu = String(body.konu ?? '').trim();
      if (!konu) return json(res, 400, { ok: false, hata: 'Konu gerekli' });
      const row = {
        konu,
        oncelik: body.oncelik || 'normal',
        durum: 'yeni',
        ic_not: String(body.ic_not ?? ''),
        musteri_eposta: body.musteri_eposta || null,
        ciftlik_id: body.ciftlik_id || null,
      };
      const created = await supabaseFetch('/rest/v1/destek_talebi', {
        method: 'POST',
        body: row,
        prefer: 'return=representation',
      });
      return json(res, 201, { ok: true, talep: Array.isArray(created) ? created[0] : created });
    }

    if (req.method === 'PATCH') {
      const id = String(body.id ?? '').trim();
      if (!id) return json(res, 400, { ok: false, hata: 'id gerekli' });
      const patch = {};
      if (body.durum) patch.durum = body.durum;
      if (body.oncelik) patch.oncelik = body.oncelik;
      if (body.ic_not != null) patch.ic_not = String(body.ic_not);
      if (body.konu) patch.konu = String(body.konu);
      const updated = await supabaseFetch(`/rest/v1/destek_talebi?id=eq.${id}`, {
        method: 'PATCH',
        body: patch,
        prefer: 'return=representation',
      });
      return json(res, 200, { ok: true, talep: Array.isArray(updated) ? updated[0] : updated });
    }

    res.setHeader('Allow', 'GET, POST, PATCH');
    return json(res, 405, { ok: false, hata: 'Desteklenmeyen metod' });
  } catch (e) {
    return json(res, e.status || 500, { ok: false, hata: e.message });
  }
};
