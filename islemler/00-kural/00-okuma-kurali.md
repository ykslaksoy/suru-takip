---
status: DONE
kilitli: true
---

# [x] İşlem dosyası kuralları (şifre kilidi)

> **KİLİTLİ — TAMAM (şifre korumalı).** Değiştirmek için unlock + şifre.

**Klasör:** `00-kural`

## Kurallar

1. Her işlem = **1 dosya** (`islemler/` altında)
2. Açık: `[ ]` · `status: TODO` · `kilitli: false`
3. **Tamam** dendiğinde:
   - `[x]` · `status: DONE` · `kilitli: true`
   - **Şifre kilidi** aktif
4. Kilitli dosyayı değiştirmek için:
   ```bash
   python3 islemler/scripts/kilit.py unlock <dosya.md>
   # şifre sorulur (veya SURUYON_ISLEM_SIFRE)
   # düzenle…
   python3 islemler/scripts/kilit.py kilitle <dosya.md>
   ```
5. Agent: `kilitli: true` dosyaya **şifresiz yazmaz**. Unlock oturumu yoksa dokunmaz.
6. Tercihen: düzeltme = **yeni işlem dosyası**; eski DONE kilitli kalır.

## Komutlar

| Komut | Ne yapar |
|-------|----------|
| `set-password` | Şifreyi değiştir |
| `tamamla <dosya>` | Tamamla + kilitle |
| `unlock <dosya>` | Şifre ile geçici aç |
| `kilitle <dosya>` | Tekrar kilitle |
| `check <dosya>` | Düzenlenebilir mi? |
| `durum` | Özet |

## Varsayılan şifre

İlk kurulum: `SuruYon2026!`  
**Hemen değiştirin:** `python3 islemler/scripts/kilit.py set-password`
