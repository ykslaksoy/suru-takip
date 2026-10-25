# Admin panel P0 (seçenek C)

**Durum:** uygulandı

## Kapsam
- Şema: `destek_talebi`, `admin_ozellik_bayrak`, `icerik_surum`, `admin_kullanici`
- API: `api/admin/*`, public `api/icerik/yayin`, `api/ozellik-bayraklar`
- UI: `admin/panel/index.html` → `/admin` (Vercel dist)
- Service role yalnız sunucu; çiftçi uygulamasına gömülü değil

## Sahip
- SQL Editor’da şema güncellemesi + `admin_kullanici` allowlist
- Vercel: `SUPABASE_SERVICE_ROLE_KEY` (SuperKuzu ref)
