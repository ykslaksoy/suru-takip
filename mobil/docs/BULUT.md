# Bulut eşitleme (Supabase)

Bulut, **Supabase ortam değişkenleri** tanımlı olduğunda açılır. Değişkenler yoksa uygulama yalnız yerel çalışır, hiçbir ağ isteği yapmaz.

| Amaç | Değişken adları (öncelik sırasıyla) |
|---|---|
| Proje URL | `EXPO_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_URL` · `SUPABASE_URL` |
| Anon / publishable key | `EXPO_PUBLIC_SUPABASE_ANON_KEY` · `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_PUBLISHABLE_KEY` · `SUPABASE_ANON_KEY` |

**Service role / secret key gerekmez** ve istemciye asla konmamalıdır.

### Vercel (superkuzu)

Supabase ↔ Vercel entegrasyonu (proje ref `eferktaopilgoeetgggk`) varsayılan olarak `SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY` (veya `SUPABASE_ANON_KEY`) ekler. Web derlemede `mobil/scripts/supabase-expo-public.js` bunları `EXPO_PUBLIC_SUPABASE_*` olarak Expo'ya aktarır — elle kopyalamaya gerek yok.

**SuperAri** (`ssminvxldxaqnzizbrfy`) projesine dokunmayın; yalnız SuperKuzu Supabase projesi kullanılır.

## Kurulum (Supabase paneli)

1. SQL Editor → `mobil/supabase/schema.sql` içeriğini yapıştır → Run.
2. Authentication → URL Configuration:
   - **Site URL:** `https://superkuzu.vercel.app`
   - **Redirect URLs:** `https://superkuzu.vercel.app/bulut` (önizleme URL'leri entegrasyon ekleyebilir)
3. Authentication → Email Templates → Magic Link / OTP: Türkçe şablon ve `{{ .Token }}` (6 haneli kod) — örnek: `mobil/supabase/email-otp-tr.html`
4. Vercel → superkuzu → entegrasyon bağlı ve Production/Preview env senk → Redeploy.

## Tasarım
- **Giriş:** e-posta kodu (OTP) veya sihirli bağlantı. Şifre yok.
- **Çiftlik:** "Çiftlik oluştur" diyen **Sahip** olur; Ortak / Bakıcı / Veteriner için 8 haneli, 7 gün geçerli davet kodu üretir.
- **Veri:** her yerel koleksiyon (`sy_*` anahtarı) `belge` tablosunda bir satır. `updated_at` ile last‑write‑wins (sunucuda da tetikleyiciyle korunur), silme = `silindi=true`.
- **Güvenlik (RLS):** yalnız çiftlik üyeleri kendi çiftliğini görür. Para içeren belgeler (`finans=true`: maliyet, birim fiyat, sigorta poliçesi/prim, yem alımı, satış) yalnız Sahip/Ortak veya `finans` yetkili üyeye **sunucudan** gider. Bakıcı için `finans` tetikleyiciyle her zaman `false`.
- **Fotoğraflar:** özel Storage kovası `kuzu-foto/{ciftlik_id}/{foto_id}.jpg`, üst veri `foto` tablosu.
- **Çevrimdışı:** değişiklikler `sy_bulut_meta_v1` içinde bekleyen listesinde kalır; 60 sn'de bir ve `online` olayında gönderilir.
- **Göç:** çiftlik oluşturulunca cihazdaki tüm kayıtlar bir kereliğine yüklenir.
- **Cihaza özel kalanlar:** aktif profil + PIN (`sy_ekip_v1`), oturum, abonelik, ses/oturum tercihleri.

## Sınırlar
- Eşitleme koleksiyon düzeyindedir: iki telefon **aynı koleksiyonu** (ör. tartımlar) aynı anda çevrimdışı değiştirirse son yazan kazanır, diğerinin o koleksiyondaki değişikliği kaybolur.
- Native (iOS/Android) çekirdek sürü verisi SQLite'ta; ilk sürümde eşitleme web/PWA içindir.
- Başka cihazdan veri gelince ekranın güncellenmesi için sayfa yenilenir ("Şimdi eşitle" otomatik yeniler).
