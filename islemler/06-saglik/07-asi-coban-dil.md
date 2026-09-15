---
status: TODO
kilitli: false
---

# [ ] Aşı doz metinleri — çoban dili (Saha UX)

**Klasör:** `06-saglik`  
**Kod:** `mobil/kaynak/cekirdek/asi-programi.ts`, `mobil/kaynak/akilli-veteriner/vitamin-programi.ts`, `mobil/app/gorevler/kategori/[id].tsx`, stok/katalog + görev UI

## Ne yapılacak

1. Kullanıcıya görünen doz satırlarından lab jargonu kaldır: `%1`, `etiket`, `tablet gücü`, `sabit`, `(SC)`, `(IM)`, `oral`
2. Çoban dili: `Her 10 kiloya 0,2 ml iğne · boyun deri altı` / `Her 10 kiloya 1 hap · ağızdan` / `Her kuzuya 2 ml · boyun deri altı`
3. Liste başlığına kilo kuralı: `Doz, kuzunun kilosuna göre. Örnek: 20 kg → iki katı.`
4. Docs `docs/ilk-kuzu-asi-gunluk.md` + temp tunnel ekran görüntüleri

## Tamamlandı mı?

Kullanıcı **"tamam"** dediğinde `kilit.py tamamla` ile kilitle.
