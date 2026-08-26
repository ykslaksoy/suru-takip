---
status: DONE
kilitli: true
---

# [x] Derecelendirme yaş (ay) bandına göre

> **KİLİTLİ — TAMAM.** Eşikler sonra netleştirilir.

## Mantık
Aynı ADG ≠ aynı derece. Kuzunun **kaçıncı ayında** olduğuna göre eşikler değişir.

## Bantlar (geçici)
| Ay | Dönem |
|----|--------|
| 0–2 | Süt / erken |
| 2–3,5 | Alım / karantina |
| 3,5–5 | Aktif besi |
| 5–7 | Bitiş / satışa yakın |
| 7+ | İleri |

Kod: `mobil/kaynak/kuzu-derece.ts` → `AGE_BANDS` + `gradeLamb({ birthDate })`
