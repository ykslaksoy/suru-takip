---
status: WIP
kilitli: false
---

# [ ] Gözlem ~100 seed kalıcı

**Klasör:** `03-cekirdek`  
**Kod:** `padok-b-kuzular.ts`, `VeritabaniBaglami.tsx` · [PR #21](https://github.com/ykslaksoy/suru-takip/pull/21)

## Durum
- `main`: Gözlem 80 + Padok A 20 (#17) + her boot ensure (#21) ✅
- Local/uretim export: **Gözlem 80 / toplam 140** ✅
- https://superkuzu.vercel.app: bundle **eski** (`gozlem-kuzu` yok) — Hobby rate-limit ❌

## Kök neden
localStorage + stale prod build (seed zaten main’de).

## Sonraki
Rate-limit bitince SuperKuzu production redeploy; hard-refresh.
