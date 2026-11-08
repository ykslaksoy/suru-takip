#!/usr/bin/env node
/**
 * Build sonrası publishable Supabase ayarını statik JSON olarak dist köküne yazar.
 * Yalnız anon/publishable key — service role asla yazılmaz.
 */
const fs = require('fs');
const path = require('path');

const SUPERKUZU_REF = 'eferktaopilgoeetgggk';
const SUPERARI_REF = 'ssminvxldxaqnzizbrfy';

function ilkDolu(keys) {
  for (const k of keys) {
    const v = String(process.env[k] ?? '').trim();
    if (v) return v;
  }
  return '';
}

const url = ilkDolu(['EXPO_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/+$/, '');
const anonKey = ilkDolu([
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_ANON_KEY',
]);

if (!url || !anonKey || !/^https:\/\//.test(url)) {
  console.warn('bulut-ortam-yaz: Supabase URL/key build ortamında yok — bulut-ortam.json yazılmadı');
  process.exit(0);
}
if (url.includes(SUPERARI_REF)) {
  console.error('bulut-ortam-yaz: yanlış Supabase projesi');
  process.exit(1);
}
if (!url.includes(SUPERKUZU_REF)) {
  console.warn('bulut-ortam-yaz: URL SuperKuzu ref içermiyor');
}

const dist = path.join(__dirname, '..', 'dist');
const hedef = path.join(dist, 'bulut-ortam.json');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(
  hedef,
  JSON.stringify({ url, anonKey, surum: SUPERKUZU_REF }, null, 0),
  'utf8',
);
console.log('bulut-ortam-yaz: OK → dist/bulut-ortam.json');
