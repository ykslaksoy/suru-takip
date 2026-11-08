/**
 * GET/POST /api/admin/besi-model — yalnız admin_kullanici allowlist (sunucu).
 */
const {
  json,
  supabaseFetch,
  bearer,
  kullaniciIdFromToken,
  adminMi,
  supabaseYapilandirildi,
} = require('./_lib');
const { birlesBesiModel, VARSAYILAN_BESI_MODEL_GOVDE } = require('../besi/_model-birles');

function govdeGecerliMi(model) {
  if (model == null || typeof model !== 'object') return 'model gerekli';
  try {
    birlesBesiModel(model);
    return null;
  } catch (e) {
    return e.message || 'geçersiz';
  }
}

module.exports = async function handler(req, res) {
  if (!supabaseYapilandirildi()) {
    json(res, 503, { ok: false, hata: 'Supabase yapılandırması yok' });
    return;
  }
  const uid = await kullaniciIdFromToken(bearer(req));
  if (!uid || !(await adminMi(uid))) {
    json(res, 403, { ok: false, hata: 'Admin yetkisi gerekli' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const rows = await supabaseFetch(
        '/rest/v1/admin_besi_model_surum?select=id,surum_no,gecerli,model,degistiren_eposta,not,created_at&order=created_at.desc&limit=25',
      );
      const aktif = Array.isArray(rows) ? rows.find((r) => r.gecerli) : null;
      json(res, 200, {
        ok: true,
        varsayilan: VARSAYILAN_BESI_MODEL_GOVDE,
        aktif,
        gecmis: rows || [],
      });
    } catch (e) {
      json(res, e.status || 500, { ok: false, hata: e.message });
    }
    return;
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        json(res, 400, { ok: false, hata: 'JSON gerekli' });
        return;
      }
    }
    const hata = govdeGecerliMi(body?.model);
    if (hata) {
      json(res, 400, { ok: false, hata });
      return;
    }
    try {
      const onceki = await supabaseFetch(
        '/rest/v1/admin_besi_model_surum?select=surum_no&order=surum_no.desc&limit=1',
      );
      const ust = Array.isArray(onceki) && onceki[0]?.surum_no ? onceki[0].surum_no : 0;
      const surumNo = ust + 1;
      const row = {
        surum_no: surumNo,
        gecerli: true,
        model: body.model,
        degistiren: uid,
        degistiren_eposta: body.degistiren_eposta || '',
        not: typeof body.not === 'string' ? body.not.slice(0, 500) : '',
      };
      await supabaseFetch('/rest/v1/admin_besi_model_surum?gecerli=eq.true', {
        method: 'PATCH',
        body: { gecerli: false },
        prefer: 'return=minimal',
      });
      const eklenen = await supabaseFetch('/rest/v1/admin_besi_model_surum', {
        method: 'POST',
        body: row,
        prefer: 'return=representation',
      });
      const kayit = Array.isArray(eklenen) ? eklenen[0] : eklenen;
      json(res, 200, {
        ok: true,
        surum: kayit,
        model: birlesBesiModel(kayit.model, { id: kayit.id, guncelleme: kayit.created_at }),
      });
    } catch (e) {
      json(res, e.status || 500, { ok: false, hata: e.message });
    }
    return;
  }

  json(res, 405, { ok: false, hata: 'GET veya POST' });
};
