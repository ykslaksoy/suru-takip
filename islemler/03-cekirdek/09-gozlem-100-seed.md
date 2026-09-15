---
status: DONE
kilitli: false
---

# [x] Gözlem ~100 seed kalıcı

**Klasör:** `03-cekirdek`  
**Kod:** `padok-b-kuzular.ts`, `VeritabaniBaglami.tsx` · [PR #21](https://github.com/ykslaksoy/suru-takip/pull/21)

## Sonuç
https://superkuzu.vercel.app — fresh localStorage: **Gözlem 80 · Padok A 20 · toplam 140**.

## Kök neden
Eski prod bundle’da `gozlem-kuzu` yoktu; veri `localStorage`. Seed #17 + ensure #21 deploy sonrası doldurur (silmeden).
