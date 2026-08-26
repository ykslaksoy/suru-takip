# SürüYön — Uygulama / İşlem Ağacı

`[x]` = tamam + şifre kilidi · `[ ]` = yapılacak

HTML panel: [`rapor/index.html`](./rapor/index.html)

```
suruyon/
└── islemler/
    ├── 00-kural/
    │   ├── [x] 00-okuma-kurali.md 🔒  — İşlem dosyası kuralları (şifre kilidi)
    │   ├── [x] 01-sifre-kilit-script.md 🔒  — Şifre kilit scripti (kilit.py)
    │   └── [x] 02-html-rapor-sistemi.md 🔒  — Tamamlanınca HTML rapor üretimi
    ├── 01-dogrulama/
    │   ├── [x] 01-gorusme-rehberi.md 🔒  — Çiftçi/vet görüşme rehberi
    │   ├── [x] 02-anket-formu.md 🔒  — Anket formu
    │   └── [x] 03-dogrulama-raporu.md 🔒  — Faz 0 doğrulama raporu
    ├── 02-wireframe/
    │   └── [x] 01-bes-ana-ekran.md 🔒  — 5 ana ekran wireframe
    ├── 03-core/
    │   ├── [x] 01-tipler.md 🔒  — Ortak TypeScript tipleri
    │   ├── [x] 02-sqlite-native.md 🔒  — SQLite veritabanı (native)
    │   ├── [x] 03-asyncstorage-web.md 🔒  — Web depolama
    │   ├── [x] 04-demo-seed.md 🔒  — Demo veri yükleme
    │   ├── [x] 05-tema-renkler.md 🔒  — Tema / renkler
    │   ├── [x] 06-ui-buton-banner.md 🔒  — UI: buton + offline banner
    │   └── [x] 07-context-db.md 🔒  — DatabaseContext
    ├── 04-suru/
    │   ├── [x] 01-suru-listesi.md 🔒  — Sürü listesi ekranı
    │   ├── [x] 02-hayvan-karti.md 🔒  — Hayvan kartı bileşeni
    │   ├── [x] 03-hayvan-ekle.md 🔒  — Hayvan ekleme formu
    │   ├── [x] 04-hayvan-detay.md 🔒  — Hayvan detay ekranı
    │   ├── [ ] 05-koyun-keci-tur.md  — Tür alanı koyun/keçi
    │   └── [ ] 06-padok-agil.md  — Padok / ağıl grup yönetimi
    ├── 05-kilo/
    │   ├── [x] 01-tartim-kaydi.md 🔒  — Tartım kaydı ekleme
    │   ├── [x] 02-tartim-grafigi.md 🔒  — Tartım grafik bileşeni
    │   ├── [x] 03-adg-hesap.md 🔒  — ADG (g/gün) hesaplama
    │   └── [ ] 04-fcr-hesap.md  — FCR (kg yem / kg artış)
    ├── 06-saglik/
    │   ├── [x] 01-saglik-kaydi.md 🔒  — Hastalık/tedavi/aşı kaydı
    │   ├── [x] 02-bekletme-suresi.md 🔒  — Bekletme süresi uyarısı
    │   └── [ ] 03-asi-takvimi.md  — Aşı takvimi + hatırlatıcı
    ├── 07-stok/
    │   ├── [x] 01-stok-listesi.md 🔒  — Stok listesi + filtre
    │   ├── [x] 02-stok-giris-cikis.md 🔒  — Stok giriş/çıkış
    │   └── [x] 03-dusuk-stok-uyari.md 🔒  — Düşük stok uyarısı
    ├── 08-rasyon/
    │   ├── [x] 01-rasyon-hesaplayici.md 🔒  — Temel rasyon hesaplayıcı
    │   ├── [ ] 02-kullanici-rasyon-girisi.md  — Kullanıcı kendi rasyonunu girer
    │   ├── [ ] 03-akilli-rasyon-oneri.md  — Akıllı rasyon önerisi (hedef/süre/maliyet/kâr)
    │   └── [ ] 04-oneri-vs-gercek.md  — Öneri vs gerçek karşılaştırma
    ├── 09-okul/
    │   ├── [x] 01-mikro-dersler.md 🔒  — Sürü Okulu mikro dersler
    │   ├── [ ] 02-besi-dersleri.md  — Mode 1 özel besi dersleri
    │   └── [ ] 03-profesyonel-sertifika.md  — Profesyonel besici yolu
    ├── 10-vet-ai/
    │   ├── [x] 01-semptom-analiz.md 🔒  — Semptom → AI öneri (metin)
    │   ├── [x] 02-disclaimer.md 🔒  — Tıbbi sorumluluk reddi
    │   ├── [ ] 03-fotograf-yukle.md  — Hastalık fotoğrafı çek/yükle
    │   └── [ ] 04-ise-yaradi-geri-bildirim.md  — İşe yaradı / yaramadı geri bildirimi
    ├── 11-vet-kopru/
    │   ├── [ ] 01-vaka-paketi.md  — Veterinere gidecek vaka paketi
    │   ├── [ ] 02-veterinere-gonder.md  — Gerçek veterinere gönder butonu
    │   ├── [ ] 03-vet-inbox.md  — Veteriner gelen kutusu
    │   └── [ ] 04-vet-talimat.md  — Veteriner talimatı + takip
    ├── 12-abonelik/
    │   ├── [x] 01-freemium-limit.md 🔒  — Freemium hayvan limiti
    │   ├── [x] 02-abonelik-ekrani.md 🔒  — Abonelik paket ekranı
    │   └── [ ] 03-gercek-iap.md  — App Store / Play Store gerçek IAP
    ├── 13-turkvet/
    │   ├── [x] 01-alan-dogrulama.md 🔒  — TÜRKVET / GEKİS alan doğrulama
    │   ├── [x] 02-json-export.md 🔒  — TÜRKVET JSON export
    │   └── [ ] 03-resmi-bildirim-api.md  — Otomatik resmi bildirim API
    ├── 14-offline-senkron/
    │   ├── [x] 01-yerel-kayit.md 🔒  — İnternetsiz yerel kayıt
    │   ├── [x] 02-senkron-kuyrugu.md 🔒  — Senkron kuyruk iskeleti
    │   ├── [ ] 03-sunucu-senkron.md  — Gerçek sunucu push/pull senkron
    │   └── [ ] 04-server-projesi.md  — server/ klasörü + API
    ├── 15-roller/
    │   ├── [ ] 01-rol-tipleri.md  — Roller: sahip/ortak/vet/çoban
    │   ├── [ ] 02-davet-sistemi.md  — Kullanıcı davet et
    │   └── [ ] 03-yetki-kontrolu.md  — Ekran bazlı yetki kontrolü
    ├── 16-excel/
    │   ├── [ ] 01-sablon-indir.md  — Excel şablon indir
    │   ├── [ ] 02-excel-ice-aktar.md  — Excel'den hayvan girişi
    │   └── [ ] 03-excel-disa-aktar.md  — Excel'e liste verme
    ├── 17-seri-giris/
    │   ├── [ ] 01-ahir-modu-iskelet.md  — Seri ahır modu iskelet ekranı
    │   ├── [ ] 02-seri-asi.md  — Seri aşılama
    │   └── [ ] 03-seri-tartim.md  — Seri tartım
    ├── 18-rfid/
    │   ├── [ ] 01-ble-okuyucu.md  — Bluetooth RFID okuyucu bağlama
    │   └── [ ] 02-etiket-hayvan-esleme.md  — RFID etiket → hayvan eşleme
    ├── 19-ocr/
    │   ├── [ ] 01-kupe-ocr.md  — Kulak küpesi foto OCR
    │   └── [ ] 02-sirt-no-ocr.md  — Sırt numarası foto OCR
    ├── 20-ses/
    │   └── [ ] 01-sesli-komut.md  — Sesli komut ile kayıt
    ├── 21-donanim/
    │   ├── [ ] 01-katalog.md  — RFID küpe/okuyucu katalog
    │   └── [ ] 02-paket-siparis.md  — Donanım paket sipariş ekranı
    ├── 22-mod1-kuzu-alarak-besi/
    │   ├── [x] 00-urun-dokumani.md 🔒  — Mod 1 ürün dokümanı
    │   ├── [ ] 01-mod-secim-ekrani.md  — Ana menü 4 mod seçimi
    │   ├── [ ] 02-oncelik-karti.md  — Bugün ne yapmalısın? öncelik kartı
    │   ├── [ ] 03-alim-girisi.md  — Kuzu alım / sisteme giriş
    │   ├── [ ] 04-karantina-yonca-su.md  — Karantina: yonca + su kontrol
    │   ├── [ ] 05-adim-kilidi.md  — Adım kilidi (0→8 journey)
    │   ├── [ ] 06-besi-metrik-raporu.md  — ADG+FCR+kâr rapor ekranı
    │   └── [ ] 07-profesyonel-gecis.md  — Profesyonel besi moda geçiş
    ├── 23-mod2-koc-katarak-besi/
    │   ├── [x] 00-urun-dokumani.md 🔒  — Mod 2 ürün dokümanı
    │   ├── [ ] 01-koc-katim.md  — Koç katım planı
    │   ├── [ ] 02-kuzulatma.md  — Kuzulatma kaydı
    │   └── [ ] 03-besiye-aktar.md  — Kuzuyu besi akışına aktar
    ├── 24-mod3-damizlik/
    │   ├── [x] 00-urun-dokumani.md 🔒  — Mod 3 ürün dokümanı
    │   ├── [ ] 01-secilim-secim.md  — Damızlık seleksiyon
    │   └── [ ] 02-secere.md  — Şecere anne/baba
    ├── 25-mod4-sut/
    │   ├── [x] 00-urun-dokumani.md 🔒  — Mod 4 süt ürün dokümanı
    │   ├── [ ] 01-sagim-kaydi.md  — Sağım litre kaydı
    │   ├── [ ] 02-laktasyon.md  — Laktasyon dönemi
    │   └── [ ] 03-cogaltma-yonlendirme.md  — Kuzulatma + çoğaltma yönlendirme
    ├── 26-beta/
    │   ├── [x] 01-pilot-dokuman.md 🔒  — Beta pilot program dokümanı
    │   └── [x] 02-beta-kayit-ekrani.md 🔒  — Beta kayıt + geri bildirim ekranı
    └── 27-puzzle-refactor/
        ├── [x] 01-puzzle-harita-dokuman.md 🔒  — Puzzle klasör haritası dokümanı
        ├── [ ] 02-lib-to-src-tasi.md  — mobil/kaynak → mobile/src puzzle taşıma
        ├── [x] 03-offline-roller-rfid-dokuman.md 🔒  — Offline+roller+RFID dokümanı
        └── [x] 04-vet-kopru-dokuman.md 🔒  — Akıllı vet köprüsü dokümanı
```

**Tamam (kilitli):** 45 · **Açık:** 51 · **Toplam:** 96
