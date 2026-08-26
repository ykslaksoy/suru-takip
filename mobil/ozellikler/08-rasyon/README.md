# 08 — Rasyon

**İşlemler:** [`islemler/08-rasyon/`](../../../islemler/08-rasyon/)

## Kod yolları

| Katman | Yol |
|--------|-----|
| kaynak | `mobil/kaynak/rasyon/` |
| bilesenler | `mobil/bilesenler/rasyon/` |
| app | `mobil/app/rasyon/` |
| app | `mobil/app/(tabs)/rasyon/` |

## Plan dosyaları

### kaynak
- `kullanici-rasyon.ts`
- `akilli-oneri.ts`
- `karsilastirma.ts`

### bilesenler
- `RasyonFormu.tsx`
- `AkilliOneriKarti.tsx`
- `KarsilastirmaTablosu.tsx`

## Bağımlılık

- Sadece `03-cekirdek` + `bilesenler/ortak`
- Diğer parçalara **doğrudan import yok**
