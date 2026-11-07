# Sesli komut — domain genişletme (faz 6)

**Durum:** Geliştirme tamam; merge/deploy üst kullanıcıda. Tartım UI PR (#44) önceliği korunur.

## Desteklenen yeni komutlar (örnek Türkçe)

| # | Tür | Örnek | Kayıt |
|---|-----|-------|-------|
| 1 | Bilgi | `küpe 1234 son tartım`, `bugün aşı görevleri` | Hayır (DB okuma) |
| 2 | Padok taşı | `küpe 1234 padok B ye taşı` | Evet + onay |
| 3 | Gözlem + hatırlatma | `küpe 1234 iştahsız yarın kontrol hatırlat` | Evet; `addPlanlananGorev` (uygulama içi) |
| 4 | Padok yem (gerçek) | `ikinci padoka bugün 50 kilo yem verildi` | Evet; tek `adjustStock` çıkış, plan otomasyonundan ayrı not |
| 5 | Doğum | `küpe 456 ikiz … küpe 1001 erkek küpe 1002 dişi` | `dogumKaydet` — kuzu küpe uydurma yok |
| 6 | Tartım düzelt | `küpe 1234 tartımı düzelt 72 kilo` | Son kayıt eski/yeni onay; `tartim-duzelt.ts` |

Mevcut: tartım, aşı, stok, grup aşı (değişmeden; onay + Gönder).

## Kısıtlar

- Çoklu hayvan eşleşmesinde `hayvanBulKesin` kayıt yapmaz.
- Bilgi komutları teşhis/ tedavi önermez.
- Hatırlatma dış SMS/push yok.
- Geliştirme testleri DB yazmaz (parser unit).

## Test

`mobil/test/moduller/ses-gelismis-komut.ts` + mevcut ses modülleri.

## Cihaz

iOS Chrome STT/mikrofon seviye bu fazda otomasyonla doğrulanmadı.
