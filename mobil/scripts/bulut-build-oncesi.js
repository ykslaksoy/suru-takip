#!/usr/bin/env node
/**
 * Vercel build: şema migrasyonu + isteğe bağlı auth yapılandırması.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = __dirname;

function calistir(ad) {
  const r = spawnSync(process.execPath, [path.join(root, ad)], {
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

calistir('supabase-migrate.js');
calistir('supabase-auth-yapilandir.js');
