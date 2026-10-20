# 30 — İlaç arınma süresi (kesim yasağı)

- **Mantık:** `kaynak/arinma/hesap.ts` (saf), `kaynak/arinma/depo.ts` (`sy_arinma_ayar_v1` — kullanıcı düzeltmeleri)
- **Tablo:** stok kataloğundaki her ilaç / aşı / enjeksiyon takviyesi için et arınma günü. Katalogda prospektüs değeri yoktu → tüm varsayılanlar **tahmini** (tipik prospektüs değeri); kullanıcı düzeltirse “senin değerin”.
- **Hesap:** sağlık kaydının ilaç / tedavi metni tabloyla eşleşir (Türkçe ad, etken madde, ticari ad). Kayıtta elle bekletme günü girildiyse **büyük olan** esas alınır. Bitiş = uygulama günü + gün; o güne kadar kesilemez. Hayvan başına en geç biten arınma.
- **Ekranlar:** `app/arinma/index.tsx` (Daha → İlaç arınma süreleri: arınmadaki kuzular + düzenlenebilir tablo), `app/satis/index.tsx` (Daha → Satış / çıkış: toplu Satış / Kesim / Ölüm; arınmadakiler için kırmızı uyarı, “Arınmadakileri çıkar” veya onaylı “Yine de hepsini kaydet”)
- **Kuzu kartı:** “🚫 GG.AA.YYYY tarihine kadar kesilemez · ilaç · N gün” + “Satış / çıkış” düğmesi
- **Görevler / Bugün:** her arınmadaki kuzu bir satır; Bugün’de “🚫 Arınma süresi” özeti. Sağlık sekmesi “Arınma”.
- Vercel: dinamik rotalar (`/hayvan/:id` vb.) için `vercel.json` rewrites eklendi — doğrudan açılan kuzu kartı linki artık 404 vermez.
- Test: `test/moduller/arinma.ts`
