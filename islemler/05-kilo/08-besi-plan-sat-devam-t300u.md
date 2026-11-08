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

## Rasyon / ekonomi düzeltmesi (kapsam)

- Canlı vs karkas satış bazı; verim % yoksa karkas geliri hesaplanmaz
- Model «denge» etiketi; eksik yem maliyeti 0 sayılmaz (`tamamlik`)
- 8 diyet taslağı — besleme aktive edilemez (`besi-taslak-diyet`)
- 60/90 gün ayrı kg projeksiyonu (planMaliyetVeKgGunHedef)
- Onaylı plan salt okunur; 648 ₺/kg karkas tablodan varsayılan değil

### Kısmi / blokaj

- 8 model için kullanıcı reçete/girdi girmediği sürece karşılaştırma boş/eksik
- Katkı/karkas otomatik artış yok
- Kesim/enerji/… tüm kalemler ekonomi formunda henüz tam değil

### Blokaj / eksik

- Fatura/defter satırı API yok — yalnız stok çıkışı parti maliyeti
- Dinamik «+ diğer kalem» satırı UI’da yok (tek şablon `diger`)
- Paylaşımlı overhead sadece tip/hesap; form alanı sonraki
- `sat-devam` henüz tam `hesaplaBesiEkonomiSenaryo` marjinal break-even ile birleşmedi

## t344u — Kullanıcı bütçe tablosu / mutabakat

- `besi-plan-butce-tipler.ts` — işletme / ortak / damızlık / RFID / yatırım faz1-faz2 sınıfları; bilinmiyor | sıfır | tutar
- `besi-plan-butce-hesap.ts` — listelenen 13.580 vs iddia 14.500 → **920 ₺ açık fark** (otomatik «diğer» eklenmez); satış 17.000 − listelenen = **3.420 işletme dengesi** (net kâr değil); 12.500 senaryosu 14.080 / 2.920
- Ortak gider 142.000 (kira/çoban/elektrik/diğer 30k) — dönem ve pay baş sayısı bilinmeden 90 güne bölünmez
- Yatırım 400k+760k ve damızlık alımları nakit/sermaye; işletme dengesine karışmaz; faz2 «sonra» kapalıyken tutarlar durur
- UI: `/maliyet/besi-planlama` — `butceTaslagi` taslak depoda; 500 ₺/kg plan alışı ayrı kalır
- Test: `besi-plan-butce` (+8, toplam 831)

## t349u/t350u — Yem taslak dışı + plan yem

- Kesif/yonca/saman (1080/270/80) `karsilastirmaHaric` — eski tabloda 13580, **yeni karşılaştırmada yok**
- Yeni: alış **12.000** + aşı + `planMaliyetVeKgGunHedef` (varsayılan **60 gün**) — plan fazlarında kg ve ₺/kg girilince
- 28,20 ₺/gün / 1.692 ortalama **kullanılmaz**
- UI: ortak dönem türü, dönem adedi, pay baş; yem fiyat tarihi alanı

### t344u — kullanıcıdan beklenen

- Ortak gider dönemi (ay / döngü / yıl) ve paylaşım hayvan sayısı
- RFID çip adedi ve damızlık adetleri
- Yatırım fazlarını plana dahil etme ve isteğe bağlı amortisman yıl/hurda

## Bilinçli sınırlar

- Gerçekleşen vs plan otomatik stok karşılaştırması sonraki adım
- Konservatif/temel senaryo çoğaltma — kullanıcı çoğaltarak taslak
