const { json, supabaseFetch, bearer, kullaniciIdFromToken, adminMi, epostaMaskele, supabaseYapilandirildi } = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false, hata: 'Yalnızca GET' });
  }
  if (!supabaseYapilandirildi()) {
    return json(res, 503, { ok: false, hata: 'Supabase service role yapılandırılmadı' });
  }

  const uid = await kullaniciIdFromToken(bearer(req));
  if (!uid || !(await adminMi(uid))) {
    return json(res, 401, { ok: false, hata: 'Admin oturumu gerekli' });
  }

  const q = String(req.query?.q ?? '').trim();
  let yol = '/rest/v1/ciftlik?select=id,ad,created_at,sahip_id&order=created_at.desc&limit=100';
  if (q) {
    if (/^[0-9a-f-]{36}$/i.test(q)) {
      yol += `&id=eq.${q}`;
    } else {
      yol += `&ad=ilike.*${encodeURIComponent(q)}*`;
    }
  }

  try {
    const ciftlikler = await supabaseFetch(yol);
    const liste = [];
    for (const c of ciftlikler ?? []) {
      const uyeler = await supabaseFetch(
        `/rest/v1/ciftlik_uye?ciftlik_id=eq.${c.id}&select=kullanici_id,rol`,
      );
      let sahipEposta = null;
      try {
        const u = await supabaseFetch(`/auth/v1/admin/users/${c.sahip_id}`, { method: 'GET' });
        sahipEposta = u?.email ?? null;
      } catch {
        sahipEposta = null;
      }
      liste.push({
        id: c.id,
        ad: c.ad,
        created_at: c.created_at,
        uye_sayisi: (uyeler ?? []).length,
        sahip_eposta: epostaMaskele(sahipEposta),
      });
    }
    return json(res, 200, { ok: true, ciftlikler: liste });
  } catch (e) {
    return json(res, e.status || 500, { ok: false, hata: e.message });
  }
};
