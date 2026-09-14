---
id: 05-superkuzu-vercel-root-fix
baslik: SuperKuzu Vercel root/build düzeltmesi
tarih: 2026-09-14
durum: devam
kilitli: false
---

# SuperKuzu Vercel root/build düzeltmesi

## Sorun
- `origin/main` HEAD (`ffbfdf3`) doğru (hızlı kuzu + profesyonellik + görevler + Sağlıklı).
- `https://superkuzu.vercel.app` yanlış/eksik içerik (stub / path string / eski panel).
- `https://surutakip.vercel.app` eski Next paneli.
- Gerçek Expo git deploy: `surutakip-git-main-yuksel2.vercel.app` (SSO).

## Yapılan
- Repo köküne `vercel.json` (superkuzu root=repo için mobil export).
- `mobil/vercel.json` (surutakip root=mobil için).
