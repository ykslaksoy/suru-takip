# 10 — Akıllı Veteriner (AI)

**İşlemler:** [`islemler/10-akilli-veteriner/`](../../../islemler/10-akilli-veteriner/)

## Kod yolları

| Katman | Yol |
|--------|-----|
| kaynak | `mobil/kaynak/akilli-veteriner/` |
| bilesenler | `mobil/bilesenler/veteriner/` |
| app | `mobil/app/veteriner/` |
| app | `mobil/app/(tabs)/veteriner/` |

## Plan dosyaları

### kaynak
- `fotograf.ts`
- `geri-bildirim.ts`
- `aciliyet.ts`

### bilesenler
- `SemptomFormu.tsx`
- `FotografYukle.tsx`
- `VakaOzeti.tsx`

## Bağımlılık

- Sadece `03-cekirdek` + `bilesenler/ortak`
- Diğer parçalara **doğrudan import yok**
