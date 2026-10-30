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

## Gerçek akışlar (PR #42, Ekim 2026)

Simülasyon yolları kaldırıldı; donanım/anahtar yoksa uygulama sahte veri üretmez, açık hata gösterir.

| Akış | Uygulama | Kod |
|------|----------|-----|
| RFID | Web Bluetooth BLE okuyucu (Nordic UART, HM-10, ISSC profilleri); ISO 11784 → TR küpe | `mobil/kaynak/rfid/` |
| OCR | Kamera görüntüsünden Tesseract.js ile küpe / sırt no okuma | `mobil/kaynak/ocr/` |
| Abonelik | RevenueCat IAP; anahtar yoksa "yapılandırılmamış" (paket açılmaz) | `mobil/kaynak/abonelik/` |
| TÜRKVET | CSV köprüsü (içe/dışa aktarım + doğrulama). Resmi API üçüncü taraflara açık değil | `mobil/kaynak/turkvet/` |

## Besi programı motoru

`mobil/kaynak/besi-programi/`: satış ufku (90 / 120 gün), görev zaman çizelgesi, rasyon dilimleri
(alıştırma 0–5, büyütme 6–30, bitirme 31–ufuk), maliyet/kâr tahmini. Hedef satış kilosu verilmezse
giriş kilosu + günlük 0,25 kg artış × ufuk kullanılır; başabaş ₺/kg, yem dönüşüm oranı, fire oranı ve dilim
bazlı yem dökümü hesaplanır.

## Yönetici paneli bayrakları

`/api/ozellik-bayraklar` (admin_ozellik_bayrak). Mobil `kaynak/urun/uzak-bayrak.ts` ile okur; uzak bayrak yalnız
**kapatabilir** (ör. `onerilen_saglik_plani`), yerel ürün kararını açamaz.

## İşlem takibi

`islemler/`: tüm maddeler DONE ya da gerekçeli ERTELENDI (TÜRKVET resmi API, ayrı sunucu projesi,
donanım sipariş ekranı, sürekli bakım, Vercel provisioning). `python3 islemler/scripts/kilit.py durum`.

## Test

```bash
cd mobil && npm test && npx tsc --noEmit
```
