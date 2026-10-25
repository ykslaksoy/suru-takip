---
status: DONE
kilitli: true
kilit_tarihi: 2026-10-25
---

# [x] Besi programı motoru — faz 1 (MVP)


> **KİLİTLİ — TAMAM (şifre korumalı).** Değiştirmek için: `python3 islemler/scripts/kilit.py unlock <dosya>` + şifre.

**Klasör:** `22-mod1-kuzu-alarak-besi`  
**Spec:** proje store `docs/besi-programi-motoru-taslak.md`  
**Kod:** `mobil/kaynak/besi-programi/`, `mobil/kaynak/besi-alim/alim-girisi.ts`

## Faz 1 (bu iş)

- Kullanıcı hızlı kabul öncesi besi ufku seçer (90 veya 120 gün)
- `HIZLI_BESI_TAKVIM` + yem takvimi ufka göre kırpılır
- Mod takviye + yem görevleri + kabul sonrası rehber bu ufka bağlanır
- Görev zaman çizelgesi mevcut `/gorevler/*` rotalarına bağlı
- Önizleme: `hayvan/hizli-ekle/besi-programi`

## Sonraya (faz 2+)

- Dinamik rasyon dilimleri, alım maliyeti / hedef satış, ücretli formül
- Bulut senkron, padok/sürü birimi, veteriner uyarı metinleri
- Gün 1 seçimi ile motorun tam entegrasyonu (kısmi: görevler zaten gün 1 filtresi kullanıyor)

## Tamamlandı mı?

Kullanıcı **tamam** dediğinde: `python3 islemler/scripts/kilit.py tamamla 22-mod1-kuzu-alarak-besi/08-besi-programi-motor-faz1.md`
