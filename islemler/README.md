# islemler/ — Tik + şifre kilit sistemi

## Kural (kesin)

1. **Her işlem = 1 dosya**
2. Açık: `[ ]` · `TODO` · `kilitli: false`
3. **Tamam** → `[x]` · `DONE` · `kilitli: true` · **şifre kilidi**
4. Kilitliyi değiştirmek = **şifre ile unlock** → düzenle → **kilitle**
5. Agent, kilitli dosyaya şifresiz **yazmaz**

## Şifre komutları

```bash
python3 islemler/scripts/kilit.py durum
python3 islemler/scripts/kilit.py set-password

python3 islemler/scripts/kilit.py tamamla islemler/22-mod1-kuzu-alarak-besi/04-karantina-yonca-su.md

python3 islemler/scripts/kilit.py unlock islemler/03-cekirdek/01-tipler.md
# …düzenle…
python3 islemler/scripts/kilit.py kilitle islemler/03-cekirdek/01-tipler.md

export SURUYON_ISLEM_SIFRE='...'
python3 islemler/scripts/kilit.py unlock <dosya>
```

**Varsayılan şifre (değiştirin):** `SuruYon2026!`

## HTML kontrol paneli

Her **tamam** sonrası otomatik HTML üretilir.

→ Tarayıcıda açın: **[rapor/index.html](./rapor/index.html)**

```bash
python3 islemler/scripts/html_rapor.py rebuild   # tüm paneli yenile
```

Tüm uygulamalar için şablon: `araclar/islem-kontrol/`

## Giriş

→ **[INDEX.md](./INDEX.md)**

## Klasörler

| Klasör | Konu |
|--------|------|
| `00-kural` | Kurallar + şifre kilidi |
| `01`–`02` | Doğrulama, wireframe |
| `03`–`09` | Core … okul |
| `10`–`11` | Vet AI + köprü |
| `12`–`14` | Abonelik, TÜRKVET, offline |
| `15`–`21` | Roller, Excel, RFID, OCR, ses… |
| `22`–`25` | Mod 1–4 |
| `26`–`27` | Beta, puzzle |
