---
status: DONE
kilitli: true
kilit_tarihi: 2026-10-29
---

# [x] Vercel superkuzu — Resource provisioning failed (2026-10-29)


> **KİLİTLİ — TAMAM (şifre korumalı).** Değiştirmek için: `python3 islemler/scripts/kilit.py unlock <dosya>` + şifre.

**Durum:** araştırıldı · platform engeli

## Belirti

- PR #40 preview: `dpl_CEKiuSke…`, `dpl_G22Ya7v…` → `BUILD_FAILED` / **Resource provisioning failed** (~400 ms, build log yok)
- `main` merge sonrası prod tetik: `dpl_EtKwxsG…`, `dpl_9hQZ885…` (turbo), `dpl_9fjSTDQ…` → aynı hata
- Yerel: `cd mobil && node scripts/vercel-web-build.js` → **OK** · `dist` ≈ **14 MB**, **~150** dosya

## Yapılandırma (repo)

- Kök `vercel.json`: `installCommand`, `buildCommand` (bulut-oncesi + supabase env + vercel-web-build), `outputDirectory: mobil/dist`, rewrites (admin + dinamik hayvan/görev)
- `mobil/vercel.json`: mobil-root deploy için aynı build; **admin rewrite eklendi** (kök ile parity)
- Middleware yok · statik export · function sayısı şişkin değil

## Vercel proje

- Proje: **superkuzu** `prj_ZymK42M5AH21c2sQvdlqgW3UKGe0`, takım **yuksel2**
- `get_project`: `live: false` (duraklatılmış olabilir); `unpause_project` çağrıldı — yine provisioning hatası
- **Canlı alias:** https://superkuzu.vercel.app hâlâ son **READY** prod: `dpl_34cZ9jqFs97UBmBaF8Hb6XCHsDt5` @ `6fa765c` (PR #39)
- Merge commit `de66bd6` (#40 tsc düzeltmeleri) **henüz prod deploy edilemedi** — Vercel hesap/kota veya proje durumu

## Aksiyon (Yüksel / Vercel dashboard)

1. Proje **superkuzu** duraklatılmış mı → Resume
2. Hobby **deploy/build kota** dolu mu
3. Destek: deployment id + "Resource provisioning failed" (build başlamadan fail)

## PR

- #40 **merge** → `de66bd6e5afa465f60052ce4f306cb66d4a4136f`
