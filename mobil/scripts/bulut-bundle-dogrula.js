#!/usr/bin/env node
/**
 * Web dist içinde Supabase ortamının gömülü olduğunu doğrular (service role yok).
 */
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const SUPERKUZU_REF = 'eferktaopilgoeetgggk';

function jsDosyalari(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ad of fs.readdirSync(dir)) {
    const p = path.join(dir, ad);
    if (fs.statSync(p).isDirectory()) jsDosyalari(p, out);
    else if (ad.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = jsDosyalari(path.join(dist, '_expo', 'static', 'js', 'web'));
if (files.length === 0) {
  console.error('bulut-bundle-dogrula: dist JS yok');
  process.exit(1);
}

let urlGomulu = false;
let refGomulu = false;
let serviceRole = false;

for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  if (t.includes('.supabase.co') || t.includes(SUPERKUZU_REF)) refGomulu = true;
  if (t.includes('EXPO_PUBLIC_SUPABASE_URL') && t.includes(SUPERKUZU_REF)) urlGomulu = true;
  if (/service_role/i.test(t)) serviceRole = true;
}

if (serviceRole) {
  console.error('bulut-bundle-dogrula: service_role metni bulundu — reddedildi');
  process.exit(1);
}
if (!refGomulu) {
  console.error('bulut-bundle-dogrula: SuperKuzu Supabase referansı bundle içinde yok');
  process.exit(1);
}

console.log('bulut-bundle-dogrula: OK (publishable/anon gömümü, service role yok)');
