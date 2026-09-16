---
status: IN_PROGRESS
kilitli: false
---

# Stok giriş/çıkış modal UX iyileştirmesi

**Klasör:** `07-stok`  
**Kod:** `mobil/bilesenler/stok/`, `mobil/app/(tabs)/stok/index.tsx`  
**PR:** #25 — `cursor/giris-yontemi-kurulum-52c4`

## Sorun
Giriş/Çıkış modalında alanlar yalnızca placeholder ile gösteriliyordu; kullanıcı nereye ne yazacağını anlayamıyordu.

## Yapılan
- `FormAlani` — kalıcı etiket + yardım metni + büyük dokunma alanı (56px)
- `StokGirisCikisModal` — bölümlü yapı (Ne kadar? / Hangi padok? / İşlem), mevcut stok gösterimi
- `StokKayitModal` — aynı etiketli form deseni; stok kaydı ekranı da güncellendi
- Türkçe saha dostu metinler; padok FCR yardım metni

## Dosyalar
- `mobil/bilesenler/stok/FormAlani.tsx` (yeni)
- `mobil/bilesenler/stok/StokGirisCikisModal.tsx` (yeni)
- `mobil/bilesenler/stok/StokKayitModal.tsx` (yeni)
- `mobil/app/(tabs)/stok/index.tsx` (refactor)

## Test
`cd mobil && npm test` → 165/165 geçti
