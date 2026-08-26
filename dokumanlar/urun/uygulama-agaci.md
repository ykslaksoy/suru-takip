# SürüYön — Uygulama Ağacı (grup grup · Türkçe)

> Tek kaynak. ASCII Türkçe adlar. Expo zorunluları: `app/`, `(tabs)/`, `_layout.tsx`.  
> **Derece:** Ölçülsün → Zayıf → Fit → Sportmen → Kaslı → Süper Kuzu

**Durum:** GRUPLARA AYRILDI (2026-08-26)

---

## A) Kök gruplar

```
suruyon/
├── mobil/           # uygulama
├── dokumanlar/      # ürün / doğrulama / taslak
├── islemler/        # tik + kilit
├── araclar/         # script
├── sunucu/          # ★ sonra
└── donanim/         # ★ sonra
```

---

## B) Sekmeler — her biri kendi klasörü

```
mobil/app/(tabs)/
├── _layout.tsx
├── suru/
│   └── index.tsx              # Sürü listesi
├── stok/
│   └── index.tsx              # Stok listesi / gir-çık
├── saglik/
│   └── index.tsx              # Sağlık özeti / bekletme
├── akilli-kuzu/
│   └── index.tsx              # Öneri merkezi (ders listesi YOK)
└── menu/
    └── index.tsx              # Menü
```

---

## C) Hayvan grubu

```
mobil/app/hayvan/
├── ekle.tsx
├── [id].tsx                   # detay + derece
└── [id]/
    ├── kilo.tsx               # tartım
    └── saglik.tsx             # hayvan sağlık kayıtları
```

---

## D) Diğer ekran grupları (menüden)

```
mobil/app/
├── rasyon/index.tsx
├── veteriner/index.tsx
├── abonelik/index.tsx
├── beta/index.tsx
└── turkvet-aktar/index.tsx
```

---

## E) Kaynak — iş mantığı grupları

```
mobil/kaynak/
├── cekirdek/                  # herkes buna bağlanır
│   ├── tipler.ts
│   ├── veritabani.ts
│   ├── veritabani.native.ts
│   ├── veritabani.web.ts
│   └── ornek-veri.ts
│
├── suru/                      # sürü yardımcıları (büyüycek)
│   └── index.ts
│
├── kilo/                      # tartım / ADG / derece
│   └── kuzu-derece.ts
│
├── stok/                      # stok iş mantığı (büyüycek)
│   └── index.ts
│
├── saglik/                    # hastalık / aşı / bekletme (büyüycek)
│   └── index.ts
│
├── akilli-kuzu/               # rehber + içerik
│   ├── oneri.ts
│   └── egitim.ts
│
├── rasyon/
│   └── hesapla.ts
│
├── akilli-veteriner/
│   └── analiz.ts
│
├── abonelik/
│   └── limit.ts
│
└── turkvet/
    └── dogrula.ts
```

---

## F) Bileşen grupları

```
mobil/bilesenler/
├── ortak/                     # paylaşılan UI
│   ├── AnaButon.tsx
│   ├── CevrimdisiBanner.tsx
│   ├── DisBag.tsx
│   ├── Temali.tsx
│   ├── StilMetin.tsx
│   ├── useRenkSemasi.ts(.web)
│   └── useSadeceIstemci.ts(.web)
│
├── suru/
│   └── HayvanKarti.tsx
│
├── kilo/
│   ├── DereceRozeti.tsx
│   └── KiloGrafigi.tsx
│
└── stok/
    └── StokKarti.tsx
```

---

## G) Bağlam + sabitler + varlıklar

```
mobil/baglam/
├── VeritabaniBaglami.tsx
└── AbonelikBaglami.tsx

mobil/sabitler/
└── Renkler.ts

mobil/varliklar/
├── fonts/
└── images/
```

---

## H) Dokümanlar

```
dokumanlar/
├── urun/                      # modlar + bu ağaç
├── dogrulama/
├── ekran-taslaklari/
├── beta/
└── para-kazanma/
```

---

## I) Hedefte eklenecek gruplar (klasör yerleri hazır değil / sonra)

```
app/besi/                      # Mod 1–2 rehber
app/ahir/                      # seri ahır
app/sut/                       # Mod 4
app/veteriner/vaka/            # vet köprüsü

kaynak/besi-ortak/
kaynak/besi-alim/
kaynak/besi-koc-kat/
kaynak/damizlik/
kaynak/sut/
```

---

## Sekme ↔ klasör eşlemesi

| Sekme | `app/(tabs)/` | `kaynak/` | `bilesenler/` |
|-------|---------------|-----------|---------------|
| Sürü | `suru/` | `suru/` + `kilo/` | `suru/` + `kilo/` |
| Stok | `stok/` | `stok/` | `stok/` |
| Sağlık | `saglik/` | `saglik/` | (ortak + hayvan/saglik) |
| Akıllı Kuzu | `akilli-kuzu/` | `akilli-kuzu/` | — |
| Menü | `menu/` | — | `ortak/` |
