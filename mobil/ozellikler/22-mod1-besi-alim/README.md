# 22 — Mod 1 — Kuzu Alarak Besi

**İşlemler:** [`islemler/22-mod1-kuzu-alarak-besi/`](../../../islemler/22-mod1-kuzu-alarak-besi/)

## Kod yolları

| Katman | Yol |
|--------|-----|
| kaynak | `mobil/kaynak/besi-ortak/` |
| kaynak | `mobil/kaynak/besi-alim/` |
| bilesenler | `mobil/bilesenler/besi/` |
| app | `mobil/app/besi/` |
| app | `mobil/app/mod/` |

## Plan dosyaları

### kaynak
- `adim-kilidi.ts`
- `oncelik-karti.ts`
- `metrik-rapor.ts`
- `alim-girisi.ts`
- `karantina.ts`

### bilesenler
- `YolculukAdimi.tsx`
- `MetrikPanel.tsx`
- `OncelikKarti.tsx`

## Bağımlılık

- Sadece `03-cekirdek` + `bilesenler/ortak`
- Diğer parçalara **doğrudan import yok**
