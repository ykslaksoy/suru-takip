---
baslik: Besi planlama + şimdi sat / devam (t300u/t301u)
durum: uygulanıyor
kilitli: false
---

## Kapsam

Ayrı dal: `cursor/besi-planlama-sat-devam-09a5` — tartım analitiği PR’ından bağımsız.

- `sat-devam-hesap.ts` — marjinal sat vs bekle; batık ayrı
- `besi-plan-*` — dönemsel taslak, sürümlü depo, onay ≠ yem tüketimi
- UI: `/maliyet/sat-devam`, `/maliyet/besi-planlama`, hayvan kartından erişim
- Mevcut `hesaplaBesiMaliyetTahmin` / parti maliyet motoru ayrı (çift motor yok)

## Bilinçli sınırlar

- Gerçekleşen vs plan otomatik stok karşılaştırması sonraki adım
- Konservatif/temel senaryo çoğaltma — kullanıcı çoğaltarak taslak

## Test

`besi-plan-sat-devam` modülü
