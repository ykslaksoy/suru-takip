---
status: DONE
kilitli: true
kilit_tarihi: 2026-08-28
---

# [x] Sesli komut ile kayıt


> **KİLİTLİ — TAMAM (şifre korumalı).** Değiştirmek için: `python3 islemler/scripts/kilit.py unlock <dosya>` + şifre.

> **AÇIK İŞLEM.** Tamamlanınca status=DONE yapılır, `[x]` konur, `kilitli: true` yazılır — sonra dokunulmaz.

**Klasör:** `20-ses`  
**Kod:** `mobil/kaynak/ses/`

## Zorunlu akış (geri okuma + onay)

```
Kullanıcı konuşur
      ↓
Sistem ayıklar (komutAyikla)
      ↓
Geri okur (TTS): "Tartım: küpe 1234, 68 kilo. Onaylamak için tamam de."
      ↓
Kullanıcı "tamam" der mi?
   ├─ EVET → kayıt yap (komutuUygula)
   ├─ "iptal" → vazgeç
   └─ HAYIR → yeni komut bekle
```

**Kural:** Onay olmadan veritabanına **yazılmaz**.

## Desteklenen komut örnekleri

| Söylenen | Eylem |
|----------|--------|
| küpe 1234, 68 kilo | Tartım kaydı |
| küpe TR-34-001234 aşı clostridial | Aşı kaydı |
| stok giriş arpa 50 kg | Stok hareketi |

## Onay / red kelimeleri

- **Onay:** tamam, evet, onayla, kaydet, olur, doğru…
- **Red:** iptal, hayır, vazgeç, yanlış, tekrar…

## Kod dosyaları

| Dosya | Görev |
|-------|--------|
| `oturum.ts` | SesKomutOturumu — durum makinesi |
| `komut.ts` | Metinden komut ayıklama |
| `onay.ts` | tamam / iptal algılama |
| `geri-okuma.ts` | Okunacak özet metin |
| `uygula.ts` | Onay sonrası DB yazımı |

## Sonraki adım

- Native STT/TTS bağlantısı (`expo-speech` / platform STT)
- Ahır modu + seri tartım entegrasyonu

## Tamamlandı mı?

Kullanıcı veya agent **"bu işlem tamam"** dediğinde:
1. `status: DONE`
2. Başlık `[x]`
3. `kilitli: true`
4. Bu dosyaya bir daha yazma
