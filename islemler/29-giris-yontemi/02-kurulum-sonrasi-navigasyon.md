---
status: TODO
kilitli: false
---

# Giriş yöntemi kurulumu — kayıt sonrası ana uygulamaya geçiş

**Klasör:** `29-giris-yontemi`  
**Rapor:** Yüksel — kurulum kaydından sonra uygulama başlamıyor (PR #25)

## Kök neden

Kurulum tamamlandığında iki olay aynı anda tetikleniyordu:

1. `kurulumTamamla` → AsyncStorage'a yaz + `setTercih` (React state güncellemesi asenkron)
2. `router.replace('/(tabs)')` → ana sekmelere geçiş

`(tabs)/_layout` içindeki `GirisYontemiKurulumYonlendirici`, mount olduğunda context'teki `tercih.kurulumTamam` hâlâ `false` olabiliyordu. Yönlendirici hemen `/giris-yontemi/kurulum`'a geri gönderiyordu — kullanıcı «Kaydet ve başla» sonrası ana uygulamaya geçemiyordu.

## Düzeltme

1. **`GirisYontemiKurulumYonlendirici`** — context `false` olsa bile `girisYontemiKurulumTamamMi()` ile AsyncStorage doğrulanır; kalıcı kayıt tamamsa geri yönlendirme yapılmaz.
2. **`app/giris-yontemi/kurulum.tsx`** — `router.replace` doğrudan `onKaydet` içinde değil; `tercih.kurulumTamam === true` olduktan sonra `useEffect` ile çalışır.

## Test

```bash
cd mobil && npm test
```

Yeni doğrulamalar: `mobil/test/moduller/giris-yontemi.ts` (depo doğrulama + context sonrası navigasyon).

## Dosyalar

- `mobil/bilesenler/giris-yontemi/GirisYontemiKurulumYonlendirici.tsx`
- `mobil/app/giris-yontemi/kurulum.tsx`
- `mobil/test/moduller/giris-yontemi.ts`
