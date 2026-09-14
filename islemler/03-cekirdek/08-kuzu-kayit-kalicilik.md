---
status: TODO
kilitli: false
---

# [ ] Kuzu kayıt kalıcılığı + başlangıç 61

**Klasör:** `03-cekirdek` / `02-ekran-taslak`  
**Kod:** `web-kalici-depo`, `veritabani.web`, `ornek-veri`, `kupe-aralik`, `toplu.tsx`, `vercel.json`

## Ne yapıldı

- Web yazımları doğrulanır (AsyncStorage / localStorage)
- Boş depoda 60 padok kuzu seed; mevcut kullanıcı kaydı silinmez
- Başlangıç no: `max(önekMax+1, kayıtlı+1)` → 60 hayvan → **61**
- Toplu ekran DB `ready` sonrası sayıyı yükler (seed yarışı yok)
- Üretim build: `EXPO_PUBLIC_ORTAM=uretim`

## Tamamlandı mı?

Kullanıcı **"tamam"** dediğinde `kilit.py tamamla` ile kilitle.
