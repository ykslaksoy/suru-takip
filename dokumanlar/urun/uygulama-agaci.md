# SürüYön — Uygulama Ağacı (kanonik · Türkçe)

> Tek kaynak. Dosya/klasör adları **ASCII Türkçe** (ı→i, ğ→g, ü→u, ş→s, ö→o, ç→c).  
> Expo zorunluları aynen: `app/`, `(tabs)/`, `_layout.tsx`, `+html.tsx`, `+not-found.tsx`.

**Durum:** YAPI TÜRKÇELEŞTİRİLDİ (2026-08-26)  
**Derece skalası (kilitli):** Ölçülsün → Zayıf → Fit → Sportmen → Kaslı → Süper Kuzu

---

## 1) Kök

```
suruyon/
├── README.md
├── AGENTS.md
├── mobil/                    # Expo uygulama
├── dokumanlar/               # Ürün / doğrulama / taslak
├── islemler/                 # Tik + şifre kilidi
├── araclar/                  # Yardımcı scriptler
├── sunucu/                   # ★ sonra — bulut API
└── donanim/                  # ★ sonra — RFID katalog
```

---

## 2) `mobil/` — mevcut

```
mobil/
├── app.json
├── package.json
├── tsconfig.json
│
├── app/                              # Expo Router (zorunlu ad)
│   ├── _layout.tsx
│   ├── +html.tsx
│   ├── +not-found.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                 # Sürü
│   │   ├── stok.tsx
│   │   ├── saglik.tsx
│   │   ├── akilli-kuzu.tsx
│   │   └── menu.tsx
│   ├── hayvan/
│   │   ├── ekle.tsx
│   │   ├── [id].tsx
│   │   └── [id]/
│   │       ├── kilo.tsx
│   │       └── saglik.tsx
│   ├── rasyon.tsx
│   ├── veteriner.tsx
│   ├── abonelik.tsx
│   ├── beta.tsx
│   └── turkvet-aktar.tsx
│
├── kaynak/                           # İş mantığı
│   ├── tipler.ts
│   ├── veritabani.ts
│   ├── veritabani.native.ts
│   ├── veritabani.web.ts
│   ├── ornek-veri.ts
│   ├── rasyon.ts
│   ├── abonelik.ts
│   ├── turkvet.ts
│   ├── akilli-veteriner.ts
│   ├── egitim.ts
│   ├── akilli-kuzu.ts
│   └── kuzu-derece.ts
│
├── bilesenler/
│   ├── HayvanKarti.tsx
│   ├── DereceRozeti.tsx
│   ├── KiloGrafigi.tsx
│   ├── StokKarti.tsx
│   ├── CevrimdisiBanner.tsx
│   ├── AnaButon.tsx
│   ├── DisBag.tsx
│   ├── Temali.tsx
│   ├── StilMetin.tsx
│   ├── useRenkSemasi.ts(.web)
│   └── useSadeceIstemci.ts(.web)
│
├── baglam/
│   ├── VeritabaniBaglami.tsx
│   └── AbonelikBaglami.tsx
│
├── sabitler/
│   └── Renkler.ts
│
└── varliklar/
    ├── fonts/
    └── images/
```

---

## 3) `dokumanlar/`

```
dokumanlar/
├── urun/
│   ├── urun-modlari.md
│   ├── uygulama-agaci.md          # BU DOSYA
│   ├── puzzle-klasor-haritasi.md
│   ├── mod1-kuzu-alarak-besi.md
│   ├── mod2-koc-katarak-besi.md
│   ├── mod3-damizlik-kuzu.md
│   ├── mod4-sut-koyunculugu.md
│   ├── akilli-veteriner-koprusu.md
│   └── offline-roller-rfid.md
├── dogrulama/
├── ekran-taslaklari/
├── beta/
└── para-kazanma/
```

---

## 4) Hedef puzzle (`mobil/src/` — sonra)

İngilizce puzzle adları **Türkçeleştirildi**:

| Eski (EN) | Yeni (TR) |
|-----------|-----------|
| core | cekirdek |
| flock | suru |
| weight | kilo |
| health | saglik |
| stock | stok |
| ration | rasyon |
| school | akilli-kuzu |
| vetAI | akilli-veteriner |
| vetBridge | veteriner-koprusu |
| fatteningShared | besi-ortak |
| fatteningBuy | besi-alim |
| fatteningBreed | besi-koc-kat |
| breedingStock | damizlik |
| dairy | sut |
| billing | abonelik |
| hardware | donanim |
| excel | excel |
| ocr | ocr |
| rfid | rfid |
| voice | ses |
| turkvet | turkvet |
| beta | beta |

Ekranlar (eklenecek):

```
app/besi/           # Mod 1–2 rehber
app/ahir/           # Seri ahır
app/sut/            # Mod 4
app/veteriner/      # Vet köprüsü
```

---

## 5) Bilinçli İngilizce kalanlar

| Ad | Neden |
|----|--------|
| `app/` | Expo Router zorunlu |
| `(tabs)/` | Expo Router grup |
| `_layout.tsx`, `+html.tsx`, `+not-found.tsx` | Expo sözdizimi |
| `index.tsx` | Varsayılan rota |
| `package.json`, `tsconfig.json`, `node_modules/` | Araç zinciri |
| `beta`, `turkvet`, `rfid`, `ocr`, `excel` | Marka / uluslararası kısaltma |

---

## 6) Çıkarılanlar

- `EditScreenInfo.tsx`, `wireframes.tsx`
- Eski docs: `mode1-besi…`, `mode2-sut…`
- `components/`, `lib/`, `context/`, `constants/`, `assets/` → Türkçe karşılıkları
