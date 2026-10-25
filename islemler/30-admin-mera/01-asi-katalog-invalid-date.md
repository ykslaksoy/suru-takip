# Aşı katalog — Invalid Date düzeltmesi

**Durum:** uygulandı

## Sorun
Karma aşı katalog detayında `recordedAt` tam ISO olduğunda «Son uygulama (sürü): Invalid Date».

## Çözüm
- `mobil/kaynak/gorevler/tarih.ts` — `tarihGunKismi`, `tarihZamani`
- `gorevTarihMetni` geçersiz tarihte `—`
- `asi-katalog.ts` son uygulama karşılaştırması ISO uyumlu
- Test: `mobil/test/moduller/tarih.ts`
