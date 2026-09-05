# SürüYön — Koyun/Kuzu Sürü Takip Uygulaması

Türkiye odaklı, offline-first koyun/keçi ağıl yönetim uygulaması.

## 5 adımda günlük kullanım

1. **Sürü** sekmesinde **+ Ekle** ile hayvan ekleyin (küpe zorunlu; padok seçin).
2. Hayvana dokunun → **Kilo Takibi** ile günlük tartım girin.
3. Aynı detaydan **Sağlık** ile aşı / hastalık kaydı ekleyin; **Stok** sekmesinden yem ve aşı stokunu güncelleyin.
4. Dişi hayvanda **Gebe işaretle** veya **Doğum kaydı** ile kuzu(lar)ı ekleyin (anne otomatik bağlanır, durum sağmal olur).
5. **Ayarlar** → **Sürü özet raporu (CSV)** ile padok/durum/aşı özetini Excel’de açın (veya hayvan listesi CSV).

Ahırda hızlı yol: Ana ekrandan **Seri ahır** veya **Sesli komut**; karar desteği için **Akıllı Kuzu**.

## Kurulum

```bash
cd mobil
npm install
npm run web
npm run android
npm run ios
```

Test: `cd mobil && npm run test`

## İşlem tik listesi

Her iş **ayrı dosya**. Tamamlanınca `[x]` + şifre kilidi.

```bash
python3 islemler/scripts/kilit.py unlock <dosya.md>
python3 islemler/scripts/kilit.py kilitle <dosya.md>
```

→ **[islemler/INDEX.md](islemler/INDEX.md)**

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
