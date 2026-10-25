---
status: DONE
kilitli: true
kilit_tarihi: 2026-10-25
---# [x] Aşı katalog — Invalid Date düzeltmesi


> **KİLİTLİ — TAMAM (şifre korumalı).** Değiştirmek için: `python3 islemler/scripts/kilit.py unlock <dosya>` + şifre.

**Durum:** uygulandı

## Sorun
Karma aşı katalog detayında `recordedAt` tam ISO olduğunda «Son uygulama (sürü): Invalid Date».

## Çözüm
- `mobil/kaynak/gorevler/tarih.ts` — `tarihGunKismi`, `tarihZamani`
- `gorevTarihMetni` geçersiz tarihte `—`
- `asi-katalog.ts` son uygulama karşılaştırması ISO uyumlu
- Test: `mobil/test/moduller/tarih.ts`
