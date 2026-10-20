---
status: devam
kilitli: false
---

# PR #25 — main birleştirme, Vercel derin link, test

**Dal:** `cursor/giris-yontemi-kurulum-52c4`  
**PR:** #25

## Yapılan

- `origin/main` → dal merge; çakışmalar çözüldü (layout, seri-giris, +html, test listesi; stok/kilo/ana sayfa main + giriş yöntemi korundu).
- `vercel.json` ve `mobil/vercel.json`: main’deki `rewrites` (Expo `_id` statik export) + build komutları geri alındı — `/gorevler/kategori/:id` → `/gorevler/kategori/_id`.
- `KilitliAnaSayfa`: `contentInsetAdjustmentBehavior` kaldırıldı (668 test).
- `mobil && npm test`: **668/668**.

## Not

- Prod: `superkuzu.vercel.app` — main merge sonrası Vercel otomatik deploy.
