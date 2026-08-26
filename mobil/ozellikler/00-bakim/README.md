# 00 — Proje bakımı

**İşlemler:** [`islemler/28-bakim/`](../../../islemler/28-bakim/)

Periyodik kontrol listesi — kod, ağaç, rapor, önizleme.

## Kod yolları

| Katman | Yol |
|--------|-----|
| araç | `araclar/islem-kontrol/` |
| checklist | `islemler/` + `islemler/rapor/index.html` |
| parça kuralı | `mobil/ozellikler/KURAL.md` |
| bakım rehberi | `mobil/BAKIM.md` |

## Rutin (her sprint / agent turu)

1. `cd mobil && npx tsc --noEmit`
2. Yinelenen stub / boş route klasörü temizliği
3. `python3 islemler/scripts/kilit.py durum`
4. `python3 islemler/scripts/html_rapor.py rebuild` (gerekirse)
5. Parça README ↔ gerçek dosya eşleşmesi

## Bağımlılık

- Diğer parçalara dokunmaz; sadece yapı ve kalite.
