import {
  OTP_GONDER_BEKLEME_MS,
  otpBeklemeKalanMs,
  turnstileKorumasiAktif,
  turnstileSiteKey,
} from '@/kaynak/bulut/turnstile-ayar';
import { test, type TestModul } from '../cerceve';

const G = 'Bulut OTP koruması';

export const bulutOtpKorumaModul: TestModul = {
  grup: G,
  async calistir() {
    const r = [];
    const eskiSite = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;
    delete process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;
    r.push(test(G, 'Site key yokken Turnstile kapalı', !turnstileKorumasiAktif() && turnstileSiteKey() === null));

    process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY = 'test-site';
    r.push(test(G, 'Site key ile Turnstile açık', turnstileKorumasiAktif() && turnstileSiteKey() === 'test-site'));

    const simdi = 1_000_000;
    r.push(test(G, 'Son gönderim yoksa bekleme 0', otpBeklemeKalanMs(null, simdi) === 0));
    r.push(
      test(
        G,
        'Gönderimden sonra bekleme süresi pozitif',
        otpBeklemeKalanMs(simdi - 1_000, simdi) > 0 && otpBeklemeKalanMs(simdi - 1_000, simdi) <= OTP_GONDER_BEKLEME_MS,
      ),
    );
    r.push(
      test(
        G,
        'Bekleme süresi dolduğunda kalan 0',
        otpBeklemeKalanMs(simdi - OTP_GONDER_BEKLEME_MS - 1, simdi) === 0,
      ),
    );

    if (eskiSite) process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY = eskiSite;
    else delete process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;

    return r;
  },
};
