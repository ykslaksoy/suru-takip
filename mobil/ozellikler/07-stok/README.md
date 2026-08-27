# 07 — Stok

**İşlemler:** [`islemler/07-stok/`](../../../islemler/07-stok/)

## Kod yolları

| Katman | Yol |
|--------|-----|
| kaynak | `mobil/kaynak/stok/` |
| bilesenler | `mobil/bilesenler/stok/` |
| app | `mobil/app/(tabs)/stok/` |

### kaynak
- `katalog.ts` — yem / takviye / ilaç / aşı tam listesi
- `kullanim.ts` — kullanım skoru + sıralı liste
- `takviye.ts` — geriye dönük export
- `sayim.ts` / `yem-tuketim.ts`

### bilesenler
- `StokKarti.tsx`

Stok tipleri: Yem · Takviye · Aşı · İlaç  
Liste: katalogun tamamı, **kullanıma göre üstte**


- Sadece `03-cekirdek` + `bilesenler/ortak`
- Diğer parçalara **doğrudan import yok**
