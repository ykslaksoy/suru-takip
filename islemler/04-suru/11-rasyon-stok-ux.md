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

## Padok bağlamı (t279u)

- Seçili padok kartı: kayıtlı aktif plan + son gerçek düşüm; «Aktif rasyon yok» / «Henüz yemleme kaydı yok».
- Plan/şablon oluşturma ayrı akış; şablon seçimi kayıtlı plan değil.
- Yeni düşüm kayıtlarında `anlik` plan görüntüsü (eski kayıtlar değişmez).

## Sınırlar

- Otomatik yem ikamesi / ticari besleme servisi yok.
- Kısmi plan kaydı besin dengesi iddiası taşımaz.
