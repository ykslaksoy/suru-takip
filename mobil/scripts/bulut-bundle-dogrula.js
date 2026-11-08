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

const ortamYolu = path.join(dist, 'bulut-ortam.json');
let serviceRole = false;

for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  if (/service_role/i.test(t)) serviceRole = true;
}

if (serviceRole) {
  console.error('bulut-bundle-dogrula: service_role metni bulundu — reddedildi');
  process.exit(1);
}

if (fs.existsSync(ortamYolu)) {
  const j = JSON.parse(fs.readFileSync(ortamYolu, 'utf8'));
  if (j.url?.includes(SUPERKUZU_REF) && j.anonKey) {
    console.log('bulut-bundle-dogrula: OK (bulut-ortam.json)');
    process.exit(0);
  }
}

let refGomulu = false;
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  if (t.includes(SUPERKUZU_REF) && t.includes('.supabase.co')) refGomulu = true;
}
if (refGomulu) {
  console.log('bulut-bundle-dogrula: OK (bundle gömümü)');
  process.exit(0);
}

console.error('bulut-bundle-dogrula: Supabase yapılandırması dist içinde yok');
process.exit(1);
