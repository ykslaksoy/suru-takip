# sunucu/

Çok kiracılı bulut senkron API iskeleti (MVP stub). Üretimde PostgreSQL + auth + çakışma çözümü.

## Yapı

- `src/api/` — HTTP router (`GET /health`, `POST /api/v1/sync`)
- `src/servisler/` — tenant bellek deposu (stub)
- `src/modeller/` — gelecek şema tipleri

## Çalıştırma

```bash
cd sunucu && npm ci && npm start
```

Varsayılan port: `8787` (`PORT` ile değişir).

## Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `PORT` | Hayır | Dinleme portu (varsayılan 8787) |
| `SYNC_API_KEY` | Hayır | Tanımlıysa isteklerde `Authorization: Bearer <key>` veya `X-Sync-Api-Key` gerekir |

## Mobil bağlantı

`mobil` tarafında `EXPO_PUBLIC_API_URL` (ör. `http://127.0.0.1:8787`) tanımlıysa senkron kuyruğu `POST /api/v1/sync` ile gönderilir.

İsteğe bağlı: `EXPO_PUBLIC_SYNC_API_KEY` → sunucudaki `SYNC_API_KEY` ile eşleşmeli.

Kiracı: `X-Tenant-Id` — mobil işletme profilinden türetilen anahtar.

## Vercel / monorepo notu

Ana `vercel.json` yalnızca Expo web derlemesini yayınlar. Bu API ayrı bir Vercel projesi veya `sunucu` için Serverless Functions olarak eklenebilir; MVP yerel `npm start` ile test edilir.
