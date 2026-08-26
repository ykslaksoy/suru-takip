# SürüYön — Koyun/Kuzu Sürü Takip Uygulaması

Türkiye odaklı, offline-first koyun/keçi ağıl yönetim uygulaması.

## İşlem tik listesi

Her iş **ayrı dosya**. Tamamlanınca `[x]` + şifre kilidi.

```bash
python3 islemler/scripts/kilit.py unlock <dosya.md>
python3 islemler/scripts/kilit.py kilitle <dosya.md>
```

→ **[islemler/INDEX.md](islemler/INDEX.md)**

## Kurulum

```bash
cd mobil
npm install
npm run web
npm run android
npm run ios
```

## Proje yapısı

```
dokumanlar/     — ürün, doğrulama, ekran taslakları
mobil/          — Expo React Native uygulama
islemler/       — tik + şifre kilidi
araclar/        — yardımcı scriptler
```

Kanonik ağaç: `dokumanlar/urun/uygulama-agaci.md`

## Abonelik

| Paket | Fiyat | Limit |
|-------|-------|-------|
| Ücretsiz | 0 | 30 hayvan |
| Çiftçi | 1.490 TL/yıl | 200 hayvan |
| Profesyonel | 3.490 TL/yıl | 1.000 hayvan |

## Lisans

Proprietary — SürüYön
