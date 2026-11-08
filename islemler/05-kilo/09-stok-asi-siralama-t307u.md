---
baslik: Stok aşı listesi sıralama (t307u)
durum: uygulanıyor
kilitli: false
---

## Sorun

Stok → Aşı filtresinde `kullanim=0` iken «stok kaydı var» + alfabetik sıra, Brusella/Çiçek kayıtlıysa üste itiyordu; gerçek kullanım skoru etkisiz kalıyordu.

## Çözüm

- `asi-siralama.ts` — devlet programı aşıları sonda; kullanım (çıkış + katalog skoru); katalog sırası; 0 miktar «stokta var» değil
- `StokKarti` — 0 miktar ayrı metin
- Test: `stok-asi-siralama` modülü

## t310u — Markalı ürün / parti (taslak)

- Mevcut şema öncesi: yalnız `name`, `quantity`, `unit`, `expiryDate`, `notes`
- `asi-urun-meta.ts` — marka, ürün, lot, şişe hacmi, etiket kapsam/doz (kaynak: bilinmiyor | etiket_manuel); meta `notes` içinde v1
- Şablon vs fiziksel: markalı lotlar ayrı stok satırı; katalog placeholder generic kalır
- `asi-uygula` — tek parti düşüm, iz anahtarı, sağlık kaydında stok/lot ref
- UI: `AsiStokMetaFormu` stok eklemede (aşı)
- Blokaj: gerçek etiket foto/metin kullanıcıdan; örnek marka testte yalnızca birim test

## Dokunulmayan

Hatırlatma, devlet zorunluluk uyarıları, otomatik aşı denkliği / booster iptali.
