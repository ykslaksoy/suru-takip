# SürüYön — Uygulama Ağacı

> Bu dosya **uygulama kod / ekran / modül** ağacıdır.  
> `islemler/` kural-tik sistemi burada değildir.

---

## 1) Şu anki uygulama (mevcut kod)

```
suruyon/
├── mobile/                          # Expo React Native uygulama
│   ├── app.json
│   ├── package.json
│   ├── tsconfig.json
│   │
│   ├── app/                         # Ekranlar (Expo Router)
│   │   ├── _layout.tsx              # Kök layout + provider
│   │   ├── +html.tsx
│   │   ├── +not-found.tsx
│   │   │
│   │   ├── (tabs)/                  # Alt sekmeler
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx            # Sürü listesi
│   │   │   ├── stock.tsx            # Stok
│   │   │   ├── health.tsx           # Sağlık özeti
│   │   │   ├── school.tsx           # Akıllı Kuzu (rehber / eğitim)
│   │   │   └── menu.tsx             # Menü
│   │   │
│   │   ├── animal/
│   │   │   ├── add.tsx              # Hayvan ekle
│   │   │   └── [id]/
│   │   │       ├── index.tsx        # Hayvan detay  (dosya: [id].tsx)
│   │   │       ├── weight.tsx       # Kilo / tartım
│   │   │       └── health.tsx       # Hayvan sağlık kayıtları
│   │   │
│   │   ├── ration.tsx               # Rasyon hesaplayıcı
│   │   ├── vet.tsx                  # Akıllı veteriner (semptom)
│   │   ├── subscription.tsx         # Abonelik
│   │   ├── beta.tsx                 # Beta pilot
│   │   ├── turkvet-export.tsx       # TÜRKVET export
│   │   └── wireframes.tsx           # Wireframe önizleme
│   │
│   ├── lib/                         # İş mantığı (şimdiki yer)
│   │   ├── types.ts
│   │   ├── database.ts              # barrel
│   │   ├── database.native.ts       # SQLite
│   │   ├── database.web.ts          # AsyncStorage
│   │   ├── seed.ts
│   │   ├── ai-vet.ts
│   │   ├── ration.ts
│   │   ├── education.ts
│   │   ├── subscription.ts
│   │   └── turkvet.ts
│   │
│   ├── components/
│   │   ├── AnimalCard.tsx
│   │   ├── WeightChart.tsx
│   │   ├── StockCard.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── PrimaryButton.tsx
│   │   └── …
│   │
│   ├── context/
│   │   ├── DatabaseContext.tsx
│   │   └── SubscriptionContext.tsx
│   │
│   ├── constants/
│   │   └── Colors.ts
│   │
│   └── assets/
│       ├── fonts/
│       └── images/
│
├── docs/                            # Ürün / tasarım dokümanları
│   ├── product/
│   │   ├── urun-modlari.md
│   │   ├── mod1-kuzu-alarak-besi.md
│   │   ├── mod2-koc-katarak-besi.md
│   │   ├── mod3-damizlik-kuzu.md
│   │   ├── mod4-sut-koyunculugu.md
│   │   ├── akilli-veteriner-koprusu.md
│   │   ├── offline-roller-rfid.md
│   │   └── puzzle-klasor-haritasi.md
│   ├── wireframes/
│   ├── validation/
│   ├── beta/
│   └── monetization/
│
├── server/                          # (henüz yok) bulut senkron API
└── hardware/                        # (henüz yok) RFID paket kataloğu
```

---

## 2) Hedef uygulama ağacı (puzzle modüller)

`mobile/lib/` → `mobile/src/` taşınınca uygulama şöyle olacak:

```
mobile/
├── app/                             # Sadece ekranlar (ince)
│   ├── (tabs)/
│   │   ├── index.tsx                # sürü
│   │   ├── stock.tsx
│   │   ├── health.tsx
│   │   ├── school.tsx
│   │   └── menu.tsx
│   ├── animal/…
│   ├── fattening/                   # Mod 1–2 rehber ekranları
│   │   ├── onboarding.tsx
│   │   ├── quarantine.tsx
│   │   ├── journey.tsx
│   │   ├── recommend.tsx
│   │   └── report.tsx
│   ├── chute/                       # Seri ahır modu
│   │   └── index.tsx
│   ├── vet.tsx
│   ├── vet/
│   │   ├── case/[id].tsx
│   │   └── inbox.tsx                # veteriner gelen kutusu
│   ├── dairy/                       # Mod 4 (sonra)
│   ├── excel.tsx
│   ├── roles.tsx
│   ├── rfid.tsx
│   ├── hardware.tsx
│   └── …
│
└── src/                             # Puzzle parçaları (kalın iş mantığı)
    ├── core/
    │   ├── db/
    │   ├── sync/
    │   ├── auth/
    │   ├── roles/
    │   ├── api/
    │   ├── types/
    │   └── ui/
    ├── flock/                       # Sürü / ağıl / padok
    ├── weight/                      # Tartım / ADG
    ├── health/                      # Hastalık / aşı / bekletme
    ├── stock/                       # Yem / aşı / ilaç stok
    ├── ration/                      # Rasyon
    ├── school/                      # Eğitim
    ├── vetAI/                       # Foto + semptom AI
    ├── vetBridge/                   # Gerçek veterinere gönder
    ├── fatteningShared/             # Karantina, FCR, öneri, seri
    ├── fatteningBuy/                # Mod 1 — kuzu alarak besi
    ├── fatteningBreed/              # Mod 2 — koç katarak besi
    ├── breedingStock/               # Mod 3 — damızlık
    ├── dairy/                       # Mod 4 — süt
    ├── excel/
    ├── ocr/
    ├── rfid/
    ├── voice/
    ├── turkvet/
    ├── billing/
    ├── hardware/
    └── beta/
```

---

## 3) Ürün modları (uygulama menüsü)

```
Uygulama açılışı
├── [1] Kuzu alarak besi kuzuculuğu          → fatteningBuy/
├── [2] Koç katarak besi kuzuculuğu          → fatteningBreed/
├── [3] Damızlık kuzu yetiştiriciliği        → breedingStock/
└── [4] Süt koyunculuğu                      → dairy/
```

---

## 4) Sekmeler (kullanıcı arayüzü)

```
(tabs)
├── Sürü      → flock + animal ekranları
├── Stok      → stock
├── Sağlık    → health (+ vet AI girişi)
├── Akıllı Kuzu → school
│     Süper Kuzu önerileri (eğitim buraya yedirilir, ders listesi yok)
└── Menü      → rasyon, abonelik, roller, donanım, export…
```
