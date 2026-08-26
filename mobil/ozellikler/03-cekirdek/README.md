# 03 — Çekirdek (db, senkron, kimlik)

**İşlemler:** [`islemler/03-cekirdek/`](../../../islemler/03-cekirdek/)

## Kod yolları

| Katman | Yol |
|--------|-----|
| kaynak | `mobil/kaynak/cekirdek/` |
| bilesenler | `mobil/bilesenler/ortak/` |
| app | `mobil/app/_layout.tsx/` |
| app | `mobil/baglam/` |

## Plan dosyaları

### kaynak
- `senkron-kuyruk.ts`
- `senkron-motor.ts`
- `api-istemci.ts`
- `roller.ts`
- `yetki.ts`
- `padok.ts`

## Bağımlılık

- Sadece `03-cekirdek` + `bilesenler/ortak`
- Diğer parçalara **doğrudan import yok**
