# Bulut eşitleme (Supabase)

Bulut, **özellik bayrağı** ile kapalıdır. Aşağıdaki iki değişken tanımlı değilse uygulama yalnız yerel çalışır, hiçbir ağ isteği yapmaz.

| Değişken | Nereden |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL (`https://xxxx.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Aynı sayfa → `anon` / publishable key (herkese açık anahtardır, RLS korur) |

**Service role anahtarı gerekmez** ve uygulamaya asla konmamalıdır.

## Kurulum
1. Supabase'de yeni proje aç (SüperArı projesinden ayrı).
2. SQL Editor → `mobil/supabase/schema.sql` içeriğini yapıştır → Run.
3. Authentication → URL Configuration → Site URL: `https://superkuzu.vercel.app`, Redirect URLs: `https://superkuzu.vercel.app/bulut`.
4. Authentication → Email Templates → "Magic Link" şablonuna `{{ .Token }}` ekle (6 haneli kod da gelsin).
5. Vercel → superkuzu → Settings → Environment Variables: yukarıdaki iki değişkeni Production'a ekle → Redeploy.

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
