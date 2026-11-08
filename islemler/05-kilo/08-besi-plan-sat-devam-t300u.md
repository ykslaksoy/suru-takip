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

## t365u — Pırlak (Pırıt) birleşik

- Katalog `pirlak` · eski `pirit_belirsiz` okunur, etiket birleşir

## t364u — Irk kataloğu (34 görünür)

- `besi-plan-irk-katalog.ts` — gruplu arama seçici
- Asaf → `gelistirilmis_melez` (yerli değil); Pırlak ≠ Pırıt

## t363u — Irk genişletme

- Karacabey Merinosu, Asaf (Assaf alias metin); `merinos_capraz` genel kaldı
- `pirit_belirsiz` — Pırlak’a map yok, beklemede
- Cinsiyet / yaş chip (ADG bantı değişmez)

## t362u — Bölge + satış kaynağı

- `BesiBolgeSecimi` — serbest il, UKON 7 bölge + TOBB Edirne/Gaziantep + Balıkesir; karşılaştırma tablosu
- `bolgeTaslagi` plan kaydı — ırktan ayrı; yenileme hâlâ `manuel_only`

## t359u — Karar simülasyonu (muhafazakar varsayılan)

- Pazar/karışık → **muhafazakar 200 g/gün** başlangıç; 320 varsayılan değil
- `besi-plan-karar-sim.ts` — üç bant 60/90 brüt kâr, başa çıkış ₺/kg, duyarlılık, net (gider girilince)
- İşletme gideri / ölüm % opsiyonel — eksikse net yok

## t358u — Köken / ırk seçimi

- `besi-plan-irk.ts` + `BesiIrkKokenSecimi` — üretim vs pazar toplama; ırk belli/kısmen/bilinmiyor
- Pazar karışık → `generic_kuzu`, iyimser ADG üst 320; tartım ADG öncelik; `irkTaslagi` depoda (hayvan kaydı değişmez)
- Test: `besi-piyasa-adg` (+5 t358u → 849)

## t355u/t356u — Piyasa + ADG + brüt kâr

- `besi-piyasa-kayit.ts` — TOBB Edirne, UKON, **Balıkesir Ağu/Eyl 2026 bülteni** (8 Kas günlük yok); `manuel_only` yenileme
- `besi-adg-kanit.ts` — NSW DPI 200–320 g/gün; 25 kg → 60 g ≈ 40 kg (250 g)
- `besi-plan-piyasa-ozet.ts` — BRÜT KÂR = satış−alış−yem; 60/90 ufuk
- UI: `BesiPiyasaAdgPaneli` · test `besi-piyasa-adg` (+9 → 844)

## t349u/t350u — Yem taslak dışı + plan yem

- Kesif/yonca/saman (1080/270/80) `karsilastirmaHaric` — eski tabloda 13580, **yeni karşılaştırmada yok**
- Yeni: alış **12.000** + aşı + `planMaliyetVeKgGunHedef` (varsayılan **60 gün**) — plan fazlarında kg ve ₺/kg girilince
- 28,20 ₺/gün / 1.692 ortalama **kullanılmaz**
- UI: ortak dönem türü, dönem adedi, pay baş; yem fiyat tarihi alanı

### t344u — kullanıcıdan beklenen

- Ortak gider dönemi (ay / döngü / yıl) ve paylaşım hayvan sayısı
- RFID çip adedi ve damızlık adetleri
- Yatırım fazlarını plana dahil etme ve isteğe bağlı amortisman yıl/hurda

## t366u — dinamik referans yenileme + override

- `GET /api/besi/referans-yenile` — sunucu proxy: TOBB ot kuzusu, UKON yağsız karkas bölgeleri, USK yonca/saman (Eylül 2026 grafik)
- `besi-referans-parse.ts` / istemci `besi-referans-yenile.ts` — parse birleştirme; başarısızda son önbellek + bayat uyarısı (0 veya sahte tarih yok)
- `besi-referans-override.ts` — `sy_besi_ref_override_v1`; alış/satış/yem alanları; boş veya «Referans fiyata dön» → güncel referans; fiyat 0 geçersiz
- `fiyat-referans-depo.ts` — `sy_besi_fiyat_referans_v1`; onaylı plan geçmişi değişmez, yalnız taslak/illüstrasyon yeni referans okur
- UI: `BesiReferansOverridePaneli`, `OndalikFiyatGirdi`, piyasa panelinde yenile düğmesi
- **Manuel / desteklenmeyen:** Balıkesir PDF bülteni, besi yemi TZOB satırı (USK sayfasında yok), Abalıoğlu pelet illüstrasyonu

### t368u — otomatik senkron

- İstemci **6 saat TTL** — açılış, sekme odağı (`useFocusEffect`), `AppState` resume; paralel istek **dedup**
- Sunucu **15 dk bellek cache** + upstream dedup (`api/besi/_referans-cache.js`); kalıcı KV yok
- `vercel.json` **cron** `0 */6 * * *` → `/api/besi/referans-yenile?cron=1` — **yalnız production deploy sonrası** aktif
- `GET /api/besi/referans-durum` — tanı (upstream çekmez)
- UI: `BesiReferansSaglikPaneli`, `useBesiReferansOtomatik`

### Test

- `besi-referans-yenile` + `besi-referans-otomatik` — TTL skip, sunucu cache hit, override koruma, live fetch

## Bilinçli sınırlar

- Gerçekleşen vs plan otomatik stok karşılaştırması sonraki adım
- Konservatif/temel senaryo çoğaltma — kullanıcı çoğaltarak taslak
