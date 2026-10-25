---
status: DONE
kilitli: true
kilit_tarihi: 2026-10-25
---# [x] SuperKuzu — bulut rolleri, yerel ekip, foto senkron


> **KİLİTLİ — TAMAM (şifre korumalı).** Değiştirmek için: `python3 islemler/scripts/kilit.py unlock <dosya>` + şifre.

**Durum:** kod hazır; tam uçtan uca test için Vercel’de `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY` gerekir (panel adımları: `01-bulut-acma-vercel-supabase.md`).

## İki ayrı “rol” modeli

| Katman | Depo / tablo | Ne işe yarar | Buluta gider mi? |
|--------|----------------|--------------|------------------|
| **Çiftlik üyeliği** | Supabase `ciftlik_uye` | Davet kodu, Sahip/Ortak/Bakıcı/Veteriner, finans RLS | Evet (API; `sy_ekip_v1` değil) |
| **Cihaz profili** | Yerel `sy_ekip_v1` | Aynı tablette “kim kullanıyor”, PIN, ince yetkiler | **Hayır** — `siniflama.ts` cihaz anahtarı |

Uygulama içi yetki kontrolleri (kayıt silme, finans ekranı vb.) **yerel aktif profile** bakar. Bulut rolü: hangi belgelerin/fotoğrafların indirileceği ve `/bulut` ekranındaki “Rolün” satırı.

## Foto galeri

- **Üst veri:** `sy_foto_meta_v1` → belge senkronu (`motor.ts` / `belge` tablosu).
- **Ham dosya:** `foto-senkron.ts` → Supabase Storage + `foto` tablosu; `simdiSenkronEt` belge senkronundan sonra çalışır.

## Kod akışı (giriş + çiftlik)

1. `girisKoduDogrula` / magic link → `oturumKaydet` → kayıtlı `sy_bulut_ciftlik_v1` varsa **`simdiSenkronEt`** (veri + foto).
2. Çiftlik oluştur / davet kabul → UI yine `simdiSenkronEt` çağırır.
3. `bulutBaslat`: periyodik + `online` olayında tam senkron.

## Manuel test (Yüksel)

### Ön koşul (panel, bir kez)

1. `01-bulut-acma-vercel-supabase.md` — şema, Auth URL, e-posta OTP, Vercel deploy.
2. Production’da `EXPO_PUBLIC_SUPABASE_*` dolu olduğunu doğrula; uygulamada Bulut ekranı “henüz açık değil” **göstermemeli**.

### Senaryolar

1. **Giriş + mevcut çiftlik:** E-posta kodu → giriş → “Son eşitleme” güncellenmeli; yeni foto çek → Şimdi eşitle → ikinci cihazda meta + görüntü gelmeli.
2. **Yerel ekip ipucu:** Ayarlar → Ekip’e ikinci kişi veya PIN ekle → Bulut → sarı kutu “yerel ekip profilleri” görünmeli; sunucu ekip listesi davetlileri göstermeli.
3. **Davet:** Sahip davet kodu → başka hesap Katıl → listede yeni üye; katılanın “Rolün” satırı doğru.
4. **Bakıcı:** Bakıcı hesabı — maliyet belgeleri inmemeli; sürü + foto (finans hariç) inmeli.

### Env yoksa

Yerel `npm test` (mobil) bulut modülünü çalıştırır; canlı Supabase gerekmez.
