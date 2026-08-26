# Akıllı Veteriner Modu + Gerçek Veteriner Köprüsü

> Hastalık durumunda: **fotoğraf + semptom → AI öneri → işe yaramazsa gerçek veterinere gönder**.  
> Veteriner: resmi, durumu, denenenleri, sonucu görür → ne yapılacağını yazar.

---

## Amaç

1. Çoban / sahip ağılda hızlı ilk yönlendirme alsın (teşhis değil, bilgilendirme)
2. AI yetmezse **tek dokunuşla** bağlı veterinere vaka açılsın
3. Vet, bağlamı kaybetmeden (foto + öykü + denenenler) cevap versin
4. Sonuç sürü kaydına işlensin (offline senkron ile)

---

## Kullanıcı akışı

```
Hayvan kartı / Sağlık
        │
        ▼
┌───────────────────────┐
│  Akıllı Veteriner     │
│  1. Fotoğraf çek/yükle│
│  2. Semptomları yaz   │
│     veya sesle söyle  │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  AI Analiz            │
│  - olası durumlar     │
│  - aciliyet           │
│  - önerilen adımlar   │
│  - "veterinere git?"  │
└───────────┬───────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
[İşime yaradı]  [İşe yaramadı /
 Kaydet +       Gerçek veterinere gönder]
 takip et              │
                       ▼
            ┌──────────────────────┐
            │ Vaka paketi oluşur   │
            │ foto + semptom + AI  │
            │ + denenenler + sonuç │
            └──────────┬───────────┘
                       │ (davetli vet hesabı)
                       ▼
            ┌──────────────────────┐
            │ Veteriner paneli     │
            │ görür → talimat yazar│
            └──────────┬───────────┘
                       ▼
            Çoban/sahip bildirimi +
            sağlık kaydına işlenir
```

---

## 1) Fotoğraf

- Hayvan: yüz, ağız, ayak, dışkı, yara, meme (süt modunda sonra)
- Birden fazla foto (max 3–5)
- Offline: foto yerelde saklanır, senkron olunca yüklenir
- Gizlilik: sadece ağıl üyeleri + davetli vet

## 2) Semptomlar

- Serbest metin + hızlı etiketler: ishal, topallama, iştahsızlık, öksürük, ateş, düşük…
- Opsiyonel: sesle anlat → metne çevir
- Süre: “ne zamandır?”, kaç hayvan etkilenmiş?

## 3) AI öneri (bilgilendirme)

Çıktı:
- Olası durumlar (liste)
- Aciliyet: düşük / orta / yüksek
- Önerilen ilk adımlar (izolasyon, su, yem kesme vb.)
- **“Veterinere başvur”** bayrağı (yüksek aciliyet veya belirsizlik)

**Yasal / ürün kuralı:**  
Ekranda sabit uyarı: *Teşhis ve tedavi değildir. Acilde lisanslı veteriner hekime başvurun.*

AI “işe yaradı / yaramadı” geri bildirimi → model ve kuralları iyileştirmek için kaydedilir.

## 4) Gerçek veterinere gönder

Şartlar:
- Ağılın davetli **Veteriner** rolü var (yoksa “vet davet et” + yakındaki klinik listesi ileride)
- Vaka paketi otomatik doldurulur:

| Alan | İçerik |
|------|--------|
| Hayvan | küpe, ırk, yaş, padok, Mode (besi/süt) |
| Fotoğraflar | yüklenen görseller |
| Semptomlar | kullanıcı metni + etiketler |
| AI özeti | ne önerdi, aciliyet |
| Denerken | ilaç/aşı/uygulama (varsa) |
| Sonuç | “düzelmedi / kötüleşti / …” |
| Bağlam | son tartım, bekletme, karantina mı? |

Buton: **“Veterinere gönder”** → vet uygulamasında / panelde bildirim.

## 5) Veteriner tarafı

Vet görür:
- Koyun/keçi fotoğrafları
- Ne durumda (semptom + AI özeti)
- Ne denendi
- Ne sonuç alındı
- Sürü / padok yayılma riski (kaç hasta)

Vet yazar:
- Ne yapılmalı (talimat)
- İlaç / doz / süre (öneri)
- Bekletme süresi
- “Acil ziyaret gerekli” / “takip et” / “izolasyon”

Sahip/çoban:
- Push bildirim
- Talimatı “uyguladım” işaretler → sonuç notu ekler
- İstersen ikinci tur veteriner mesajı

---

## Roller ile ilişki

| Rol | Yetki |
|-----|--------|
| Sahip / Ortak | Vaka aç, AI kullan, veterinere gönder |
| Çoban | Foto + semptom gir, AI gör, (ayar ile) veterinere gönder |
| Veteriner | Gelen vakaları gör, talimat yaz, geçmişi incele |
| Yönetici | Hangi vet’in bağlı olduğunu yönetir |

---

## Puzzle klasörleri

```
mobile/src/vetAI/
├── analyze.ts              # semptom (+ ileride görüntü) analizi
├── disclaimer.ts
├── photoCapture.ts         # çek / yükle / offline kuyruk
├── casePack.ts             # veterinere gönderilecek paket
├── feedback.ts             # işe yaradı / yaramadı
└── urgency.ts

mobile/src/vetBridge/       # ★ gerçek vet köprüsü
├── sendCase.ts
├── vetInbox.ts             # vet gelen kutusu
├── instructions.ts         # vet talimatı
└── caseThread.ts           # mesaj / takip zinciri

app/
├── vet.tsx                 # AI ekranı (foto + semptom)
├── vet/case/[id].tsx       # vaka detay (çiftçi)
└── vet/inbox.tsx           # veteriner gelen kutusu
```

Server:
```
server/src/vet/
├── cases.routes.ts
├── ai.proxy.ts             # (opsiyonel) güvenli AI çağrısı
└── notify.ts               # vet push / SMS
```

---

## Mode 1 (besi) ile bağ

- Karantina / aşı sonrası hastalık → aynı akış
- Hasta kuzu otomatik “hasta” durumu + (isteğe bağlı) ayrı padok önerisi
- Bekletme süresi tartım/satış uyarısına bağlanır

---

## Fazlama

| Faz | İçerik |
|-----|--------|
| **A (şimdi / yakında)** | Semptom metni + kural/AI öneri + disclaimer + “işe yaradı mı?” |
| **B** | Fotoğraf yükleme + vakaya ekleme |
| **C** | Gerçek veterinere gönder + vet inbox + talimat |
| **D** | Görüntü destekli AI (opsiyonel), sesli semptom |

---

## Başarı ölçütü

- AI sonrası **%X** vaka “işe yaradı” ile kapanır (gereksiz vet yükü azalır)
- “Veterinere gönder” vakalarında vet **24 saat içinde** ilk yanıt (hedef)
- Çoban tekrar aynı bilgileri anlatmak zorunda kalmaz (paket hazır)
