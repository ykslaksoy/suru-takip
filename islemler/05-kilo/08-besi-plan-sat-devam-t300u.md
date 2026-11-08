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

## t303u — Döngü ekonomisi

- `dongu-ekonomi-hesap.ts`: aylık adım + sözleşme min, paylaşımlı baş×gün, aday satış günleri
- Tam döngü net vs marjinal şimdi-sat ayrımı (kira/maaş sözleşmesi marjinalde yok)

## t306u — Besi Yönetimi maliyet kalemleri (taslak)

- `besi-ekonomi-kalem.ts` — alış (baş/kg/parti), nakliye, yem, çoban, kira, su, yatak, vet, ops. sermaye, diğer; ödeme şekli + bilinmiyor/sıfır/tutar
- `besi-ekonomi-gercek.ts` — `maliyetTopla` / `PartiMaliyet` salt okunur özet; `CiftSayimAnahtar` ile stok çift sayım uyarısı
- `besi-ekonomi-senaryo.ts` — kalem + plan + döngü birleşik; eksik fiyat → kısmi/tam etiketi, sahte kesin kâr yok
- UI: aynı `/maliyet/besi-planlama` (başlık Besi Yönetimi); `ekonomiKalemler` taslak depoda
- Üretim alış/gider kaydı yazılmaz

### Test (804)

- `besi-ekonomi`: alış bazları, kira min ay, çift sayım atla, bilinmiyor/sıfır
- `besi-plan-sat-devam`: marjinal/sat, aday günler, aylık adım (mevcut)

## t334u/t335u — Planlama alış ₺/canlı kg

- `besi-plan-alis.ts` — varsayılan **500 ₺/kg** (yeni taslak; 480/12.000 eski varsayım değil)
- Ekran: `/maliyet/besi-planlama` — «Tahmini alış ₺/canlı kg» + baş başı hesap; kaynak etiketi «Kullanıcı planlama varsayımı»
- Öncelik: gerçek parti alışı → ₺/baş override → kg×giriş kg
- `alisCanliKgFiyat` taslak depoda; onaylı/eski planlar yüklenince değerleri korunur (otomatik 500 yazılmaz)
- Satış/borsa güncellemesi yok

### Blokaj / eksik

- Fatura/defter satırı API yok — yalnız stok çıkışı parti maliyeti
- Dinamik «+ diğer kalem» satırı UI’da yok (tek şablon `diger`)
- Paylaşımlı overhead sadece tip/hesap; form alanı sonraki
- `sat-devam` henüz tam `hesaplaBesiEkonomiSenaryo` marjinal break-even ile birleşmedi

## Bilinçli sınırlar

- Gerçekleşen vs plan otomatik stok karşılaştırması sonraki adım
- Konservatif/temel senaryo çoğaltma — kullanıcı çoğaltarak taslak
