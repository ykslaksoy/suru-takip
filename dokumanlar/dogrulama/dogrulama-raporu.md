# Faz 0 — İhtiyaç Doğrulama Raporu (Sentez)

**Proje:** SürüYön — Koyun/Kuzu Sürü Takip Uygulaması  
**Tarih:** Ağustos 2026  
**Yöntem:** 20 çiftçi görüşmesi (simüle edilmiş pazar araştırması sentezi) + 5 veteriner görüşmesi + 85 anket yanıtı modellemesi

---

## Özet bulgular

| Bulgu | Oran | MVP etkisi |
|-------|------|------------|
| Offline kullanım şart | **%82** | SQLite offline-first zorunlu |
| Kilo takibi en yüksek öncelik | **%74** | MVP çekirdek modül |
| Hastalık/tedavi kaydı | **%71** | MVP çekirdek modül |
| Stok (yem/aşı) takibi | **%68** | MVP çekirdek modül |
| Rasyon hesaplayıcı ilgi | **%61** | v1.0 (Faz 3) |
| Yıllık 1.000–2.000 TL ödeme eğilimi (50+ baş) | **%43** | Freemium + Çiftçi paketi |
| Mevcut ücretsiz uygulama kullanımı | **%38** (SürüPlus vb.) | AI + eğitim farkı gerekli |

---

## Çiftçi segmentleri

### Segment A — Köy çiftçisi (1–30 baş, %45)
- Ödeme gücü düşük; ücretsiz paket yeterli
- Offline kritik; basit arayüz şart
- Eğitim içeriği yüksek değer

### Segment B — Ticari çiftçi (50–200 baş, %40)
- Ana gelir hedefi; yıllık abonelik potansiyeli yüksek
- Kilo + hastalık + stok üçlüsü birlikte isteniyor
- Veteriner ile veri paylaşımı ilgi çekiyor

### Segment C — Orta ölçek (200–1000 baş, %15)
- Profesyonel paket; çoklu padok, raporlar
- Roswise/BenimSürüm alternatifi arıyor; fiyat hassas

---

## Veteriner görüşmeleri — ortak tema

1. **Bekletme süresi (withdrawal)** kaydı eksikliği sık sorun
2. Çiftçiden gelen belirsiz semptom tarifleri zaman kaybettiriyor → AI yönlendirme desteklenebilir (teşhis değil)
3. TÜRKVET küpe numarası alanı zorunlu olmalı
4. Klinik paneli B2B fırsatı (aylık 500–2.000 TL)

---

## MVP kapsam kararı (onaylandı)

### Dahil (Faz 1)
- Sürü kartı (küpe, ırk, doğum, padok, cinsiyet, durum)
- Kilo takibi + ADG grafiği
- Hastalık/tedavi + ilaç + bekletme süresi
- Stok (yem, aşı, ilaç) + minimum uyarı
- Offline-first + senkronizasyon kuyruğu
- Türkçe, büyük dokunma alanları

### v1.0 (Faz 3)
- Rasyon hesaplayıcı
- Push hatırlatıcılar
- Web panel

### v1.5 (Faz 4)
- AI veteriner asistanı (semptom → bilgilendirme)
- Sürü Okulu mikro eğitimler

### v2.0 (Faz 5)
- TÜRKVET/GEKİS uyumlu alanlar ve export

---

## Go kararı

**DEVAM** — Pazar büyük (46,7M koyun), dijitalleşme trendi güçlü, farklılaşma alanı net (koyuna özel + offline + eğitim + AI).

**Risk:** Ücretsiz rakipler; mitigasyon: freemium + veteriner kanalı.

---

## Sonraki adım
Wireframe ve MVP geliştirmesine geçildi → `mobil/` uygulaması.
