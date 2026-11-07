---
baslik: Buton ve rota denetimi (Faz 3 — tartım UI/analitik sonrası)
durum: ilk tur tamam
kilitli: false
---

## Öncelik sırası (değişmez)

1. PR #44 — Hızlı tartım UX (release adayı)
2. PR #45 — Tartım kalıcılık / GCA-FCR
3. **Bu faz** — sistematik buton/ rota denetimi + gerçek hata düzeltmeleri

## Kurallar

- Üretim (`superkuzu.vercel.app`): yalnız okuma / gezinme; kayıt silme/yazma yok.
- Yazma testleri: yerel Expo web + sentetik fixture.
- «Tüm butonlar kusursuz» iddiası yok; kanıtlı kapsam listesi.

## Çıktılar

- Rota envanteri + kontrol matrisi (çalışıyor / stub / yetki / donanım)
- Düzeltilen bug + regresyon testi
- Bloker listesi (oturum, donanım, bulut)

## İlk tur (2026-11-07)

- Üretim `superkuzu.vercel.app`: HTTP 200, boş sürü (0 kuzu) — yalnız okuma; canlı veriye yazılmadı.
- Yerel Playwright: 38/40 rota smoke (`rota-denetim-rapor.json`); `/takvim` ilk paint’te kısa (yükleniyor).
- Düzeltme: `gecmis?sekme=cop|kayit` deep link sekme senkronu.
- Test: `rota-navigasyon` modülü (menü href dosya varlığı).
- PR: `cursor/ui-buton-denetim-09a5`
