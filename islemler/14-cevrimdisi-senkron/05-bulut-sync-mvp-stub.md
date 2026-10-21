---
status: TODO
kilitli: false
---

# [ ] Bulut sync MVP stub (sunucu + EXPO_PUBLIC_API_URL)

> **AÇIK İŞLEM.** Tamamlanınca status=DONE yapılır, `[x]` konur, `kilitli: true` yazılır — sonra dokunulmaz.

**Klasör:** `14-cevrimdisi-senkron`  
**Bağımlı kod:** `sunucu/`, `mobil/kaynak/bulut/api-url.ts`, `mobil/kaynak/cekirdek/senkron-motor.ts`

## Yapılacak
- [x] `sunucu/` — `GET /health`, `POST /api/v1/sync` (kiracı başlığı, bellek stub)
- [x] Mobil — `EXPO_PUBLIC_API_URL` ile kuyruk POST; tanımsızsa eski yerel flush
- [x] `OzellikBayraklari` — `bulut-senkron` → `yakinda` (üretim backend bekleniyor)

## Kural
Telefon verisi önce yerel SQLite/AsyncStorage; çevrimiçi olunca kullanıcı kapsamlı API’ye kuyruk push (çok kiracılı `X-Tenant-Id`).

## Üretim için eksik
PostgreSQL, kimlik doğrulama, pull senkron, çakışma çözümü, kalıcı depolama, Vercel deploy.
