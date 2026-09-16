---
status: TODO
kilitli: false
---

# Kuzu seçim + tartım giriş — tek kurulum, her yerde aynı

**Klasör:** `29-giris-yontemi`  
**Kod:** `mobil/kaynak/giris-yontemi/`, `mobil/app/giris-yontemi/`

## Kapsam (kilit 2026-09-16)

### Kuzu seçim — tüm yöntemler
1. Otomatik tanıma
2. Manuel seçim
3. Küpe OCR
4. RFID
5. Sırt no OCR
6. Sesle numara

### Tartım giriş — «son tartım kopyala» hariç
1. Manuel
2. Baskülden okuma (Bluetooth/USB/serial)
3. Sesle kilo
4. Baskül ekranı OCR
5. Toplu CSV
6. IoT/API (stub/kapalı)

## Ne yapıldı
- AsyncStorage tercih: `sy_giris_yontemi_tercih`
- `GirisYontemiProvider` + kurulum yönlendirici (ilk açılış)
- Ayarlar → «Kuzu seçim & tartım girişi»
- `KuzuSecimPaneli` / `TartimGirisPaneli` — akışlarda kayıtlı yöntem
- Entegrasyon: hızlı kuzu tek-form, hayvan ekle, kilo tartım, seri ahır
- Test modülü: `mobil/test/moduller/giris-yontemi.ts`

## Stub / yakında
- Baskül, baskül OCR, toplu CSV, IoT/API → «yakında» banner + manuel yedek

## Doğrulama
```bash
cd mobil && npm test
```
