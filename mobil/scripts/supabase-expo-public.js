/**
 * Vercel Supabase entegrasyonu SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY verir;
 * Expo web derlemesi yalnızca EXPO_PUBLIC_* değişkenlerini istemciye gömer.
 * Bu betik build öncesi eksik EXPO_PUBLIC_* alanlarını doldurur, sonra alt komutu çalıştırır.
 */
const { spawnSync } = require('child_process');

const URL_KAYNAKLARI = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_URL',
];

const ANON_KAYNAKLARI = [
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_ANON_KEY',
];

function ilkDolu(anahtarlar) {
  for (const k of anahtarlar) {
    const v = String(process.env[k] ?? '').trim();
    if (v) return v;
  }
  return '';
}

if (!String(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim()) {
  const url = ilkDolu(URL_KAYNAKLARI);
  if (url) process.env.EXPO_PUBLIC_SUPABASE_URL = url.replace(/\/+$/, '');
}

if (!String(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()) {
  const key = ilkDolu(ANON_KAYNAKLARI);
  if (key) process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = key;
}

const argv = process.argv.slice(2);
if (argv.length === 0) process.exit(0);

/** node script.js … veya npx … — doğrudan exec; sh -c kullanılmaz */
const cmd = argv[0];
const args = argv.slice(1);
const r = spawnSync(cmd, args, {
  stdio: 'inherit',
  env: process.env,
  shell: false,
});
process.exit(r.status === null ? 1 : r.status);
