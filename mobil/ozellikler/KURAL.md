# Özellik parçası kuralı (puzzle)

> `araclar/islem-kontrol/KURAL.md` ile aynı mantık: **her özellik = ayrı parça**, tek giriş noktası.

## 1) Bağlantı kuralı

- Parçalar **birbirine doğrudan import etmez**.
- Ortak ihtiyaç → sadece `03-cekirdek` (`mobil/kaynak/cekirdek/`).
- UI paylaşımı → sadece `bilesenler/ortak/`.

## 2) Klasör eşlemesi (her parça)

```
ozellikler/XX-ad/
├── README.md          ← bu parçanın haritası (araclar/README gibi)
├── kaynak/            ← iş mantığı  → mobil/kaynak/<ad>/
├── bilesenler/        ← UI          → mobil/bilesenler/<ad>/
└── app/               ← ekranlar    → mobil/app/<rota>/
```

## 3) Public API

Her `kaynak/<ad>/index.ts` dışarıya tek kapı. Ekranlar ve diğer parçalar **yalnızca index'ten** import eder.

## 4) İşlem dosyası eşleşmesi

Her parça `islemler/XX-.../` checklist'ine bağlıdır. Kod bitince:

```bash
python3 islemler/scripts/kilit.py tamamla islemler/XX-.../YY-dosya.md
```

## 5) Agent kuralı

- Kilitli işlem dosyasına şifresiz yazma.
- Parça dışına logic taşıma (cekirdek istisna).
- Yeni dosya → doğru parça README'sine ekle.

## 6) Arayüz dili

- Kullanıcıya görünen **tüm** metinler Türkçe olmalı (buton, uyarı, yer tutucu, sekme, başlık).
- Kısa terimler (ADG, FCR, T1, SKT, GEKİS, JSON vb.) **kısaltma + parantez içinde açıklama** ile gösterilir — `mobil/sabitler/Metinler.ts` → `terim()`.
- Marka dereceleri Fit / Sportmen de aynı kurala tabidir.
