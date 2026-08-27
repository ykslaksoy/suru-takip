# 08 — Rasyon

**İşlemler:** [`islemler/08-rasyon/`](../../../islemler/08-rasyon/)

## Kod yolları

| Katman | Yol |
|--------|-----|
| kaynak | `mobil/kaynak/rasyon/` |
| bilesenler | `mobil/bilesenler/rasyon/` |
| app | `mobil/app/(tabs)/rasyon/` |

## Plan dosyaları

### kaynak
- `hesapla.ts` ✅
- `hayvan-plani.ts` ✅
- `kullanici-rasyon.ts` ✅ — bileşen + miktar + fiyat
- `akilli-oneri.ts` ✅ — sürü ort. + maliyet
- `karsilastirma.ts` (iskelet)

### bilesenler
- `RasyonFormu.tsx` ✅
- `AkilliOneriKarti.tsx` ✅
- `KarsilastirmaTablosu.tsx` (iskelet)

### app
- `(tabs)/rasyon` — Hesapla · Benim rasyonum · Akıllı öneri

## Bağımlılık

- Sadece `03-cekirdek` + `bilesenler/ortak`
- Diğer parçalara **doğrudan import yok**
