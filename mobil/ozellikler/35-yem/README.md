# 35 · Yem envanteri ve parti rasyonu

## Nerede
- **Daha → Yem ve rasyon (stok, düşüm)** (`/yem`)
- Uyarılar: **Görevler** ("🌾 Yem az kaldı / bitti") ve **Takvim** ("🌾 X bitiyor (tahmini)").
- Maliyet: **Maliyet ve Kâr** ekranında partinin "Yem" satırı.

## Davranış
- **Yem alımı**: yem seç (ya da yeni yem adı), kg, ₺/kg, isteğe bağlı tedarikçi. Stok girişi yazılır. Birim fiyat eldeki stokla **ağırlıklı ortalanır** (100 kg × 10 ₺ + 300 kg × 12 ₺ → 11,5 ₺/kg). Fiyat girilmemiş yemde maliyet ekranındaki piyasa tahmini kullanılır ve "(tahmini)" yazar.
- **Parti rasyonu**: parti seç (birden çok ya da "Tümü"), her yem için **kg/baş/gün**. Kaydetmeden önce kg/baş/gün, ₺/baş/gün ve parti için günlük kg ile ₺ canlı hesaplanır. Bir partide tek aktif rasyon olur. Düzenle / Durdur / Başlat / Sil (geri dönüşüm kutusuna gider).
- **Otomatik günlük düşüm**: uygulama her açıldığında (ve ekran her açıldığında) bekleyen günler için *baş sayısı × kg/baş/gün* stoktan düşülür.
  - Bugün dahil düşülür; aynı gün ikinci kez düşülmez.
  - Uygulama birkaç gün açılmadıysa birikmiş günler tek harekette düşülür (en çok 60 gün geriye).
  - Rasyon başlangıcından önceki günler düşülmez. Durdurulan günler, yeniden başlatınca düşülmez.
  - Stok yetmezse eldeki kadar düşülür ve "X kg stok yetmedi" kaydedilir.
  - Baş sayısı, düşüm anındaki partide aktif (satılmamış, ölmemiş) kuzu sayısıdır.
- **Maliyet**: düşüm stok hareketinin notunda parti adı yazar ("Rasyon · Padok A · 20 baş · 19.10"). Maliyet hesabı bu notu okuyup yem giderini **yalnız o partiye** yazar.
- **Uyarı**: 7 günden az yetecek ya da biten yem ekranın üstünde kırmızı görünür, Görevler'de uyarı olur, Takvim'de tahmini bitiş günü çıkar.
- İşlem günlüğü ve işlem kaydı: alım, rasyon kurma/düzenleme/silme ve günlük düşüm.

## Dosyalar
- `kaynak/yem/hesap.ts` (saf: bekleyen günler, düşüm planı, günlük tüketim, kaç gün yeter, ağırlıklı fiyat, maliyet)
- `kaynak/yem/depo.ts`, `kaynak/yem/kayit.ts`
- `app/yem/index.tsx`
- Bağlantılar: `baglam/VeritabaniBaglami.tsx` (açılışta düşüm), `kaynak/gorevler/liste.ts`, `kaynak/takvim/depo.ts`, `kaynak/gecmis/hayvan-sil.ts` (geri alma)
- Test: `test/moduller/yem.ts` (maliyete partiye yazılma dahil)

## Notlar
- Mevcut "Rasyon" sekmesi (ihtiyaç hesaplayıcı) aynen duruyor. Bu ekran gerçek stok ve maliyet tarafı.
- Ek düzeltme: örnek kuzu silinince demo tamamlama onu yeniden ekliyordu. Artık bilerek silinen örnek kuzular geri gelmiyor (`kaynak/cekirdek/demo-silinen.ts`).
