#!/usr/bin/env node
/**
 * Vercel superkuzu web build: expo export + dinamik rotalar + service worker.
 * Tek süreç; dış kabukta sh -c / && zinciri gerekmez.
 */
const { spawnSync } = require('child_process');
const path = require('path');

process.env.EXPO_PUBLIC_ORTAM = process.env.EXPO_PUBLIC_ORTAM || 'uretim';

const root = path.join(__dirname, '..');

function run(cmd, args, cwd = root) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', env: process.env, cwd, shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('npx', ['expo', 'export', '-p', 'web'], root);
run(process.execPath, [path.join(__dirname, 'vercel-dinamik.js')], root);
run(process.execPath, [path.join(__dirname, 'sw-olustur.js')], root);
