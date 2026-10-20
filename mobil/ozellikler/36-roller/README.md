# 36 · Roller ve yetkiler (ekip)

## Nerede
- **Daha → Ekip ve yetkiler** (`/ekip`)
- Daha menüsünün üstünde aktif kullanıcı rozeti: "👤 Mehmet usta · Bakıcı · Değiştir ›"

## Roller ve varsayılan yetkiler
| Rol | Para / maliyet | Silme | Sürü + ayar düzenleme | Tedavi / aşı girişi |
|---|---|---|---|---|
| Sahip | ✓ (hep) | ✓ | ✓ | ✓ |
| Ortak | ✓ | ✓ | ✓ | ✓ |
| Bakıcı | ✕ | ✕ | ✕ | ✓ |
| Veteriner | ✕ | ✕ | ✕ | ✓ |

Sahip kişi başına her anahtarı ayrı açıp kapatabilir (ör. bakıcıya silme açmak). Sahip her şeyi yapar. En az bir Sahip her zaman kalır.

## Davranış
- **Cihaz profili**: bu telefonu/tableti kullanan kişiler. Kişiye dokun → aktif kullanıcı olur. İstenirse profile 4–6 haneli **PIN** konur; o profile geçerken sorulur. Bakıcının Sahip'e geçmemesi için Sahip'e PIN konmalı.
- Yalnız **Sahip** kişi ekler, çıkarır, rol ve yetki değiştirir. Herkes kendi PIN'ini değiştirebilir.
- **İşlem kaydı** (denetim) ve işlem günlüğü aktif kişinin adı ve rolüyle yazılır ("Mehmet usta (Bakıcı)"). Ekip değişiklikleri de kayda düşer.
- Kısıtlar:
  - **Para**: Maliyet ve Kâr ekranı kilitli; Satış'ta toplam ₺ alanı gizli; Yem ekranında ₺ "•••", yem alımı (₺/kg) yok; Excel'de Maliyetler sayfası yok.
  - **Silme**: kuzu kartında "Hayvanı Sil" yok; tartım, sağlık, poliçe, şablon ve rasyon silme ile kalıcı silme engelli (veri katmanında da korunur).
  - **Düzenleme**: kuzu kartında Parti değiştir ve Satış/çıkış yok; Satış ekranı, Excel içe aktarma, şablon ve rasyon kurma/düzenleme, Ayarlar kilitli.
  - **Tedavi**: kuzuya sağlık kaydı, toplu aşı/ilaç (Görevler → Aşı), şablon uygulama engelli.
- Kilitli ekran "🔒 Bu ekran için yetkin yok" gösterir ve Ekip'e (kullanıcı değiştir) götürür.

## Sınırlar (sunucu yok)
- Ekip **yalnız bu cihazda** tutulur; başka telefonda ayrı kurulur, kişiler ve kayıtlar cihazlar arasında eşitlenmez. Gerçek çok kullanıcı (ayrı hesap, uzaktan yetki) bir sunucu/senkron gerektirir.
- Yetkiler bu uygulamadaki ekranları ve işlemleri kısıtlar; veriyi **şifrelemez**. Tarayıcı geliştirici araçlarına erişen biri yerel veriyi görebilir. PIN özeti kriptografik değildir; gündelik geçişi korur.
- Kuzu notlarına elle yazılmış fiyatlar (ör. "Alım 9.150 ₺") not alanında görünmeye devam eder.

## Dosyalar
- `kaynak/ekip/hesap.ts` (saf), `kaynak/ekip/depo.ts`, `kaynak/ekip/kapi.ts` (veri katmanı yetki kapısı)
- `bilesenler/ekip/useEkip.ts`, `bilesenler/ekip/YetkiKapisi.tsx`
- `app/ekip/index.tsx`
- Test: `test/moduller/ekip.ts`
