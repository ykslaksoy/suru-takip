---
status: DONE
kilitli: true
kapanis: "2026-10-30 denetim — kod + mobil test paketi (720/720) ile doğrulandı"
---

# [x] Ana sayfa layout — header + Hızlı İşlemler safe area

**Klasör:** `02-ekran-taslak`  
**Kod:** `mobil/bilesenler/ana-sayfa/KilitliAnaSayfa.tsx`, `mobil/bilesenler/ortak/guvenliAlan.ts`, `mobil/app/+html.tsx`

## Ne yapılacak

Yüksel telefon screenshot: açılışta maskot kırpılıyor, Hızlı İşlemler alt dock altında kalıyor, Aktif Partiler kenara yapışık.

- Header maskot tam görünsün (üst safe area)
- Hızlı İşlemler alt tab bar’ın üstünde kalsın / scroll payı
- Aktif Partiler satırı nefes alsın
- `#root` box-sizing + mobil padding — taşma kesmesin

## Tamamlandı mı?

Kullanıcı **"tamam"** dediğinde `kilit.py tamamla` ile kilitle.
