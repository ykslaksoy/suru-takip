/**
 * Bulut OTP gönderimi — istemci bekleme süresi + Turnstile doğrulama (web).
 */
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { appOrtam } from '@/sabitler/Ortam';
import {
  OTP_GONDER_BEKLEME_MS,
  otpBeklemeKalanMs,
  turnstileKorumasiAktif,
  turnstileSiteKey,
} from './turnstile-ayar';

export { OTP_GONDER_BEKLEME_MS, turnstileKorumasiAktif, turnstileSiteKey } from './turnstile-ayar';

const SON_GONDERIM = 'sy_bulut_otp_son_gonderim_v1';

export async function otpSonGonderimZamani(): Promise<number | null> {
  const r = await kaliciGetItem(SON_GONDERIM);
  if (!r) return null;
  const n = Number(r);
  return Number.isFinite(n) ? n : null;
}

export async function otpGonderBeklemeKalanMs(): Promise<number> {
  return otpBeklemeKalanMs(await otpSonGonderimZamani());
}

export async function otpGonderCooldownKontrol(): Promise<void> {
  const kalan = await otpGonderBeklemeKalanMs();
  if (kalan > 0) {
    const sn = Math.ceil(kalan / 1000);
    throw new Error(`Çok sık denedin. ${sn} saniye sonra tekrar dene.`);
  }
}

export async function otpGonderimKaydet(): Promise<void> {
  await kaliciSetItem(SON_GONDERIM, String(Date.now()));
}

const OTP_ONAY_YOLU = '/api/bulut/otp-onay';

export async function turnstileTokenSunucuDogrula(token: string): Promise<void> {
  const t = token.trim();
  if (!t) throw new Error('Bot kontrolü tamamlanmadı.');

  if (typeof fetch === 'undefined') {
    throw new Error('Bot kontrolü bu ortamda kullanılamıyor.');
  }

  let r: Response;
  try {
    r = await fetch(OTP_ONAY_YOLU, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ token: t }),
    });
  } catch {
    if (appOrtam() !== 'uretim') return;
    throw new Error('Bot kontrolü sunucusuna ulaşılamadı. İnternetini kontrol et.');
  }

  if (r.status === 404 && appOrtam() !== 'uretim') return;

  const metin = await r.text();
  let j: { ok?: boolean; hata?: string; mesaj?: string } = {};
  try {
    j = metin ? (JSON.parse(metin) as typeof j) : {};
  } catch {
    /* düz metin */
  }

  if (!r.ok || !j.ok) {
    const m = j.hata || j.mesaj || `Bot kontrolü başarısız (${r.status}).`;
    throw new Error(m);
  }
}

export async function otpGonderimOnKontrol(turnstileToken?: string): Promise<void> {
  await otpGonderCooldownKontrol();
  if (turnstileKorumasiAktif()) {
    await turnstileTokenSunucuDogrula(turnstileToken ?? '');
  }
}
