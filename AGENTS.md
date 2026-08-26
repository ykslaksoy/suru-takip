# Agent kuralları — SürüYön / tüm uygulamalar

## İşlem kilidi + HTML (zorunlu)

1. Her iş → `islemler/**/*.md` ayrı dosya
2. Kullanıcı **tamam** derse:
   ```bash
   python3 islemler/scripts/kilit.py tamamla <dosya.md>
   ```
   → şifre kilidi + **hemen HTML** (`islemler/rapor/...`)
3. Kilitli dosyayı değiştirmek için şifre:
   ```bash
   python3 islemler/scripts/kilit.py unlock <dosya.md>
   ```
4. `kilitli: true` dosyaya unlock olmadan **YAZMA**
5. Kullanıcı kontrolü: `islemler/rapor/index.html` dosyasını açar

Yeni uygulamalarda: `araclar/islem-kontrol/` kopyala.
