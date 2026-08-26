# 11 — Veteriner Köprüsü

**İşlemler:** [`islemler/11-veteriner-koprusu/`](../../../islemler/11-veteriner-koprusu/)

## Kod yolları

| Katman | Yol |
|--------|-----|
| kaynak | `mobil/kaynak/veteriner-koprusu/` |
| bilesenler | `mobil/bilesenler/veteriner/` |
| app | `mobil/app/veteriner/vaka/` |
| app | `mobil/app/veteriner/inbox/` |

## Plan dosyaları

### kaynak
- `vaka-paketi.ts`
- `gonder.ts`
- `talimat.ts`
- `case-thread.ts`

### bilesenler
- `VetInboxKarti.tsx`
- `TalimatFormu.tsx`

## Bağımlılık

- Sadece `03-cekirdek` + `bilesenler/ortak`
- Diğer parçalara **doğrudan import yok**
