---
baslik: Stok aşı listesi sıralama (t307u)
durum: uygulanıyor
kilitli: false
---

## Sorun

Stok → Aşı filtresinde `kullanim=0` iken «stok kaydı var» + alfabetik sıra, Brusella/Çiçek kayıtlıysa üste itiyordu; gerçek kullanım skoru etkisiz kalıyordu.

## Çözüm

- `asi-siralama.ts` — devlet programı aşıları sonda; kullanım (çıkış + katalog skoru); katalog sırası; 0 miktar «stokta var» değil
- `StokKarti` — 0 miktar ayrı metin
- Test: `stok-asi-siralama` modülü

## Dokunulmayan

Aşı uygulama, hatırlatma, devlet uyarı metinleri, doz mantığı.
