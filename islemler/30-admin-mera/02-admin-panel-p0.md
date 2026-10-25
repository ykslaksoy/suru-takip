---
status: DONE
kilitli: true
kilit_tarihi: 2026-10-25
---# [x] Admin panel P0 (seçenek C)


> **KİLİTLİ — TAMAM (şifre korumalı).** Değiştirmek için: `python3 islemler/scripts/kilit.py unlock <dosya>` + şifre.

**Durum:** uygulandı

## Kapsam
- Şema: `destek_talebi`, `admin_ozellik_bayrak`, `icerik_surum`, `admin_kullanici`
- API: `api/admin/*`, public `api/icerik/yayin`, `api/ozellik-bayraklar`
- UI: `admin/panel/index.html` → `/admin` (Vercel dist)
- Service role yalnız sunucu; çiftçi uygulamasına gömülü değil

## Sahip
- SQL Editor’da şema güncellemesi + `admin_kullanici` allowlist
- Vercel: `SUPABASE_SERVICE_ROLE_KEY` (SuperKuzu ref)
