---
status: TODO
kilitli: false
---

# [ ] Prod onay — #9 undeployed + kota / stub

**Klasör:** `02-ekran-taslak`  
**Kod:** zaten `main` `29da2a1` (#9/#10) — yeni PR yok  
**Canlı:** https://superkuzu.vercel.app

## Durum

- **2026-09-15 ~16:52 UTC:** https://superkuzu.vercel.app canlı — hub **Çok kuzu**; Özet/onay boş adette Türkçe hata; adet=2 → onay adımı (E2E OK)
- Önceki kök neden: #9 undeployed + Hobby kota; stub temizlendi / git deploy success
- Kanıt: store `internal/onay-deploy-status.md` + `media/prod-*-20260915.png`

## Ne yapılacak (kullanıcı)

1. Hard-refresh https://superkuzu.vercel.app/hayvan/hizli-ekle
2. Toplu kabul → padok → sayı → boş adet ile **Özet / onay** (Türkçe hata)
3. Adet `2` → onayla

## Tamamlandı mı?

Kullanıcı **"tamam"** dediğinde `kilit.py tamamla` ile kilitle.
