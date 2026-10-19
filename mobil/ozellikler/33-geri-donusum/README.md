# 33 · Geri dönüşüm kutusu + İşlem kaydı

## Nerede
- **Daha → Geri dönüşüm kutusu** (`/gecmis?sekme=cop`)
- **Daha → İşlem kaydı** (`/gecmis?sekme=kayit`)
- Kuzu kartı → Hayvanı Sil; Sağlık / Tartım listelerinde satır başına **Sil**; Sigorta poliçesi ve kayıt şablonu silme.

## Davranış
- Silinen her şey önce **geri dönüşüm kutusuna** gider; 30 gün sonra kendiliğinden kalıcı silinir. Her satır "N gün sonra kalıcı silinir" yazar.
- Kuzu silinince tartım ve sağlık kayıtları da birlikte saklanır; **Geri al** hepsini geri getirir.
- **Kalıcı sil** onay ister ve işlem kaydına yazılır.
- **İşlem kaydı** veri katmanında tutulur (`kaynak/cekirdek/denetim.ts`): kuzu, sağlık, tartım, stok ve stok hareketi için her ekleme / değişiklik / silme; kim, ne zaman, alan bazında eski → yeni. Tablo filtresi, son 3000 kayıt.
- "Kim" şimdilik "Bu cihaz"; Roller özelliği (36) aktif kullanıcıyı bağlar (`setDenetimKimSaglayici`, `setGunlukKimSaglayici`).
- Yeni çöp türleri (foto, yem, üreme) `copGeriYukleyiciBagla` ile kayıt olur.

## Dosyalar
- `kaynak/cekirdek/denetim-hesap.ts` (saf), `kaynak/cekirdek/denetim.ts` (depo)
- `kaynak/gecmis/cop.ts`, `kaynak/gecmis/hayvan-sil.ts`, `kaynak/gecmis/gunluk.ts`
- `app/gecmis/index.tsx`
- Test: `test/moduller/geri-donusum.ts`

## Ek düzeltmeler
- Vercel'de `/hayvan/<id>` gibi dinamik linkler doğrudan açılınca 404 veriyordu. `scripts/vercel-dinamik.js` köşeli parantezli HTML'leri `_id` adına kopyalar, `vercel.json` rewrites oraya yönlendirir.
- Örnek rasyon stokları her açılışta tekrar ekleniyordu (çift stok kalemi); artık aynı adlı kalem varsa eklenmiyor.
