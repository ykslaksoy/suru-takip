# Agent / ekip kuralı — İşlem kilidi (tüm uygulamalar)

1. Her yapılan iş için `islemler/` altında **ayrı bir `.md` dosyası** olur.
2. Kullanıcı **“tamam”** derse:
   ```bash
   python3 islemler/scripts/kilit.py tamamla <dosya.md>
   ```
   Bu komut:
   - `[x]` + `kilitli: true` yazar
   - **Hemen HTML rapor** üretir (`islemler/rapor/...`)
   - Kontrol paneli `islemler/rapor/index.html` güncellenir
3. Kilitli dosyayı değiştirmek için **şifre zorunlu**:
   ```bash
   python3 islemler/scripts/kilit.py unlock <dosya.md>
   # düzenle
   python3 islemler/scripts/kilit.py kilitle <dosya.md>
   ```
4. Agent, `kilitli: true` ve unlock oturumu olmayan dosyaya **yazmaz**.
5. Bu kural SürüYön dahil **tüm uygulamalar** için geçerlidir.
