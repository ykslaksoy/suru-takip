# 06 — Sağlık / Aşı / Bekletme

**İşlemler:** [`islemler/06-saglik/`](../../../islemler/06-saglik/)

## Kod yolları

| Katman | Yol |
|--------|-----|
| kaynak | `mobil/kaynak/saglik/` |
| bilesenler | `mobil/bilesenler/saglik/` |
| app | `mobil/app/(tabs)/saglik/` |
| app | `mobil/app/hayvan/[id]/saglik/` |

## Plan dosyaları

### kaynak
- `asi-takvimi.ts`

### bilesenler
- `SaglikKarti.tsx`
- `AsiTakvimi.tsx`
- `BekletmeUyarisi.tsx`

## Bağımlılık

- Sadece `03-cekirdek` + `bilesenler/ortak`
- Diğer parçalara **doğrudan import yok**
