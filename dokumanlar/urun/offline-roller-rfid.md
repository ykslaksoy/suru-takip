# Offline senkron · Roller · RFID / Donanım satışı

## 1. Offline ne demek?

**Evet: İnternet olmadan uygulama çalışır; internet gelince sunucu ile senkronize olur.**

```
┌─────────────┐         İnternet yok          ┌─────────────┐
│  Çoban      │ ─────────────────────────────▶│ Telefon     │
│  telefonda  │   Kayıt telefonda saklanır    │ SQLite      │
└─────────────┘                               └──────┬──────┘
                                                     │ İnternet
                                                     │ gelince
                                                     ▼
                                              ┌─────────────┐
                                              │  Sunucu     │
                                              │  (bulut)    │
                                              └──────┬──────┘
                                                     │
                    ┌────────────────────────────────┼────────────────┐
                    ▼                                ▼                ▼
              Yönetici                           Veteriner         Ortak
              (tablet/PC)                        (klinik)         (telefon)
```

### Nasıl çalışır?
1. **Ahırda internet yok** → hayvan, aşı, kilo, stok kayıtları telefona yazılır
2. **Kuyruk oluşur** → “senkron bekleyen X kayıt” banner’ı görünür
3. **İnternet gelince** → kuyruk otomatik sunucuya gönderilir
4. **Diğer kullanıcılar** (yönetici, vet, ortak, çoban) aynı ağılı güncel görür

### Neden şart?
- Kırsal ağıl, merada çekim sık sık kesilir
- Çoban telefonunu ahırda kullanır; Wi‑Fi/4G şart olmamalı
- Veri kaybı kabul edilemez

### Teknik (SürüYön’de)
- **Native:** SQLite + `sync_queue` tablosu
- **Web:** AsyncStorage (test)
- **Sunucu (yapılacak):** PostgreSQL + API; conflict çözümü (son yazan / alan bazlı birleştirme)

---

## 2. Roller ve paylaşım (çoklu kullanıcı)

Her **ağıl** bir işletmedir. Birden fazla kişi aynı sürüye erişir; yetkiler role göre değişir.

| Rol | Kim? | Ne yapabilir? | Ne yapamaz? |
|-----|------|---------------|-------------|
| **Sahip / Yönetici** | İşletme sahibi | Her şey: sürü, stok, finans, davet, abonelik, donanım | — |
| **Ortak** | İş ortağı, aile | Sürü + sağlık + stok + raporlar | Abonelik / fatura / silme (ayarlanabilir) |
| **Veteriner** | Klinik / saha vet | Sağlık, aşı, tedavi, bekletme, AI destek | Stok silme, hayvan satışı (isteğe bağlı) |
| **Çoban** | Saha personeli | Hızlı kayıt: kilo, padok taşıma, aşı uygula, sayım | Finans, abonelik, kullanıcı yönetimi |

### Davet akışı
1. Yönetici telefona / e‑postaya davet gönderir
2. Kişi uygulamayı indirir, daveti kabul eder
3. Rol atanır → aynı ağıl verisini görür
4. Çoban offline kayıt yapar → senkron → vet ve yönetici görür

### Neden kritik?
- Tek telefon = veri riski + iş paylaşılmaz
- Vet paneli = satış kanalı (klinikler çiftçiye önerir)
- Çoban hesabı = ahırda gerçek kullanım

---

## 3. RFID küpe + cihaz + otomasyon satışı

Yazılım + donanım paketi = **daha yüksek ciro ve kilitlenme**.

### Satılabilir ürünler

| Ürün | Açıklama | Tahmini fiyat bandı |
|------|----------|---------------------|
| **RFID kulak küpesi** | UHF/LF elektronik kimlik | 15–40 TL/adet |
| **El terminali / okuyucu** | Bluetooth RFID okuyucu | 3.000–12.000 TL |
| **Başlangıç paketi** | 100–300 küpe + okuyucu + 1 yıl Profesyonel | 8.000–25.000 TL |
| **Akıllı tartım (ileri)** | Tartı + RFID eşleşme | 15.000–50.000 TL |
| **Yazılım aboneliği** | Çiftçi / Profesyonel / Kurumsal | 1.490–3.490+ TL/yıl |

### İş modeli
```
Yazılım (SaaS)  +  Donanım (bir kerelik / paket)  +  Destek
     │                      │
     ▼                      ▼
 Tekrarlayan gelir      Yüksek ilk satış +
 (abonelik)             müşteri bağlılığı
```

### Strateji seçenekleri
1. **Kendi marka:** Beyaz etiket küpe + okuyucu (Roswise tarzı)
2. **Partnerlik:** Mevcut donanım üreticisiyle entegrasyon, komisyon
3. **Hibrit (önerilen):** İlk 12 ay partnerlik; talep artınca kendi paket

### Uygulamada
- “RFID bağla” → Bluetooth okuyucu
- Küpe okutunca hayvan kartı açılır
- Satış: Menü → Donanım mağazası (paket siparişi / partner linki)

---

## 4. Gelire etkisi (kabaca)

| Kaynak | 3. yıl gerçekçi ek |
|--------|---------------------|
| Yazılım abonelik | ~6 M TL (önceki projeksiyon) |
| RFID / paket donanım | +1–3 M TL (200–400 paket/yıl) |
| Vet / çoklu kullanıcı premium | +0,5–1 M TL |
| **Toplam potansiyel** | **~8–10 M TL / yıl** |

Donanım marjı yazılım kadar yüksek olmayabilir ama **abonelik yenilemesini artırır**.

---

## 5. Geliştirme sırası

| Faz | Süre | İş |
|-----|------|-----|
| **A** | 4–6 hafta | Offline SQLite + gerçek sunucu senkron (API) |
| **B** | 4–6 hafta | Roller: Sahip, Ortak, Vet, Çoban + davet |
| **C** | 4–8 hafta | RFID Bluetooth okuma + donanım sipariş ekranı |
| **D** | Devam | Excel, OCR, ses, resmi bildirim |

---

## 6. Ürün cümlesi (güncel)

> **SürüYön:** Koyun ve keçi ağlı için akıllı sürü takibi.  
> İnternet olmadan çalışır, gelince senkron olur.  
> Yönetici, ortak, veteriner ve çoban aynı sürüye yetkiye göre erişir.  
> RFID küpe ve okuyucu paketleriyle ağılı tam dijitalleştirir.
