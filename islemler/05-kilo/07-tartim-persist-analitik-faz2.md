---
baslik: Tartım kalıcılık + GCA/FCR/grafik (Faz 2 — UI PR sonrası)
durum: uygulanıyor
kilitli: false
---

## Kapsam

PR `cursor/tartim-analitik-duzeltme-09a5` — **Hızlı tartım UI PR #44’ten ayrı**.

- Kanonik `kaydetTartimKaydi` (manuel, ses, excel, doğum, hızlı tartım main)
- GCAA `adg.ts`; FCR `hesaplaFcrSonuc` + açık `neden`
- UI etiketleri: `performans-metrik-etiket.ts` — Yemden yararlanma oranı (FCR), Günlük canlı ağırlık artışı (GCAA, g/gün); as-fed açıklaması
- Padok özeti: ölçülen kapsam (`padokTartimOzeti`)
- Hayvan kartı: tek tartımda da grafik
- Test: `tartim-analitik` modülü

## Kalan / bilinen

- Native SQLite tartımları hâlâ bulut kuyruğuna gitmiyor (mevcut mimari).
- Hızlı tartım iki adımlı UI değişiklikleri **#44** dalında; bu dal main tabanlı.
- Kabul akışında tartım yok → ADG/FCR boş (bilinçli).

## Üretim

Demo/üretim verisine yazılmaz; testler sentetik fixture.
