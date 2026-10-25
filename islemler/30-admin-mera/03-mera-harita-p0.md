---
status: DONE
kilitli: true
kilit_tarihi: 2026-10-25
---# [x] Mera haritası P0


> **KİLİTLİ — TAMAM (şifre korumalı).** Değiştirmek için: `python3 islemler/scripts/kilit.py unlock <dosya>` + şifre.

**Durum:** uygulandı

## Kapsam
- Yerel GeoJSON `sy_mera_harita_v1` (`mobil/kaynak/mera/harita.ts`)
- Nokta padok, padok listesi ile senkron
- `/mera` ekranı; web Leaflet (`MeraHarita.web.tsx`)
- `/suru` ve padok panelinden harita bağlantısı
- Özellik bayrağı `mera-harita` (`OzellikBayraklari` + `ozellik-acik.ts`)
