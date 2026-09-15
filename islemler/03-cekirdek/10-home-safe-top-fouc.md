---
id: 10-home-safe-top-fouc
baslik: Ana sayfa mobil safe-area FOUC + Hızlı İşlemler dock
tarih: 2026-09-15
durum: devam
kilitli: false
---

# Ana sayfa — ilk açılış FOUC + alt dock

## Sorun
1. İlk paint: üst kırpık (100dvh > Safari görünür alan)
2. Sonra kısmen düzelir (hydrate / inset / dvh)
3. Yerleşince Hızlı İşlemler dock altında; Safari üstünde beyaz boşluk

## Çözüm
- İlk paint’ten `--app-height` (visualViewport) + `100svh`
- Üst safe-area yalnızca CSS (`#root`); JS inset ile çift pad yok
- Dock alt pad: tarayıcı payı kaldır (gap kaynağı); scroll pad dock üstü için sabit
