# Ürün Modları — Doğru Sınıflandırma

> Önceki “Mode 2 = süt” tanımı **yanlıştı**; bu doküman geçerli kaynaktır.

---

## Ana menü: Ne yapmak istiyorsun?

### A) Besi / damızlık hattı (3 mod)

| # | Mod | Kısa tanım |
|---|-----|------------|
| **1** | **Kuzu alarak besi kuzuculuğu** | 2–2,5 / ~3 aylık kuzu **satın al** → karantina → aşı → tartım → rasyon → satış/kesim |
| **2** | **Koyundan koç katarak besi kuzuculuğu** | Kendi koyununa **koç kat** → kuzulat → kuzuları **besiye** al (iç üretim + besi) |
| **3** | **Damızlık kuzu yetiştiriciliği** | Üstün genotip / damızlık amaçlı kuzu yetiştir; seçilim, şecere, satışa damızlık |

### B) Ayrı ürün hattı

| Mod | Kısa tanım |
|-----|------------|
| **Süt koyunculuğu** | Sağmal sürü; **kuzulatma + çoğaltma + akıllı yönlendirme** + sağım / laktasyon |

Süt, 1–2–3’ün yerine geçmez; **dördüncü ana seçenek** (veya üst menüde ayrı kart).

```
┌─────────────────────────────────────────┐
│           SürüYön — Ağıl                │
├─────────────────────────────────────────┤
│  [1] Kuzu al → Besi                     │
│  [2] Koç kat → Kuzulat → Besi           │
│  [3] Damızlık kuzu yetiştiriciliği      │
│  [4] Süt koyunculuğu                    │
└─────────────────────────────────────────┘
```

---

## Mod 1 — Kuzu alarak besi

**Giriş:** Dışarıdan kuzu alımı (2–3 aylık band).

Rehber (öncelik sırası):
1. Alım / sisteme giriş  
2. Karantina (yonca + su, birkaç gün)  
3. Aşılama (seri: RFID / OCR / ses)  
4. İlk tartım T0  
5. Rasyon (kullanıcı + akıllı öneri)  
6. Ara/son tartım → ADG, FCR, maliyet, kâr  
7. Öneri vs gerçek → profesyonel besi + eğitim  

Detay: `mode1-besi-kuzuculugu.md` (bu akış = Mod 1)

---

## Mod 2 — Koyundan koç katarak besi

**Giriş:** Sürüde dişi koyun var; koç katımı ile kuzu üretilir, sonra besiye alınır.

Rehber (öncelik sırası):
1. Sürü / damızlık dişi kaydı  
2. **Koç katım** planı (tarih, koç, padok)  
3. Gebelik takibi / ultrason notu (varsa)  
4. **Kuzulatma** (doğum kaydı, kuzu–anne bağlama)  
5. Kolostrum / ilk günler  
6. Besiye alma yaşına gelince → Mod 1’deki **karantina sonrası besi adımlarına** geçer  
   (aşı → tartım → rasyon → ADG/FCR)  
7. Akıllı yönlendirme: “Katım zamanı”, “doğuma X gün”, “kuzu besiye hazır”

**Fark:** Mod 1’de kuzu dışarıdan gelir; Mod 2’de **üretim + besi** birlikte yönetilir.

---

## Mod 3 — Damızlık kuzu yetiştiriciliği

**Amaç:** Et/besi satışı değil; **damızlık kalite** (ırk, verim, sağlık, şecere).

Rehber (taslak):
1. Damızlık aday seçimi (anne/baba hattı)  
2. Doğum / kimlik / TÜRKVET alanları  
3. Büyüme tartımları + sağlık / aşı disiplini  
4. Seleksiyon kriterleri (ADG, yapı, ırk tipi, hastalık geçmişi)  
5. Damızlık satış / sertifika hazırlığı  
6. Akıllı yönlendirme: “Bu kuzu damızlık adayı / besiye ayır” önerisi  

**Fark:** Raporlar besi kârından çok **genetik / yetiştirme kalitesi** odaklıdır.

---

## Mod 4 — Süt koyunculuğu (ayrı hat)

**Amaç:** Süt + sürü çoğaltma; kuzulatma da var ama hedef sağım/laktasyon.

Rehber (taslak — sonra detay):
1. Sağmal / kuru / gebe grupları  
2. Koç katım / kuzulatma / çoğaltma  
3. Sağım kaydı (litre) + laktasyon  
4. Sağmal rasyon (ayrı dönemler)  
5. Akıllı yönlendirme: kuruya alma, doğum, meme sağlığı, yavru sütten kesme  
6. **Akıllı Kuzu:** süt koyunu dersleri  

Ortak parçalar: flock, health, stock, sync, roles, vetAI.  
Yeni parça: `dairy/` (sağım, laktasyon).

---

## Ortak akıllar (tüm modlar)

- Offline + senkron  
- Roller: yönetici / ortak / vet / çoban  
- Akıllı veteriner: foto + semptom → AI → gerçek veterinere gönder  
- Seri giriş: RFID / küpe OCR / sırt OCR / ses  
- Excel giriş-çıkış  
- **Akıllı Kuzu** (moda özel rehber)

---

## Puzzle parçaları (moda özel)

```
mobile/src/
├── fatteningBuy/          # Mod 1 — kuzu alarak besi (journey)
├── fatteningBreed/        # Mod 2 — koç kat → kuzulat → besi
├── breedingStock/         # Mod 3 — damızlık kuzu
├── dairy/                 # Mod 4 — süt koyunculuğu
├── fatteningShared/       # ortak: karantina, ADG, FCR, rasyon öneri, seri tartım/aşı
│   ├── quarantine.ts
│   ├── metrics.ts
│   ├── recommend.ts
│   └── chuteMode.ts
└── ...
```

Mod 1 ve Mod 2, **besi metriklerini** (`fatteningShared`) paylaşır; giriş kapısı farklıdır.

---

## Geliştirme önceliği

```
1. Mod 1 — Kuzu alarak besi            ← ŞİMDİ
2. fatteningShared (karantina, ADG, FCR, seri)
3. vetAI + vetBridge + roles
4. Mod 2 — Koç katarak besi
5. Mod 3 — Damızlık kuzu
6. Mod 4 — Süt koyunculuğu
7. excel + billing + rfid + ocr + voice + turkvet
```

> Not: `vetBridge` için ağılda **Veteriner rolü daveti** gerekir.

Kaynak dosyalar: `mod1-…`, `mod2-…`, `mod3-…`, `mod4-…`