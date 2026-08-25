# SürüYön — Koyun/Kuzu Sürü Takip Uygulaması

Türkiye odaklı, offline-first koyun/kuzu sürü yönetim uygulaması.

## Özellikler

### MVP (Faz 1)
- Sürü kartı (küpe, TÜRKVET, GEKİS, ırk, padok)
- Kilo takibi + ADG grafiği
- Hastalık/tedavi/aşı kayıtları + bekletme süresi
- Yem/aşı/ilaç stok takibi + düşük stok uyarısı
- Offline SQLite + senkron kuyruğu

### v1.0+
- Rasyon hesaplayıcı
- Freemium abonelik (simülasyon)

### v1.5
- Akıllı veteriner asistanı (semptom yönlendirme)
- Sürü Okulu mikro eğitimler

### v2.0 hazırlık
- TÜRKVET/GEKİS export
- Resmi kayıt alanları

## Kurulum

```bash
cd mobile
npm install
npm run web    # tarayıcıda test
npm run android
npm run ios
```

## Proje yapısı

```
docs/validation/     — Faz 0 görüşme rehberi, anket, doğrulama raporu
docs/wireframes/     — 5 ana ekran wireframe
mobile/              — Expo React Native uygulaması
```

## Abonelik paketleri

| Paket | Fiyat | Limit |
|-------|-------|-------|
| Ücretsiz | 0 | 30 hayvan |
| Çiftçi | 1.490 TL/yıl | 200 hayvan |
| Profesyonel | 3.490 TL/yıl | 1.000 hayvan |

## Beta pilot

Menü → Beta Pilot: 50 çiftlik kayıt ve geri bildirim modülü.

## Lisans

Proprietary — SürüYön
