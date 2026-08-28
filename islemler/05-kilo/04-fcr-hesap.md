---
status: DONE
kilitli: true
kilit_tarihi: 2026-08-28
---

# [x] FCR (kg yem / kg artış)


> **KİLİTLİ — TAMAM (şifre korumalı).** Değiştirmek için: `python3 islemler/scripts/kilit.py unlock <dosya>` + şifre.

> **AÇIK İŞLEM.** Tamamlanınca status=DONE yapılır, `[x]` konur, `kilitli: true` yazılır — sonra dokunulmaz.

**Klasör:** `05-kilo`  
**Bağımlı kod (varsa):** `—`

## Yapılacak
Yem tüketimi + tartım farkı ile FCR.

## Tamamlandı mı?
Kullanıcı veya agent **"bu işlem tamam"** dediğinde:
1. `status: DONE`
2. Başlık `[x]`
3. `kilitli: true`
4. Bu dosyaya bir daha yazma
