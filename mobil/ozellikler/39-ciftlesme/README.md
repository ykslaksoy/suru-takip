# 39 · Çiftleşme / doğum takibi

**Nerede:** Daha → **Çiftleşme ve doğum** (`/ciftlesme`). Dişi kuzu kartında "🐏 Çiftleşme / doğum" satırı (durum, koç, beklenen doğum). Hatırlatmalar **Görevler** (Diğer) ve **Takvim** (🐑 Üreme) ekranlarında.

## Akış
1. **Koç katımı / süngerleme** (`/ciftlesme/katim`), toplu giriş:
   - Yöntem: Koç katımı · Süngerleme + koç · Suni tohumlama.
   - Tarih: katım günü, süngerde sünger takma günü. Sünger süresi 12/13/14 gün seçilir; koç günü = çıkış + 2 gün (PMSG sonrası kızgınlık).
   - Gebelik süresi varsayılan **150 gün**, düzenlenebilir (140–160). Beklenen doğum anında gösterilir.
   - Bir koç seçilir. Koyunlar padok çipiyle süzülür, "✓ Görünenleri seç" ile toplu seçilir.
   - Her satırda koçla **akrabalık uyarısı** (Soy ağacı, 38) görünür. ⛔ yakın akrabalar toplu seçimde atlanır, elle seçilirse uyarı kalır.
   - Takipte olan koyun (sünger/katım/gebe) gri gösterilir ve iki kez kaydedilemez. Boş çıkan ya da doğurmuş koyun yeniden koça verilebilir.
2. **Ultrason** (`/ciftlesme/ultrason`): her koyun için tek dokunuşla **Boş / Gebe / İkiz / Üçüz**. Gün üstte bir kez girilir; katımdan 30 günden önceyse "erken olabilir" uyarısı çıkar. "Geri al" ile düzeltilir.
   - Gebe → hayvan durumu "Gebe". Boş → "Gebe" ise "Sağlıklı"ya döner.
3. **Doğum** (kuzu kartı → Doğum kaydı ya da listede "Doğum gir"):
   - Ultrason ikiz/üçüz dediyse form o kadar kuzu satırıyla açılır. **Baba = katımdaki koç** gelir, değiştirilebilir.
   - Ölü doğan sayısı girilebilir.
   - Kuzular **ana + baba bağlı** oluşur, doğum kilosu tartım olarak yazılır, anne "Sağmal" olur ve çiftleşme kaydı kapanır.
   - Kayıtsız doğumlar da istatistiğe girer (katım = doğum − 150 olarak geriye yazılır).

## Hatırlatmalar
| Ne | Ne zaman Görevler'de | Takvim |
|---|---|---|
| 🧽 Sünger çıkar | 1 gün önce + günü (geçince acil) | çıkış günü |
| 🔎 Ultrason zamanı | katım + 45 gün (60 güne kadar) | katım + 45 |
| 🐑 Doğum yaklaşıyor | doğuma ≤ 14 gün (≤ 3 gün acil) | beklenen doğum |
| ⏰ Doğum gecikti | beklenen + 7 gün geçince | — |

Aynı gün aynı iş tek satır olur ("Beklenen doğum · 4 koyun").

## Ana ekran
- Sayaçlar: Sünger takılı, Katım yapıldı, Gebe, Doğum gecikti, Doğurdu, Boş.
- **Gebelik oranı** (gebe / ultrasonu yapılan) ve **kuzu verimi** (doğan kuzu / doğuran koyun).
- Yaklaşanlar listesi, takipteki koyunlar (gecikti → gebe → katım → sünger sırasıyla), sonuçlananlar.
- Silme 30 gün geri dönüşüm kutusunda kalır ("Çiftleşme / doğum" türü).

## Yetki (36)
Katım planlama "Sürü ve ayarları düzenler" ister. Ultrason "Tedavi / aşı girer" ister (veteriner/bakıcı girebilir). Doğum kaydı yetki istemez. Silme "Kayıt silebilir" ister. Hepsi işlem kaydına yazılır.

## Kod
- `kaynak/ciftlesme/hesap.ts` (saf): tarihler, durum, toplu katım, hatırlatmalar, gruplama, özet.
- `kaynak/ciftlesme/kayit.ts` (`sy_ciftlesme_v1`), `depo.ts` (topluKatim, ultrasonGir, ciftlesmeliDogum, ciftlesmeSil).
- `app/ciftlesme/index.tsx`, `katim.tsx`, `ultrason.tsx`; `app/hayvan/[id]/dogum.tsx` (baba, ikiz ön dolum, ölü doğan).
- `bilesenler/ciftlesme/KoyunUremeOzeti.tsx`. Görevler: `kaynak/gorevler/liste.ts`; Takvim: `kaynak/takvim/depo.ts`.
- Test: `test/moduller/ciftlesme.ts`.

## Sınırlar
- Koç katımı koyun başına tek tarih tutar. Koçun sürüde kaldığı dönem (ör. 34 gün) ayrıca izlenmez; doğum tarihi tahminidir.
- Eski Mod 2 "katım" kayıtları (`sy_mod2_katimlar`, koç küpe + padok sayısı) bu ekrana taşınmadı.
