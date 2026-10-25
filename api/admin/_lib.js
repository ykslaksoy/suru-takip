/**
 * Admin API — Supabase service role yalnız sunucuda.
 */

const SUPERKUZU_REF = 'eferktaopilgoeetgggk';

function supabaseUrl() {
  const u = String(process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  if (!u || !u.includes(SUPERKUZU_REF)) return null;
  return u;
}

function serviceKey() {
  return String(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? '').trim();
}

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function supabaseFetch(yol, { method = 'GET', body, token, prefer } = {}) {
  const url = supabaseUrl();
  const key = serviceKey();
  if (!url || !key) throw new Error('SUPABASE yapılandırması eksik');

  const headers = {
    apikey: key,
    Authorization: `Bearer ${token || key}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;

  const r = await fetch(`${url}${yol}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const metin = await r.text();
  if (!r.ok) {
    let m = metin;
    try {
      const j = JSON.parse(metin);
      m = j.message || j.error || metin;
    } catch {
      /* */
    }
    const err = new Error(m);
    err.status = r.status;
    throw err;
  }
  return metin ? JSON.parse(metin) : null;
}

async function kullaniciIdFromToken(bearer) {
  const url = supabaseUrl();
  const key = serviceKey();
  if (!url || !key || !bearer) return null;
  const r = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${bearer}` },
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u.id || null;
}

async function adminMi(kullaniciId) {
  if (!kullaniciId) return false;
  const rows = await supabaseFetch(
    `/rest/v1/admin_kullanici?kullanici_id=eq.${kullaniciId}&select=kullanici_id`,
  );
  return Array.isArray(rows) && rows.length > 0;
}

function bearer(req) {
  const h = String(req.headers.authorization ?? '');
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : '';
}

function epostaMaskele(eposta) {
  const e = String(eposta ?? '');
  const [k, d] = e.split('@');
  if (!k || !d) return '—';
  const g = k.length <= 2 ? '*' : `${k.slice(0, 2)}***`;
  return `${g}@${d}`;
}

module.exports = {
  SUPERKUZU_REF,
  json,
  supabaseFetch,
  kullaniciIdFromToken,
  adminMi,
  bearer,
  epostaMaskele,
  supabaseYapilandirildi: () => Boolean(supabaseUrl() && serviceKey()),
};
