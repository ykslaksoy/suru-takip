# 40 · Çevrimdışı çalışma (PWA)

**Nerede:** Her ekranda. Bağlantı kopunca altta "📴 Çevrimdışı · kayıtlar bu cihaza yazılıyor" çipi çıkar, geri gelince 4 sn "✅ Tekrar çevrimiçi" görünür. Daha sekmesinde "📴 İnternetsiz kullanıma hazır" satırı var. Yeni sürüm yayınlanınca "⬆️ Yeni sürüm hazır · Yenile" çipi çıkar.

## Nasıl çalışır
- Uygulama zaten **tüm veriyi cihazda** tutar (web: tarayıcı deposu + IndexedDB fotoğraflar, telefon: SQLite). Eksik olan uygulamanın kendisinin internetsiz açılmasıydı.
- **Service worker** (`/sw.js`) ilk açılışta uygulama kabuğunu önbelleğe alır: tüm sayfalar, JS paketi, görseller, kullanılan ikon fontları. Toplam ~108 dosya, ~6 MB, bir kez indirilir.
- Sayfa açılışı **önce ağ** (4 sn bekleme), olmazsa önbellek. Zayıf köy bağlantısında 4 sn sonra önbellekten açılır.
- `_expo/`, `assets/` dosyaları **önce önbellek** (adları içerik özetli, değişmez).
- Dinamik adresler (`/hayvan/<id>/soy` vb.) vercel.json yönlendirmeleriyle aynı şekilde `_id` kopyasına eşlenir. Hiç açılmamış kuzu sayfası da internetsiz açılır.
- Dış servislere (ör. isteğe bağlı vision API) dokunulmaz. Çevrimdışıyken vision isteği hiç denenmez (12 sn zaman aşımı beklenmez), yerel kural motoru hemen yanıt verir.
- Ana ekrana eklenebilir: `manifest.webmanifest` + 192/512 ikon, `display: standalone`.

## Sürüm / güncelleme
- `scripts/sw-olustur.js` her derlemede (Vercel buildCommand'ın son adımı) dosya listesini ve içerik özetinden **sürüm** üretir, `dist/sw.js`'ye yazar. Sürüm değişince eski önbellek silinir.
- Güncelleme sessizce indirilir. Açık sayfa kullanıcı "Yenile"ye basınca yeni sürüme geçer, form ortasında sayfa kendiliğinden yenilenmez.
- `sw.js` `no-cache` başlığıyla sunulur (vercel.json `headers`).

## Kod
- `scripts/sw-sablon.js` (service worker), `scripts/sw-olustur.js` (liste + sürüm), `public/manifest.webmanifest`, `public/ikon/*`.
- `kaynak/cevrimdisi/durum.ts` (bağlantı durumu deposu, `cevrimiciMi`), `kur.web.ts` (kayıt + online/offline), `kur.ts` (telefon: yok).
- `bilesenler/ortak/BaglantiSeridi.tsx` (çip + Daha satırı), `app/_layout.tsx`, `app/+html.tsx` (manifest bağlantısı).
- Test: `test/moduller/cevrimdisi.ts` (çip metinleri, SW adres eşleme, dinleyiciler).

## Doğrulama
Headless Chrome'da önce site açılıp önbellek dolduruldu. Sonra sunucuya erişim tamamen kesildi (yerelde sunucu durduruldu, canlıda alan adı çözümlemesi engellendi) ve ağ çevrimdışı yapıldı. Ana sayfa, Çiftleşme, Soy ağacı ve kuzu kartı açıldı, çevrimdışıyken ultrason kaydı girildi ve kaydedildi.

## Sınırlar
- Uygulama en az **bir kez internetle** açılmalı. Önbellek dolmadan bağlantı koparsa sayfa açılmaz, kısa bir uyarı gösterilir.
- iOS Safari ana ekrana eklenmemiş sitelerin depolamasını uzun süre kullanılmazsa silebilir. Ana ekrana ekleyip düzenli yedek (Excel, 34) önerilir.
- Bulut senkronu kapalı olduğundan "internet gelince gönderilecek" bir kuyruk yok: her şey zaten cihazda. Ağ kullanan tek özellik (isteğe bağlı vision) çevrimdışıyken atlanır.
- Telefon uygulamasında bağlantı çipi yok (NetInfo kurulu değil); orada zaten her şey yerel.
