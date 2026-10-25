#!/usr/bin/env node
/** Admin panel HTML → mobil/dist/admin + Supabase public env yerleştirme */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const src = path.join(root, 'admin', 'panel', 'index.html');
const distDir = path.join(__dirname, '..', 'dist', 'admin');
const dst = path.join(distDir, 'index.html');

function env(...keys) {
  for (const k of keys) {
    const v = String(process.env[k] ?? '').trim();
    if (v) return v;
  }
  return '';
}

const url = env('EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
const anon = env(
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
);

let html = fs.readFileSync(src, 'utf8');
html = html.replace('__SUPABASE_URL__', url.replace(/\/+$/, ''));
html = html.replace('__SUPABASE_ANON__', anon);

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(dst, html);
console.log('admin-panel-kopyala: dist/admin/index.html');
