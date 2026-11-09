# t393 — SW / bundle güncelleme yolu (iPhone eski JS)

**Durum:** kod hazır, PR bekliyor.

**Sorun:** Prod bundle yeni (Tekrar dene, `henüz açık değil` yok); Safari’de çok sekme + eski SW `controllerchange` yenilemesi `bekleyen` olmadan atlanıyor; `/_expo/static/js` önbellek-önce.

**Çözüm:**
- `kur.web.ts`: her `controllerchange` → tam sayfa yenile; `updateViaCache: 'none'`; bekleyen SW’ye otomatik `SKIP_WAITING`
- `surum.json` + `surum-kontrol.ts` → `sy_web_surum_v1` karşılaştırması, alt çip **Yeni sürüm — yenile**
- `sw-sablon.js`: Expo JS ağ-önce (`bundleAgOnce`)
- `vercel.json`: `surum.json`, `/`, `index.html` no-cache

**Veri:** IndexedDB / localStorage silinmez.

**Manuel (iOS):** Tek sekmede adres çubuğundan yenile veya alt çipte **Yeni sürüm — yenile**. **Ayarlar → Safari → Web Sitesi Verilerini Temizle kullanmayın** — yerel kayıtlar silinir.
