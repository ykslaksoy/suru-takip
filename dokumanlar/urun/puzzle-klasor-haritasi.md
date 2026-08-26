# SürüYön — Puzzle Klasör Haritası

Her özellik bir **puzzle parçası**. Parçalar birbirine sadece `core` üzerinden bağlanır; bir parçayı çıkarınca diğerleri kırılmaz.

```
                    ┌─────────────┐
                    │   shell     │  ← uygulama kabuğu (tabs, tema)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐   ┌────────┐   ┌────────┐
         │ flock  │──▶│  core  │◀──│ health │
         └────────┘   │ sync   │   └────────┘
         ┌────────┐   │ auth   │   ┌────────┐
         │ weight │──▶│ roles  │◀──│ stock  │
         └────────┘   │ db     │   └────────┘
         ┌────────┐   └────┬───┘   ┌────────┐
         │ ration │────────┤       │ school │
         └────────┘        │       └────────┘
         ┌────────┐   ┌────▼───┐   ┌────────┐
         │  excel │──▶│  api   │◀──│  vetAI │
         └────────┘   └────┬───┘   └────────┘
         ┌────────┐        │       ┌────────┐
         │   ocr  │────────┤       │  rfid  │
         └────────┘        │       └────────┘
         ┌────────┐   ┌────▼───┐   ┌────────┐
         │ voice  │──▶│ store  │◀──│hardware│
         └────────┘   └────────┘   └────────┘
                           │
                      ┌────▼────┐
                      │ turkvet │
                      └─────────┘
```

---

## Kök yapı

```
suruyon/
├── README.md
├── docs/                          # iş + ürün dokümanları
├── packages/                      # (ileride monorepo) paylaşılan tip/şema
├── mobile/                        # Expo React Native uygulaması
├── server/                        # bulut API + senkron
└── hardware/                      # RFID paket katalog / sipariş dokümanı
```

---

## 1. `dokumanlar/` — Doküman puzzle’ları

```
docs/
├── validation/                    # Faz 0
│   ├── gorusme-rehberi.md
│   ├── anket-formu.md
│   └── dogrulama-raporu.md
├── wireframes/
│   └── ekran-tasarimlari.md
├── product/
│   ├── offline-roller-rfid.md     # offline + roller + donanım
│   ├── puzzle-klasor-haritasi.md  # BU DOSYA
│   └── urun-cumlesi.md            # (opsiyonel) tek cümle konumlandırma
├── beta/
│   └── pilot-programi.md
└── monetization/
    └── iap-integration.md
```

---

## 2. `mobil/` — Uygulama (puzzle parçaları)

```
mobile/
├── app.json
├── package.json
├── app/                           # Expo Router ekranları
│   ├── _layout.tsx                # kabuk: provider + stack
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx              # → flock
│   │   ├── stock.tsx              # → stock
│   │   ├── health.tsx             # → health
│   │   ├── school.tsx             # → school
│   │   └── menu.tsx               # → shell menü
│   ├── animal/
│   │   ├── add.tsx
│   │   └── [id]/
│   │       ├── index.tsx          # hayvan detay (flock)
│   │       ├── weight.tsx         # → weight
│   │       └── health.tsx         # → health
│   ├── ration.tsx                 # → ration
│   ├── vet.tsx                    # → vetAI
│   ├── subscription.tsx           # → billing
│   ├── beta.tsx
│   ├── turkvet-export.tsx         # → turkvet
│   ├── excel.tsx                  # → excel (yeni)
│   ├── roles.tsx                  # → roles davet (yeni)
│   ├── rfid.tsx                   # → rfid (yeni)
│   ├── hardware.tsx               # → hardware mağaza (yeni)
│   └── voice.tsx                  # → voice (yeni)
│
├── src/                           # ★ PUZZLE PARÇALARI BURADA
│   │
│   ├── core/                      # ÇERÇEVE (herkes buna bağlanır)
│   │   ├── db/
│   │   │   ├── database.native.ts
│   │   │   ├── database.web.ts
│   │   │   ├── schema.ts          # tablo tanımları
│   │   │   └── seed.ts
│   │   ├── sync/
│   │   │   ├── syncQueue.ts       # offline kuyruk
│   │   │   ├── syncEngine.ts      # internet gelince gönder/çek
│   │   │   └── conflict.ts        # çakışma çözümü
│   │   ├── auth/
│   │   │   ├── session.ts
│   │   │   └── token.ts
│   │   ├── roles/
│   │   │   ├── types.ts           # owner | partner | vet | shepherd
│   │   │   ├── permissions.ts     # rol → yetki matrisi
│   │   │   └── invite.ts          # davet kodu
│   │   ├── api/
│   │   │   ├── client.ts          # HTTP istemci
│   │   │   └── endpoints.ts
│   │   ├── types/
│   │   │   └── index.ts           # paylaşılan tipler
│   │   └── ui/
│   │       ├── PrimaryButton.tsx
│   │       ├── OfflineBanner.tsx
│   │       └── theme.ts           # Colors
│   │
│   ├── flock/                     # PARÇA 1 — Sürü / ağıl
│   │   ├── AnimalCard.tsx
│   │   ├── animalRepo.ts          # CRUD
│   │   ├── paddock.ts             # padok / ağıl grupları
│   │   └── species.ts             # koyun | keçi
│   │
│   ├── weight/                    # PARÇA 2 — Kilo
│   │   ├── WeightChart.tsx
│   │   ├── weightRepo.ts
│   │   └── adg.ts                 # günlük kilo artışı
│   │
│   ├── health/                    # PARÇA 3 — Hastalık / tedavi / aşı
│   │   ├── healthRepo.ts
│   │   ├── vaccineSchedule.ts     # aşı takvimi
│   │   ├── withdrawal.ts          # bekletme süresi
│   │   └── reminders.ts           # hatırlatıcı
│   │
│   ├── stock/                     # PARÇA 4 — Yem / aşı / ilaç stok
│   │   ├── StockCard.tsx
│   │   ├── stockRepo.ts
│   │   └── lowStock.ts
│   │
│   ├── ration/                    # PARÇA 5 — Rasyon
│   │   └── calculate.ts
│   │
│   ├── school/                    # PARÇA 6 — Akıllı Kuzu (rehber)
│   │   └── lessons.ts
│   │
│   ├── vetAI/                     # PARÇA 7 — Akıllı veteriner
│   │   ├── analyze.ts
│   │   ├── disclaimer.ts
│   │   ├── photoCapture.ts        # hastalık fotoğrafı
│   │   ├── casePack.ts            # vet'e gidecek paket
│   │   └── feedback.ts            # işe yaradı / yaramadı
│   │
│   ├── vetBridge/                 # PARÇA 7b — Gerçek veteriner köprüsü
│   │   ├── sendCase.ts
│   │   ├── vetInbox.ts
│   │   ├── instructions.ts
│   │   └── caseThread.ts
│   │
│   ├── excel/                     # PARÇA 8 — Excel giriş/çıkış
│   │   ├── importAnimals.ts
│   │   ├── exportAnimals.ts
│   │   ├── exportVaccines.ts
│   │   └── template.xlsx          # (veya assets/)
│   │
│   ├── ocr/                       # PARÇA 9 — Fotoğrafla küpe / sırt no
│   │   ├── earTagOcr.ts
│   │   ├── backNumberOcr.ts
│   │   └── cameraCapture.ts
│   │
│   ├── rfid/                      # PARÇA 10 — RFID okuyucu
│   │   ├── bleReader.ts           # Bluetooth
│   │   ├── tagMap.ts              # etiket → hayvan
│   │   └── chuteMode.ts           # seri / ahır modu
│   │
│   ├── voice/                     # PARÇA 11 — Sesli komut
│   │   ├── speechToText.ts
│   │   └── commandParser.ts       # "küpe 1234, 68 kilo"
│   │
│   ├── turkvet/                   # PARÇA 12 — Resmi kayıt
│   │   ├── validate.ts
│   │   ├── exportJson.ts
│   │   └── gehisFields.ts
│   │
│   ├── billing/                   # PARÇA 13 — Abonelik
│   │   ├── subscription.ts
│   │   ├── limits.ts
│   │   └── iap.ts                 # store ödemesi
│   │
│   ├── hardware/                  # PARÇA 14 — Donanım satışı
│   │   ├── catalog.ts             # küpe, okuyucu, paket
│   │   ├── order.ts
│   │   └── partnerLinks.ts
│   │
│   └── beta/                      # PARÇA 15 — Pilot
│       ├── signup.ts
│       └── feedback.ts
│
├── assets/
│   ├── fonts/
│   ├── images/
│   └── templates/
│       └── hayvan-import.xlsx
│
└── context/                       # React context (core bağları)
    ├── DatabaseContext.tsx
    ├── SyncContext.tsx            # (yeni) online/offline durum
    ├── AuthContext.tsx            # (yeni)
    ├── RoleContext.tsx            # (yeni)
    └── SubscriptionContext.tsx
```

---

## 3. `server/` — Bulut (senkron + roller)

```
server/
├── package.json
├── src/
│   ├── index.ts
│   ├── core/
│   │   ├── db.ts                  # PostgreSQL
│   │   ├── auth.ts
│   │   └── sync/
│   │       ├── push.ts            # cihaz → sunucu
│   │       ├── pull.ts            # sunucu → cihaz
│   │       └── conflicts.ts
│   ├── flock/
│   │   └── animals.routes.ts
│   ├── health/
│   │   └── health.routes.ts
│   ├── stock/
│   │   └── stock.routes.ts
│   ├── roles/
│   │   ├── invite.routes.ts
│   │   └── members.routes.ts
│   ├── billing/
│   │   └── webhooks.ts
│   └── hardware/
│       └── orders.routes.ts
└── prisma/                        # veya drizzle
    └── schema.prisma
```

---

## 4. `hardware/` — Donanım kataloğu (satış)

```
hardware/
├── README.md                      # paketler, fiyat, kurulum
├── packages/
│   ├── starter-100.md             # 100 küpe + okuyucu
│   ├── starter-300.md
│   └── scale-rfid.md              # tartım (ileri)
└── partners/
    └── entegrasyon.md             # BLE protokol notları
```

---

## Puzzle kuralları (özet)

| Kural | Anlamı |
|-------|--------|
| **1 parça = 1 klasör** | `weight/`, `rfid/`, `excel/`… |
| **Çekirdeğe bağlan** | Parçalar birbirine değil, `core/`’a yazar |
| **Ekran ince, iş mantığı kalın** | `app/*.tsx` sadece UI; iş `src/<parça>/` içinde |
| **Çıkarılabilir** | OCR’ı silersen flock çalışmaya devam eder |
| **Sıra** | Önce core+sync+flock → health/stock → excel → roles → rfid → ocr/voice → turkvet |

---

## Geliştirme sırası (puzzle montajı)

```
1. core (db + sync + auth + roles iskeleti)
2. flock + weight + health + stock
3. Mod 1 fatteningBuy + fatteningShared   ← ŞİMDİ (kuzu alarak besi)
4. vetAI + vetBridge
5. Mod 2 fatteningBreed (koç kat → besi)
6. Mod 3 breedingStock (damızlık)
7. Mod 4 dairy (süt koyunculuğu)
8. excel + billing + rfid + ocr + voice + turkvet
```

Ürün modları: `dokumanlar/urun/urun-modlari.md`

> Not: `vetBridge` için ağılda **Veteriner rolü daveti** gerekir.

---

## Mevcut kod → puzzle eşlemesi

| Şimdi | Puzzle parçası |
|-------|----------------|
| `mobil/kaynak/database.*` | `src/core/db/` |
| `mobil/kaynak/types.ts` | `src/core/types/` |
| `mobil/kaynak/subscription.ts` | `src/billing/` |
| `mobil/kaynak/ai-vet.ts` | `src/vetAI/` |
| `mobil/kaynak/ration.ts` | `src/ration/` |
| `mobil/kaynak/education.ts` | `src/school/` |
| `mobil/kaynak/turkvet.ts` | `src/turkvet/` |
| `mobil/kaynak/seed.ts` | `src/core/db/seed.ts` |
| `mobil/bilesenler/AnimalCard` | `src/flock/` |
| `mobil/bilesenler/WeightChart` | `src/weight/` |
| `mobil/bilesenler/StockCard` | `src/stock/` |
| `mobil/bilesenler/OfflineBanner` | `src/core/ui/` |

> Not: Kod hâlâ `mobil/kaynak/` altında. Bu harita **hedef düzen**; taşıma ayrı bir refactor sprint’idir.
