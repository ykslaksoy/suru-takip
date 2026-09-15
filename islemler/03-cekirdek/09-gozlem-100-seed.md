---
status: WIP
kilitli: false
---

# [ ] Gözlem ~100 seed kalıcı

**Klasör:** `03-cekirdek`  
**Kod:** `mobil/kaynak/cekirdek/padok-b-kuzular.ts`, `VeritabaniBaglami.tsx`

## Ne
Kalıcı `superkuzu.vercel.app` Gözlem’de ~100 kuzu (80 Gözlem + 20 Padok A açık plan).

## Kök neden
1. Canlı bundle hâlâ `#17` öncesi (`gozlem-kuzu` yok) — Hobby rate-limit.
2. Web: `localStorage` / hesap bulutu yok; boş tarayıcı boş sürü.
3. `ensurePadokKuzuVerisi` eksik `gozlem-kuzu-*` doldurur (silmez).

## Yapılan
- Her boot’ta `ensurePadokKuzuVerisi()` (üretimde de).
- Seed main’de: `GOZLEM_KUZU_ADET=80` + A20 ≈ 100.
