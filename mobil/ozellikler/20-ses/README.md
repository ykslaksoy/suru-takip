# 20 — Sesli Komut

**İşlemler:** [`islemler/20-ses/`](../../../islemler/20-ses/)

## Zorunlu kural

**Geri okuma → "tamam" onayı → kayıt.** Onaysız işlem yapılmaz.

```
Konuş → Ayıkla → Sesle oku → "tamam" bekle → Uygula
```

## Kod yolları

| Katman | Yol |
|--------|-----|
| kaynak | `mobil/kaynak/ses/` |

## Dosyalar

| Dosya | Görev |
|-------|--------|
| `tipler.ts` | Komut tipleri |
| `komut.ts` | Metin → eylem ayıklama |
| `onay.ts` | tamam / iptal kelimeleri |
| `geri-okuma.ts` | TTS özet metni |
| `oturum.ts` | SesKomutOturumu |
| `uygula.ts` | Onay sonrası DB |
| `index.ts` | Public API |

## Kullanım

```typescript
import { sesKomutOturumuOlustur } from '@/kaynak/ses';

const oturum = sesKomutOturumuOlustur();

// 1. komut
const r1 = await oturum.metinAl('küpe 1234, 68 kilo');
// r1.asama === 'onay_bekliyor'
// r1.okumaMetni → TTS ile oku

// 2. onay
const r2 = await oturum.metinAl('tamam');
// r2.asama === 'uygulandi' → kayıt yapıldı
```

## Bağımlılık

- Sadece `03-cekirdek` (veritabani)
- Diğer parçalara doğrudan import yok
