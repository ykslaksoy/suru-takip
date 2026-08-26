# SürüYön — Uygulama Ağacı (grup grup · Türkçe)

> Tek kaynak. ASCII Türkçe adlar. Expo zorunluları: `app/`, `(tabs)/`, `_layout.tsx`.  
> **Derece:** Ölçülsün → Zayıf → Fit → Sportmen → Kaslı → Süper Kuzu

**Durum:** GRUPLARA AYRILDI (2026-08-26)

---

## A) Kök gruplar

```
suruyon/
├── mobil/           # uygulama
│   └── ozellikler/  # ★ parça kataloğu (araclar/ gibi)
├── dokumanlar/      # ürün / doğrulama / taslak
├── islemler/        # tik + kilit (her iş = 1 .md)
├── araclar/         # script şablonu (islem-kontrol)
├── sunucu/          # plan iskelet
└── donanim/         # plan iskelet
```

### Parça mantığı (`araclar/` ile aynı)

| Katman | Rol | Örnek |
|--------|-----|-------|
| `islemler/XX-.../` | Tik + şifre kilidi | `04-suru/01-suru-listesi.md` |
| `mobil/ozellikler/XX-.../` | Parça haritası (README) | `04-suru/README.md` |
| `mobil/kaynak/.../` | İş mantığı | `suru/tur.ts` |
| `mobil/bilesenler/.../` | UI | `suru/HayvanKarti.tsx` |
| `mobil/app/.../` | Ekran | `(tabs)/suru/index.tsx` |

Kural: parçalar birbirine değil, sadece `cekirdek` üzerinden bağlanır → `mobil/ozellikler/KURAL.md`

---

## B) 6 ana sekme + alt butonlar

```
mobil/app/(tabs)/
├── _layout.tsx
├── suru/index.tsx           # alt: Tümü · Dişi · Erkek · Kuzu
├── stok/index.tsx           # alt: Tümü · Yem · Aşı · İlaç
├── saglik/index.tsx         # alt: Kayıtlar · Aşı · Bekletme
├── rasyon/index.tsx         # alt: Hesapla · Akıllı öneri
├── veteriner/index.tsx      # alt: Semptom · Fotoğraf
└── akilli-kuzu/index.tsx    # alt: Öneriler · Abonelik · TÜRKVET · Beta · Daha
```

Ortak bileşen: `bilesenler/ortak/AltButonlar.tsx`

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

| Sekme | Alt butonlar | `kaynak/` | `bilesenler/` |
|-------|--------------|-----------|---------------|
| Sürü | Tümü / Dişi / Erkek / Kuzu | `suru/` + `kilo/` | `suru/` + `kilo/` |
| Stok | Tümü / Yem / Aşı / İlaç | `stok/` | `stok/` |
| Sağlık | Kayıtlar / Aşı / Bekletme | `saglik/` | ortak |
| Rasyon | Hesapla / Akıllı öneri | `rasyon/` | ortak |
| Vet | Semptom / Fotoğraf | `akilli-veteriner/` | ortak |
| Akıllı Kuzu | Öneriler / Abonelik / TÜRKVET / Beta | `akilli-kuzu/` | — |
