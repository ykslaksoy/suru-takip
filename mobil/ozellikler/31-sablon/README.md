# 31 — Kayıt şablonları

- **Ekran:** `app/sablon/index.tsx` (Daha → Kayıt şablonları)
- **Mantık:** `kaynak/sablon/hesap.ts` (saf: adımlar, doğrulama, sıralama), `kaynak/sablon/depo.ts` (`sy_kayit_sablonlari_v1`), `kaynak/sablon/uygula.ts`
- Hazır şablonlar: **Giriş paketi** (tartım → ivermektin → albendazol → karma → selenyum-E), **Parazit tekrarı** (ivermektin → albendazol). Silinebilir / düzenlenebilir.
- Uygula → `TopluHayvanSecici` (Tümü / padok / küpe listesi) → tek dokunuş. Aşı ve parazit adımları `topluUygula` ile her kuzuya ayrı sağlık kaydı + stok düşümü; vitamin adımları vitamin kaydı.
- Tartım adımı kilo ister: şablon uygulanınca “Tartıma geç” ile seri tartım açılır (kilo uydurulmaz).
- Kullanıcı şablonu: ad + adım ekle (tartım, tüm aşı/parazit programları, vitaminler), ▲▼ sırala, ✕ çıkar. Aynı adım iki kez eklenemez.
- Test: `test/moduller/sablon.ts`
