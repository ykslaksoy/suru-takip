# Rasyon · stok ayrımı UX

**Durum:** uygulandı (PR: `cursor/rasyon-stok-ux-09a5`)  
**kilitli:** false

## Bulgu (t277u/t278u)

«Hazır rasyon» şablon yüzdeleri stok eşleşmesi olmadan tek listede gösteriliyordu; besin kontrolü tam şablona göre «uygun» görünebiliyordu. «Uygula» stokta olmayan kalemler için 0 kg stok kaydı açıyordu.

## Düzeltme

- Varsayılan mod: **Stokla plan** (adım: padok → dönem → stoktaki yemler).
- **Referans şablon**: bilgi amaçlı; eksikler «Alış listesi»; besin kontrolü stok kalemleri için ayrı.
- `adliRasyonUygula`: varsayılan stokta olmayanı atlama; tam kayıt için miktar doğrulama.
- `hazirSablonStokPlani` (`kaynak/rasyon/stok-plan.ts`): yeniden oranlama yok.

## Test

```bash
cd mobil && npx tsx test/index.ts
```

Modül: `rasyon-stok-plan`

## Yem kaynağı vs faz (t283u)

- Tercih: çiftlik üretim karışımı / ticari hazır yem / her ikisi (`sy_besleme_yem_kaynagi_v1`).
- Besleme dönemi (faz) ayrı etiket; `besi-baslangic` → «Erken besi dönemi» çiftlik şablonu, ticari starter değil.
- Tam yem yalnız `tam:evet` / `tam:etiket` stok notu; isimden çıkarım yok.
- Gözlem padokunda otomatik kg önerisi yok; padok notu adaptasyon bilgisi olarak gösterilir.

## Varış ve uyum beslemesi (t284u)

- İsteğe bağlı plan: 2–3 gün, `sy_uyum_besleme_v1`, yalnız kullanıcı kaydı.
- Süre bitişi → inceleme gerekir; iştah/dışkı/rumen/genel notu + onay; otomatik rasyon/besi geçişi yok.

## Gözlem inceleme akışı (t285u/t286u)

- Faz etiketi: **Varış sonrası gözlem ve uyum** (başlangıç fazı karantina değil).
- Süre sonu: kullanıcı **uzat** (inceleme tarihi), **besiye geçiş** veya **şüphe → karantina** (seçili hayvanlar).
- Zamanlayıcı ile otomatik sağlık onayı, besi geçişi veya karantina yok.
- Karantina: mevcut padok/sağlık kaydı (`checkup`, boş teşhis); geçmiş padok notları relabel edilmez.
- Veteriner: mevcut tedavi/takip özeti; plan yoksa «eylem gerekli»; otomatik doz/ilaç yok.
- Uzatma aktif uyum planını korur; karar geçmişi `incelemeKararlari`.
- Test: `rasyon-uyum-inceleme`.

## Grup bölme incelemesi (t287u)

- Aynı gelen grupta incelemede alt kümeler: normal padok, gözlem uzatma, karantina şüphesi — bireysel/alt küme; toplu sessiz taşıma yok.
- Hedef padok kapasite kontrolü; çift seçim yok; kısmi taşıma hatası yüzeye çıkar, idempotent yeniden deneme.
- `hayvanUyumTakibi` ve `incelemeOturumlari` denetimi; konumdan besi/klinik planı çıkarılmaz.
- Test: `rasyon-uyum-bolme`.

## Padok bağlamı (t279u)

- Seçili padok kartı: kayıtlı aktif plan + son gerçek düşüm; «Aktif rasyon yok» / «Henüz yemleme kaydı yok».
- Plan/şablon oluşturma ayrı akış; şablon seçimi kayıtlı plan değil.
- Yeni düşüm kayıtlarında `anlik` plan görüntüsü (eski kayıtlar değişmez).

## Sınırlar

- Otomatik yem ikamesi / ticari besleme servisi yok.
- Kısmi plan kaydı besin dengesi iddiası taşımaz.
