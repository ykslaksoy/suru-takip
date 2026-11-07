# Besi şekli · padok planı (kapalı besi)

**Durum:** uygulandı (PR: `cursor/besi-sekli-padok-plani-09a5`)  
**kilitli:** false

## Özet

- Besi şekli kalıcı kaynak: `sy_asi_profil_v1` (`asi-modu` profili).
- Kapalı (`ic`): sürü ekranı harita girişi → **Padok planı** (`/padok-plani`); mera taşıma/otlatma panelleri gizli.
- Açık/karışık: **Mera haritası** (`/mera`); mevcut otlatma özellikleri korunur.
- GPS/konum yoksa uydurma koordinat üretilmez (`meraHaritaPadoklarlaSenkron({ uretimKoordinat: false })`).

## Test

```bash
cd mobil && npx tsx test/index.ts
```

Modül: `test/moduller/besi-sekli-padok-plani.ts`
