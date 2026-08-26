# App Store / Play Store Abonelik Entegrasyonu

## Mevcut durum
- Freemium paket mantığı `lib/subscription.ts` içinde simüle edilmiştır
- Hayvan limiti `SubscriptionContext` ile uygulanır
- Production için `expo-in-app-purchases` veya RevenueCat önerilir

## Ürün ID'leri (önerilen)

| Paket | iOS Product ID | Android Product ID |
|-------|----------------|-------------------|
| Çiftçi Aylık | com.suruyon.farmer.monthly | farmer_monthly |
| Çiftçi Yıllık | com.suruyon.farmer.yearly | farmer_yearly |
| Profesyonel Aylık | com.suruyon.pro.monthly | pro_monthly |
| Profesyonel Yıllık | com.suruyon.pro.yearly | pro_yearly |

## Entegrasyon adımları
1. App Store Connect + Google Play Console'da abonelik ürünleri oluştur
2. `eas build` ile production build al
3. `purchaseSubscription()` içinde simülasyonu gerçek IAP ile değiştir
4. Makbuz doğrulama (RevenueCat veya backend webhook)

## Fiyatlandırma (TL)
- Çiftçi: 149 TL/ay, 1.490 TL/yıl
- Profesyonel: 349 TL/ay, 3.490 TL/yıl
