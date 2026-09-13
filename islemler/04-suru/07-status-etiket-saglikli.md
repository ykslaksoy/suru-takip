---
status: TODO
kilitli: false
---

# [ ] Sürü kartı durum etiketi: Sağmal → Sağlıklı

**Klasör:** `04-suru`  
**Kod / doküman:** `mobil/kaynak/cekirdek/tipler.ts` (`ANIMAL_STATUS_LABELS`)

## Ne yapılacak
Sürü listesi hayvan kartı footer’ında (`kg · durum`) Hasta ile yan yana görünen **Sağmal** etiketini **Sağlıklı** yap.

## Kapsam
- `ANIMAL_STATUS_LABELS.lactating`: `Sağmal` → `Sağlıklı` (kart, detay, CSV durum sütunu)
- Excel özet satırı aynı etiketi `ANIMAL_STATUS_LABELS` üzerinden kullansın
- Demo tohum: damızlık aday `lactating` → `healthy`
- **Dokunulmaz (süt/rasyon alan terimi):** `rasyon/hesapla.ts`, Mod4 adım kilitleri, ürün dokümanları, doğum toast (“anne sağmal”)

## Doğrulama
Kart footer: `68 kg · Sağlıklı` (Hasta ile tutarlı sağlık sözlüğü).
