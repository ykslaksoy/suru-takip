---
id: 10-home-safe-top-fouc
baslik: Ana sayfa mobil safe-area FOUC + üst header
tarih: 2026-09-16
durum: devam
kilitli: false
---

# Ana sayfa — iPhone Safari ilk açılış üst header

**Kod:** `mobil/app/+html.tsx`, `guvenliAlan.ts`, `KilitliAnaSayfa.tsx` · PR #25 (PR #23 ile aynı kök neden)

## Sorun
iPhone Safari’de ilk paint’te maskot + “Akıllı Kuzu” başlığı görünmüyor; ekranın en üstünde doğrudan metrik kartlar (60 Baş, 3 Görev).

## Kök neden
1. `100dvh` ilk frame’de Safari görünür alanından büyük → `#root` overflow hidden ile üst kırpılır
2. `useSafeAreaInsets()` ilk frame 0, sonra dolunca layout kayar
3. `contentInsetAdjustmentBehavior="automatic"` + çift üst pad (CSS + JS)
4. `height === 0` iken `kisa=true` → maskot küçülüp layout zıplar

## Çözüm
- `--app-height` (visualViewport) + `100svh` ilk paint’ten
- Üst safe-area yalnızca CSS `#root`; JS’te sabit küçük `headerPadTop`
- `useSafeAreaInsets` kaldırıldı; dock tarayıcı payı kaldırıldı
- ScrollView: `flexGrow: 0`, `minHeight` kaldırıldı, `contentInsetAdjustmentBehavior` yok
