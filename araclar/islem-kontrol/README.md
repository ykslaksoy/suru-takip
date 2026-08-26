# İşlem Kontrol Sistemi — Tüm Uygulamalar İçin

Bu paketi **her yeni uygulamaya** kopyalayın. Amaç:

1. Her iş = ayrı dosya  
2. **Tamam** → hemen **HTML rapor** + **şifre kilidi**  
3. Değişiklik → şifre ile unlock  
4. İstemeden değişmesin  

## Kurulum (yeni uygulama)

```bash
# uygulama kökünde
mkdir -p islemler/scripts
cp -R araclar/islem-kontrol/scripts/* islemler/scripts/
# işlem klasörlerinizi oluşturun (01-..., 02-...)
python3 islemler/scripts/kilit.py durum
python3 islemler/scripts/kilit.py set-password
python3 islemler/scripts/html_rapor.py rebuild
```

## Akış

```
İş bitti → "tamam"
    → markdown [x] + kilitli:true
    → HTML dosya (islemler/rapor/...)
    → panel index.html güncellenir

Değişiklik lazım
    → unlock + şifre
    → düzenle
    → kilitle (+ HTML yenilenir)
```

## Dosyalar

| Dosya | Görev |
|-------|--------|
| `scripts/kilit.py` | tamamla / unlock / kilitle / şifre |
| `scripts/html_rapor.py` | işlem başına HTML + kontrol paneli |
| `KURAL.md` | agent ve ekip kuralı |

## Agent kuralı (her uygulamada)

- `kilitli: true` dosyaya **şifresiz yazma**
- `tamamla` sonrası HTML üretildiğini doğrula
- Kullanıcı HTML panelden kontrol eder: `islemler/rapor/index.html`
