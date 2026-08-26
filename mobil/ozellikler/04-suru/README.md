# 04 — Sürü / Hayvan

**İşlemler:** [`islemler/04-suru/`](../../../islemler/04-suru/)

## Kod yolları

| Katman | Yol |
|--------|-----|
| kaynak | `mobil/kaynak/suru/` |
| bilesenler | `mobil/bilesenler/suru/` |
| app | `mobil/app/(tabs)/suru/` |
| app | `mobil/app/hayvan/` |

## Plan dosyaları

### kaynak
- `tur.ts`
- `padok.ts`

### bilesenler
- `TurSecici.tsx`
- `PadokSecici.tsx`

## Bağımlılık

- Sadece `03-cekirdek` + `bilesenler/ortak`
- Diğer parçalara **doğrudan import yok**
