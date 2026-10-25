/**
 * Bulut OTP onay API — edge örneği üzerinde basit IP penceresi (60 sn / 8 istek).
 * Ana koruma: Turnstile + istemci bekleme süresi.
 */

const YOL = '/api/bulut/otp-onay';
const PENCERE_MS = 60000;
const MAX = 8;

const ipPencere = new Map();

function ipBul(req) {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'bilinmiyor'
  );
}

function sinirAsildi(ip) {
  const simdi = Date.now();
  const k = ipPencere.get(ip);
  if (!k || simdi - k.baslangic > PENCERE_MS) {
    ipPencere.set(ip, { sayac: 1, baslangic: simdi });
    return false;
  }
  k.sayac += 1;
  return k.sayac > MAX;
}

export default function middleware(req) {
  const url = new URL(req.url);
  if (url.pathname !== YOL || req.method !== 'POST') {
    return;
  }

  if (sinirAsildi(ipBul(req))) {
    return new Response(JSON.stringify({ ok: false, hata: 'Çok fazla istek. Biraz bekle.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config = {
  matcher: [YOL],
};
