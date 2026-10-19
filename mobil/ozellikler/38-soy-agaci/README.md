# 38 · Soy ağacı ve akrabalık uyarısı

**Nerede:** Kuzu kartı → "🌳 Soy ağacı · Ana: … · Baba: …" (fotoğraf şeridinin üstünde) → `/hayvan/[id]/soy`.

## Ne yapar
- **3 nesil ağaç**: kendisi → baba / ana → dört büyük ebeveyn. Bilinmeyenler kesik çizgili kutu. Kutuya dokununca o hayvanın soy ağacı açılır (geriye ve ileriye gezilir).
- **Ana / baba isteğe bağlı**. "+ Seç / Değiştir" ile sürüden seçilir (arama: küpe, sırt no, ad, padok; yaşlılar önce). "Bilinmiyor (kaldır)" ile silinir. Satılmış/ölmüş hayvanlar da ebeveyn seçilebilir.
- Seçim kontrolleri: ana dişi, baba erkek olmalı. Hayvan kendi ebeveyni ya da kendi yavrusunun/torununun yavrusu olamaz (döngü engeli).
- **Kendileşme katsayısı (F)**: hayvanın ana ve babası arasındaki akrabalık (Wright yöntemi). Bilinen tüm atalar sayılır, yalnız 3 nesil değil.
- **Yavruları**: ana ya da baba olarak bağlı tüm yavrular, dokununca onların soy ağacı.
- **Eşleşme kontrolü**: koyuna koç (ya da koça koyun) seçilir, kuzunun F değeri ve ilişki adı gösterilir. Seçim listesinde akraba olanlar zaten işaretlidir:
  - ⛔ **Yakın akraba** F ≥ %12,5 (ebeveyn–yavru, öz kardeş %25; üvey kardeş, büyük ebeveyn %12,5) → "Bu eşleşmeyi yapma"
  - ⚠️ **Akraba** F ≥ %6,25 (kuzen) → "Mümkünse başka koç kullan"
  - ℹ️ uzak akraba, ✅ bilinen akrabalık yok
- Ana seçerken mevcut baba ile (ya da tersi) akrabalık da satırda gösterilir.
- Aynı kontrol Çiftleşme / doğum (39) koç katımı ekranında kullanılır.

## Veri
- `Animal.fatherId` eklendi (opsiyonel). Telefon veritabanına `father_id` sütunu göç ile eklenir. Web'de kayıt nesnesinde durur.
- İşlem kaydına "Baba" değişikliği olarak düşer. Değiştirme "Sürü ve ayarları düzenler" yetkisi ister (36).
- Excel / CSV: dışa aktarmada **Baba küpe** sütunu. İçe aktarmada "Baba küpe / koç küpe / sire" sütunu tanınır ve ana gibi küpeden bağlanır.
- Doğum kaydı `babaId` alırsa kuzulara babayı yazar.

## Kod
- `kaynak/soy/hesap.ts` (saf): soyAgaci, akrabalikHesaplayici (φ, kendileşme, yavru F, r), iliskiAdi, ciftlesmeKontrol, ebeveynDogrula, yavrular.
- `bilesenler/soy/HayvanSecici.tsx`, `KuzuSoyOzeti.tsx`; `app/hayvan/[id]/soy.tsx`.
- Test: `test/moduller/soy.ts` (öz/üvey kardeş, kuzen, ebeveyn, büyük ebeveyn değerleri; döngülü veri; 2000 hayvan performansı).

## Sınırlar
- Ebeveyn sürüde kayıtlı bir hayvan olmalı. Dışarıdan alınan koçun yalnız küpesi biliniyorsa önce hayvan olarak (ör. "satıldı" durumunda) eklenmeli.
- Akrabalık yalnız girilmiş bağlardan hesaplanır. Ata bilgisi eksikse gerçek akrabalık daha yüksek olabilir.
