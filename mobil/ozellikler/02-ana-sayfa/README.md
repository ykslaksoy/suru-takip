# 02 — Ana Sayfa + Hızlı İşlemler

**İşlemler:** [`islemler/02-ekran-taslak/`](../../../islemler/02-ekran-taslak/)

## Kod yolları

| Katman | Yol |
|--------|-----|
| kaynak | `mobil/kaynak/ana-sayfa/` |
| bilesenler | `mobil/bilesenler/ana-sayfa/` |
| app | `mobil/app/(tabs)/ana-sayfa/` |

## Plan dosyaları

### kaynak
- `index.ts`
- `ozet.ts`
- `hizli-islemler.ts`
- `bugun.ts`
- `katalog.ts` / `tercih.ts` / `varsayilan.ts`

### bilesenler
- `HizliIslemlerGrid.tsx`
- `KestirmelerSatiri.tsx`
- `BugunKarti.tsx`
- `AnaSayfaPlanlayici.tsx`
- `OzetKarti.tsx` (stub)
- `ModKarti.tsx` (stub — modlar Ayarlar’da)

## Bağımlılık

- Sadece `03-cekirdek` + `bilesenler/ortak`
- Diğer parçalara **doğrudan import yok**
