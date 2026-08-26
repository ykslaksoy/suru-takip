# SürüYön — Bakım rehberi

> `mobil/ozellikler/00-bakim/` parçası · `islemler/28-bakim/`

## Hızlı kontrol

```bash
cd mobil && npx tsc --noEmit
python3 islemler/scripts/kilit.py durum
python3 islemler/scripts/html_rapor.py rebuild   # isteğe bağlı
```

## Klasör kuralları

| Sorun | Çözüm |
|-------|--------|
| `app/foo/` boş klasör + `app/foo.tsx` | Boş klasörü sil (Expo route çakışması) |
| Aynı logic iki parçada | Tek parçada tut; diğerinden `index.ts` re-export |
| Plan stub (`export {}`) | README'de "plan" olarak kalır; kod gelince doldur |
| Kilitli işlem dosyası | `kilit.py unlock` + şifre |

## Parça eşlemesi

```
islemler/XX-.../  →  mobil/ozellikler/XX-.../README.md  →  kaynak + bilesenler + app
```

## Önizleme (web)

```bash
cd mobil && npx expo start --web --port 8082
# tünel: cloudflared tunnel --url http://127.0.0.1:8082
```

## Son bakım notları

- **2026-08-26:** Özellik parçası iskeleti; besi-alim yinelemesi giderildi; hayvan `[id]/kilo` route çakışması düzeltildi; `index.ts` export'ları güncellendi.
