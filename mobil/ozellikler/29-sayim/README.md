# 29 — Sayım listesi

- **Ekran:** `app/sayim/index.tsx` (Daha → Sayım listesi)
- **Mantık:** `kaynak/sayim/hesap.ts` (saf), `kaynak/sayim/depo.ts` (`sy_sayim_aktif_v1` yarım sayım, `sy_sayim_gecmis_v1` geçmiş)
- Kapsam: tüm sürü veya tek padok · küpe / sırt no yaz + Enter (okuyucu gibi hızlı, odak kaybolmaz)
- Ses: `kaynak/ses` dinle → küpeler geri okunur → “tamam” (veya dokun) ile eklenir; birden çok küpe tek seferde söylenebilir
- Aynı kuzu iki kez sayılmaz (bildirim) · rapor: beklenen / sayılan / Eksik / Fazla / Başka padokta kayıtlı
- Test: `test/moduller/sayim.ts`
