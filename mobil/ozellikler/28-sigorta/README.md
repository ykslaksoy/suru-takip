# 28 — Sigorta (TARSİM) takibi

- **Ekran:** `app/sigorta/index.tsx` (Daha → Sigorta (TARSİM))
- **Mantık:** `kaynak/sigorta/hesap.ts` (saf), `kaynak/sigorta/depo.ts` (`sy_sigorta_policeler_v1`)
- Poliçe: no, şirket (ops.), başlangıç–bitiş (GG.AA.YYYY), prim (ops.), kapsanan kuzular (`TopluHayvanSecici`, Tümü = tüm sürü)
- Uyarılar Görevler / Bugün'e düşer: bitişe ≤30 gün (Sırada), ≤7 gün (Acil), süresi doldu (son 30 gün, yenilenmediyse), sigortasız kuzu özeti
- Kuzu kartı: geçerli poliçe no + bitiş ya da “Sigortasız”
- Maliyet: prim kapsanan kuzulara eşit bölünür → partinin “Sigorta primi” satırı
- Test: `test/moduller/sigorta.ts`
