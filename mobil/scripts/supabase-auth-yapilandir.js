#!/usr/bin/env node
/**
 * Supabase Auth URL + Magic Link e-posta şablonu (Management API).
 * SUPABASE_ACCESS_TOKEN veya SUPABASE_MANAGEMENT_API_TOKEN gerekir (PAT: auth_config_write).
 * Token yoksa atlanır; site/redirect Vercel entegrasyonu tarafından da ayarlanabilir.
 */
const fs = require('fs');
const path = require('path');
const { dogrula, IZINLI_REF } = require('./supabase-proje-guvenlik');

const SITE = 'https://superkuzu.vercel.app';
const REDIRECT = 'https://superkuzu.vercel.app/bulut';

function yonetimTokeni() {
  return (
    String(process.env.SUPABASE_ACCESS_TOKEN ?? '').trim() ||
    String(process.env.SUPABASE_MANAGEMENT_API_TOKEN ?? '').trim()
  );
}

async function main() {
  const d = dogrula();
  if (!d.izinli && d.refs.length > 0) {
    console.error('[supabase-auth]', d.hata);
    process.exit(1);
  }

  const token = yonetimTokeni();
  if (!token) {
    console.log(
      '[supabase-auth] Yönetim API tokeni yok — auth şablonu atlanıyor. ' +
        'Gerekirse Vercel’e SUPABASE_ACCESS_TOKEN (Supabase PAT, auth_config_write) ekleyin.',
    );
    return;
  }

  const tplPath = path.join(__dirname, '..', 'supabase', 'email-otp-tr.html');
  const magicBody = fs.readFileSync(tplPath, 'utf8');

  const body = {
    site_url: SITE,
    uri_allow_list: `${REDIRECT},${SITE}/**,https://*.vercel.app/bulut`,
    mailer_subjects_magic_link: 'SürüYön · giriş kodun',
    mailer_templates_magic_link_content: magicBody,
    mailer_subjects_confirmation: 'SürüYön · giriş kodun',
    mailer_templates_confirmation_content: magicBody,
  };

  const url = `https://api.supabase.com/v1/projects/${IZINLI_REF}/config/auth`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const metin = await r.text();
  if (!r.ok) {
    console.error('[supabase-auth] Management API hata:', r.status, metin.slice(0, 500));
    process.exit(1);
  }
  console.log('[supabase-auth] Site URL, redirect listesi ve TR e-posta şablonu güncellendi.');
}

main().catch((e) => {
  console.error('[supabase-auth] Hata:', e.message || e);
  process.exit(1);
});
