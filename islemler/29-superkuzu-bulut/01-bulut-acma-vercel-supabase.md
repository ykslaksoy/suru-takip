# SuperKuzu bulut açma (Vercel + Supabase)

**Durum:** uygulama tarafı — Vercel env eşleme + `bulutSenkronAktif` → Supabase env.

## Yapılanlar (kod)
- `mobil/scripts/supabase-expo-public.js` — Vercel entegrasyon `SUPABASE_*` → `EXPO_PUBLIC_SUPABASE_*`
- `mobil/kaynak/bulut/ayar.ts` — çoklu env adı okuma
- `mobil/sabitler/Ortam.ts` — bulut bayrağı `bulutAcik()` ile
- `vercel.json` / `mobil/vercel.json` build komutu

## Sahip: Supabase paneli (eferktaopilgoeetgggk)

### 1) Şema
1. [Supabase Dashboard](https://supabase.com/dashboard) → proje **eferktaopilgoeetgggk**
2. SQL Editor → New query
3. Repo dosyası `mobil/supabase/schema.sql` tamamını yapıştır → **Run**
4. Table Editor’da `ciftlik`, `belge`, `foto` tablolarını doğrula; Authentication → Policies’te RLS satırları görünmeli

### 2) Auth URL
Authentication → URL Configuration:
- Site URL: `https://superkuzu.vercel.app`
- Redirect URLs (en az):
  - `https://superkuzu.vercel.app/bulut`
  - `https://superkuzu.vercel.app/**` (isteğe bağlı, magic link callback)
  - Önizleme domain’leri Vercel entegrasyonu ekleyebilir; eksikse `https://*.vercel.app/bulut` ekle

### 3) E-posta şablonu (OTP)
Authentication → Email Templates → **Magic Link** (veya Confirm signup / OTP kullanılan şablon):
- Konu örneği: `SürüYön giriş kodun`
- İçerik: `mobil/supabase/email-otp-tr.html` dosyasını kopyala; `{{ .Token }}` mutlaka kalsın

### 4) Vercel
- Proje **superkuzu**, takım **yuksel2**
- Supabase entegrasyonu Production + Preview bağlı
- Deploy yenile

**Not:** `ssminvxldxaqnzizbrfy` (SuperAri) projesine dokunulmaz.
