# 34 · Excel / CSV içe ve dışa aktarma

## Nerede
**Daha → Excel / CSV içe-dışa aktar** (`/excel`)

## Dışa aktar
- **Tüm veriler · tek Excel**: 4 sayfalı .xlsx (Sürü listesi, Tedavi ve aşılar, Tartımlar, Maliyetler).
- Her veri seti ayrı **.xlsx** ya da **.csv** olarak da iner.
- CSV: UTF-8 BOM, `;` ayırıcı, ondalık virgül. Türkçe Excel'de çift tıkla düzgün açılır.
- Maliyet sayfası, Maliyet ekranıyla aynı hesabı kullanır (`kaynak/maliyet/topla.ts`): parti başına alış, yem, ilaç, sigorta, baş başı, kg başı, kâr, en altta TOPLAM.
- Sürü sayfasının başlıkları içe aktarmayla aynı. Dışa alınan dosya düzenlenip geri yüklenebilir.

## İçe aktar (kuzu listesi)
1. **Dosya seç** (.xlsx / .csv; web) ya da **Tablodan yapıştır** (Excel'den kopyala-yapıştır; native'de de çalışır).
2. **Sütun eşleme**: başlıklar Türkçe eş anlamlılarla otomatik eşlenir (Kulak küpesi, D.Tarihi, Ağırlık, Grup…). Yanlışsa sütuna dokunup alan seçilir; bir alan tek sütuna gider.
3. **Önizleme**: her satır Yeni / Küpe sürüde var / Dosyada tekrar / Hatalı olarak işaretlenir, hata ve uyarı nedeniyle birlikte.
   - Küpe karşılaştırması boşluk, tire ve noktayı yok sayar (`TR-34 001` = `TR34001`).
   - Tarih biçimleri: 15.03.2026, 15/3/26, 2026-03-15 ve Excel seri sayı. 31.02 gibi geçersiz tarih hatalı sayılır.
   - Cinsiyet: D/E, Dişi/Erkek, Koç/Teke. Kilo: 24,5 / 24.5 kg.
4. **Mükerrer küpe kararı**: sürüde olan küpe için *Atla* ya da *Güncelle* (yalnız dolu alanlar yazılır, not eklenir). Dosya içi tekrar ve hatalı satırlar hiç alınmaz.
5. **Kaydet**: kuzular eklenir; kilo sütunu varsa ilk tartım da yazılır; ana küpe dosyada ya da sürüde varsa ana bağlanır. İşlem günlüğüne ve işlem kaydına (denetim) düşer.
- **Boş şablon indir**: doğru başlıklı örnek .xlsx.

## Teknik
- `kaynak/excel/xlsx.ts`: bağımlılıksız xlsx yazıcı/okuyucu (yalnız `fflate` zip). Excel / LibreOffice / openpyxl ile doğrulandı.
- `kaynak/excel/csv.ts`: CSV yaz / oku, ayırıcıyı otomatik bulur, tırnaklı alanları ve alan içi yeni satırı destekler. Okurken UTF-8 yoksa Windows-1254 denenir.
- `kaynak/excel/ice-aktar.ts`: saf eşleme ve önizleme. `ice-aktar-uygula.ts` depoya yazar.
- `kaynak/excel/dosya(.web).ts`: web'de tarayıcı indirmesi ve dosya seçici; native'de paylaş menüsü.
- Test: `test/moduller/excel.ts`

## Sınırlar
- Native (iOS/Android) uygulamada dosya seçici paketi yok, orada "Tablodan yapıştır" kullanılır. Android paylaşımında dosya eki gitmeyebilir; web sürümünde sorun yok.
- İçe aktarma şimdilik kuzu listesi (+ilk tartım). Tedavi ve tartım geçmişini içe aktarma yok.
