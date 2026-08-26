# Mod 1 — Kuzu Alarak Besi Kuzuculuğu

> Ürün ailesi: [`urun-modlari.md`](./urun-modlari.md)  
> Bu dosya yalnızca **Mod 1** rehberidir (dışarıdan kuzu alımı).

---

## Kim için?

2–2,5 / ~3 aylık kuzu **satın alıp** besiye alan üretici.

---

## Rehberli yolculuk (öncelik sırası)

```
[0] Kuzu alım / sisteme giriş
        │
        ▼
[1] KARANTINA (ilk birkaç gün)
    sadece yonca + su  ──▶ günlük kontrol
        │
        ▼
[2] AŞILAMA (seri: RFID / OCR / ses)
        │
        ▼
[3] İLK TARTIM (T0)
        │
        ▼
[4] RASYON BAŞLAT
    kullanıcı girer + akıllı öneri (hedef kg, süre, maliyet, kâr)
        │
        ▼
[5] BESİ DÖNEMİ
        │
        ▼
[6] ARA / SON TARTIM
        │
        ▼
[7] OTOMATİK: ADG · FCR · maliyet · öneri vs gerçek
        │
        ▼
[8] PROFESYONEL BESİ + eğitim
```

---

## Diğer modlarla fark

| | Mod 1 | Mod 2 | Mod 3 |
|--|-------|-------|-------|
| Kuzu kaynağı | **Satın al** | Kendi koyunundan (koç kat) | Damızlık hat |
| Odak | Hızlı besi / kâr | Üretim + besi | Genetik / damızlık |

---

## Metrikler

- **ADG:** g/gün  
- **FCR:** kg yem / kg canlı artış  
- Akıllı rasyon: hedef kg, süre, maliyet, ek kâr önerisi  
- Öneri ↔ gerçek karşılaştırma  

## Kuzu derecesi (yaş bandına göre)

Derece **ham ADG’ye göre değil**, kuzunun **kaçıncı ayında** olduğuna göre yorumlanır.  
Örnek: ~200 g/gün, alım bandında (2–3,5 ay) **Sportmen**; aktif beside eşik yükselince aynı tempo **Gelişen** kalabilir. Bitiş ayında ADG doğal yavaşladığı için eşikler biraz düşer.

Geçici skala: **Ölçülsün → Sıska → Gelişen → Sportmen → Şampiyon → Süper Kuzu**  
Kod: `mobile/lib/kuzu-derece.ts` (`AGE_BANDS` + `gradeLamb`). Eşikler sonra ırk/ırk tipine göre netleştirilir.

Detaylı ekran / puzzle notları için önceki `mode1-besi-kuzuculugu.md` içeriği bu akışla aynıdır; isimlendirme **“kuzu alarak”** olarak netleştirilmiştir.
