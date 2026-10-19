# 32 — Takvim

- **Ekran:** `app/takvim/index.tsx` (Daha → Takvim) — Ay görünümü (Pzt başlar, gün hücresinde olay simgeleri) + Ajanda (son 14 gün, gelecek 60 gün). Türe göre filtre.
- **Mantık:** `kaynak/takvim/hesap.ts` (saf: olay üretimi, gruplama, ay ızgarası, ajanda), `kaynak/takvim/depo.ts` (kaynakları toplar)
- **Otomatik olaylar (elle giriş yok):** geçmiş aşı / tedavi (aynı gün + aynı ilaç = tek satır, “20 kuzu”), tartımlar (günlük, ortalama kg), arınma bitişleri, sigorta bitişleri, Görevler’deki tarihli işler (“Yapılacak: …”; stok uyarıları hariç), üreme hatırlatmaları (özellik 35).
- Dokununca: tek kuzuluk olay → kuzu kartı; toplu olay → Sağlık / Seri tartım / Arınma / Sigorta / ilgili görev.
- `getAllWeightRecords()` web + native veritabanına eklendi.
- Test: `test/moduller/takvim.ts`
