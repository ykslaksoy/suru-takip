# SürüYön — Puzzle Klasör Haritası (Türkçe)

Her özellik bir **puzzle parçası**. Parçalar birbirine sadece `cekirdek` üzerinden bağlanır.

```
suruyon/
├── README.md
├── dokumanlar/
├── mobil/                 # Expo uygulama
├── islemler/              # Tik sistemi
├── araclar/
├── sunucu/                # ★ sonra
└── donanim/               # ★ sonra
```

## `mobil/src/` hedef puzzle (kaynak/ taşıması)

```
mobil/src/
├── cekirdek/              # db, senkron, kimlik, roller, api, tipler, ui
├── suru/
├── kilo/                  # tartım, ADG, FCR, kuzu-derece, DereceRozeti
├── saglik/
├── stok/
├── rasyon/
├── akilli-kuzu/
├── akilli-veteriner/
├── veteriner-koprusu/
├── besi-ortak/
├── besi-alim/             # Mod 1
├── besi-koc-kat/          # Mod 2
├── damizlik/              # Mod 3
├── sut/                   # Mod 4
├── excel/
├── ocr/
├── rfid/
├── ses/
├── turkvet/
├── abonelik/
├── donanim/
└── beta/
```

Şu an kod `mobil/kaynak/`, `mobil/bilesenler/`, `mobil/baglam/` altında.  
Parça haritaları: `mobil/ozellikler/` (her `islemler/XX` için README).  
Detay: `dokumanlar/urun/uygulama-agaci.md`
