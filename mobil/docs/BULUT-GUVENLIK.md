# Bulut girişi — bot koruması

`/bulut` ekranında e-posta OTP (`girisKoduGonder`) isteğe bağlı **Cloudflare Turnstile** ve her zaman **istemci bekleme süresi** ile korunur.

## Önerilen: Cloudflare Turnstile

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → Turnstile → yeni site widget.
2. Domain: `superkuzu.vercel.app` (önizleme URL’leri için ayrı widget veya wildcard).
3. Vercel → **superkuzu** → Environment Variables:

| Değişken | Ortam | Açıklama |
|---|---|---|
| `EXPO_PUBLIC_TURNSTILE_SITE_KEY` | Production + Preview | Site key (istemciye gömülür) |
| `TURNSTILE_SECRET_KEY` | Production + Preview | Secret key — **yalnız sunucu** (`/api/bulut/otp-onay`) |

4. **Redeploy** (Expo web derlemesi site key’i gömer).

### Akış

1. Kullanıcı Turnstile’ı tamamlar → token.
2. İstemci `POST /api/bulut/otp-onay` ile token doğrular (`api/bulut/otp-onay.js`).
3. Başarılıysa Supabase `/auth/v1/otp` çağrılır.
4. İstemci: aynı cihazda en az **60 sn** bekleme (`sy_bulut_otp_son_gonderim_v1`).
5. Edge `middleware.js`: aynı IP için 60 sn içinde en fazla **8** onay isteği.

### Anahtarlar yoksa (stub)

- `EXPO_PUBLIC_TURNSTILE_SITE_KEY` tanımlı değilse Turnstile widget gösterilmez; yalnızca 60 sn bekleme süresi uygulanır.
- Site key var, `TURNSTILE_SECRET_KEY` yoksa: **production**’da onay API 503 döner (OTP gönderilmez). Preview/geliştirmede stub mod (`mod: stub`) — yalnızca geliştirme içindir.

## Alternatif: Vercel BotID

Turnstile anahtarı alınamazsa [Vercel BotID](https://vercel.com/docs/botid) düşünülebilir. Bu repoda varsayılan entegrasyon Turnstile’dır; BotID için ayrı SDK + `@vercel/functions` middleware gerekir ve henüz bağlanmadı.

Ek sertleştirme: Vercel Firewall → rate limiting `/api/bulut/*` ve `/auth` trafiği (Supabase tarafında da Auth rate limit açık olmalı).

## SuperArı

**SuperArı** Supabase projesi (`ssminvxldxaqnzizbrfy`) kullanılmaz. Yalnız SuperKuzu (`eferktaopilgoeetgggk`) — bkz. [BULUT.md](./BULUT.md).

## Yerel geliştirme

- `expo start --web`: `/api/bulut/otp-onay` yoktur; `EXPO_PUBLIC_ORTAM` ≠ `uretim` iken doğrulama atlanabilir.
- Üretim davranışını test için Vercel preview + env anahtarları kullan.
