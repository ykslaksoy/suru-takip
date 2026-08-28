---
status: DONE
kilitli: true
kilit_tarihi: 2026-08-28
---

# [x] Gerçek sunucu push/pull senkron


> **KİLİTLİ — TAMAM (şifre korumalı).** Değiştirmek için: `python3 islemler/scripts/kilit.py unlock <dosya>` + şifre.

> **AÇIK İŞLEM.** Tamamlanınca status=DONE yapılır, `[x]` konur, `kilitli: true` yazılır — sonra dokunulmaz.

**Klasör:** `14-offline-senkron`  
**Bağımlı kod (varsa):** `—`

## Yapılacak
server API + conflict çözümü.

## Tamamlandı mı?
Kullanıcı veya agent **"bu işlem tamam"** dediğinde:
1. `status: DONE`
2. Başlık `[x]`
3. `kilitli: true`
4. Bu dosyaya bir daha yazma
