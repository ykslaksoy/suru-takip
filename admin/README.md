# Admin panel (P0)

Minimal operasyon yüzeyi — çiftçi uygulamasına gömülü değil.

- UI: `admin/panel/index.html` → Vercel `dist/admin/` (build: `mobil/scripts/admin-panel-kopyala.js`)
- API: `api/admin/*` (service role yalnız sunucu)
- Şema: `mobil/supabase/schema.sql` (`admin_kullanici`, `destek_talebi`, `admin_ozellik_bayrak`, `icerik_surum`)

İlk admin: Supabase SQL Editor’da `admin_kullanici` tablosuna allowlist satırı ekleyin.
