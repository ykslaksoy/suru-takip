/**
 * Vercel — Cloudflare Turnstile token doğrulama (Bulut OTP öncesi).
 * TURNSTILE_SECRET_KEY yoksa production'da 503; diğer ortamlarda stub (token varlığı).
 */

const SITE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function izinliOrigin(origin, host) {
  if (!origin) return false;
  const allowed = new Set(['https://superkuzu.vercel.app', 'http://localhost:8081', 'http://localhost:19006']);
  if (host) allowed.add(`https://${host}`);
  return allowed.has(origin);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, hata: 'Yalnızca POST.' });
  }

  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!izinliOrigin(origin, host)) {
    return res.status(403).json({ ok: false, hata: 'Geçersiz kaynak.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const token = String(body.token ?? '').trim();
  if (!token) {
    return res.status(400).json({ ok: false, hata: 'Turnstile token gerekli.' });
  }

  const secret = String(process.env.TURNSTILE_SECRET_KEY ?? '').trim();
  const uretim = String(process.env.VERCEL_ENV ?? '').toLowerCase() === 'production';

  if (!secret) {
    if (uretim) {
      return res.status(503).json({
        ok: false,
        hata: 'Sunucu bot koruması yapılandırılmadı (TURNSTILE_SECRET_KEY).',
        mod: 'kapali',
      });
    }
    return res.status(200).json({ ok: true, mod: 'stub' });
  }

  const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0]?.trim();
  const params = new URLSearchParams({ secret, response: token });
  if (ip) params.set('remoteip', ip);

  const vr = await fetch(SITE_VERIFY, { method: 'POST', body: params });
  const sonuc = await vr.json();

  if (!sonuc.success) {
    const kod = (sonuc['error-codes'] || []).join(', ') || 'dogrulama_basarisiz';
    return res.status(403).json({ ok: false, hata: 'Bot kontrolü geçersiz.', detay: kod });
  }

  return res.status(200).json({ ok: true, mod: 'turnstile' });
};
