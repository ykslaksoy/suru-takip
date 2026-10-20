#!/usr/bin/env node
/**
 * Build-time: mobil/supabase/schema.sql dosyasını Vercel entegrasyon Postgres URL ile uygular.
 * Idempotent (schema.sql IF NOT EXISTS / CREATE OR REPLACE). Yanlış projede çalışmaz.
 */
const fs = require('fs');
const path = require('path');
const { dogrula, IZINLI_REF, refSupabaseUrlden } = require('./supabase-proje-guvenlik');

const PG_ENV_ANAHTARLARI = [
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'DATABASE_URL',
  'POSTGRES_HOST',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
];

function yonetimTokeni() {
  return (
    String(process.env.SUPABASE_ACCESS_TOKEN ?? '').trim() ||
    String(process.env.SUPABASE_MANAGEMENT_API_TOKEN ?? '').trim()
  );
}

function postgresEnvOzeti() {
  return PG_ENV_ANAHTARLARI.filter((k) => String(process.env[k] ?? '').trim().length > 0);
}

async function migrateViaManagementApi(sql, token) {
  const url = `https://api.supabase.com/v1/projects/${IZINLI_REF}/database/query`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const metin = await r.text();
  if (!r.ok) {
    throw new Error(`Management API SQL (${r.status}): ${metin.slice(0, 400)}`);
  }
}

async function migrateViaPg(postgresUrl) {
  let pg;
  try {
    pg = require('pg');
  } catch {
    throw new Error('pg paketi gerekli (npm ci).');
  }

  const client = new pg.Client({
    connectionString: postgresUrl,
    ssl: { rejectUnauthorized: false },
  });

  const sqlPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  await client.connect();
  try {
    await client.query(sql);
    const tablolar = await client.query(
      `select table_name from information_schema.tables
       where table_schema = 'public' and table_name in ('ciftlik','belge','foto')
       order by 1`,
    );
    const adlar = tablolar.rows.map((r) => r.table_name);
    if (adlar.length < 3) {
      throw new Error(`Beklenen tablolar eksik: ${adlar.join(', ')}`);
    }
    console.log('[supabase-migrate] Tamam — tablolar:', adlar.join(', '));
  } finally {
    await client.end();
  }
}

async function tablolariDogrulaAnon() {
  const supUrl = String(process.env.SUPABASE_URL ?? '').trim();
  const anon =
    String(process.env.SUPABASE_PUBLISHABLE_KEY ?? '').trim() ||
    String(process.env.SUPABASE_ANON_KEY ?? '').trim();
  if (!supUrl || !anon) return;
  for (const t of ['ciftlik', 'belge', 'foto']) {
    const r = await fetch(`${supUrl.replace(/\/+$/, '')}/rest/v1/${t}?select=id&limit=0`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    });
    if (!r.ok) {
      console.warn(
        `[supabase-migrate] REST doğrulama uyarısı: public.${t} HTTP ${r.status} (şema henüz yok veya PostgREST önbelleği gecikmiş olabilir).`,
      );
    }
  }
}

async function main() {
  const d = dogrula();
  if (!d.izinli && d.refs.length > 0) {
    console.error('[supabase-migrate]', d.hata);
    process.exit(1);
  }

  const vercel = process.env.VERCEL === '1';
  const supRef = refSupabaseUrlden(process.env.SUPABASE_URL);
  const bulutBuild = vercel && supRef === IZINLI_REF;

  if (!d.postgresUrl) {
    const token = yonetimTokeni();
    if (token && bulutBuild) {
      console.log('[supabase-migrate] Postgres URL yok; Management API SQL deneniyor…');
      const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');
      await migrateViaManagementApi(sql, token);
      await tablolariDogrulaAnon();
      return;
    }
    if (bulutBuild) {
      console.warn(
        '[supabase-migrate] Vercel build: Postgres/Management API yok — şema atlanıyor (' +
          (postgresEnvOzeti().join(', ') || 'postgres env yok') +
          '). Web derlemesi devam eder; şema için POSTGRES_* Build env veya SUPABASE_ACCESS_TOKEN ekleyin.',
      );
      return;
    }
    console.log('[supabase-migrate] Postgres URL yok — atlanıyor (yerel derleme?).');
    return;
  }

  if (d.refs.length === 0) {
    const pgRef = require('./supabase-proje-guvenlik').refPostgresUrlden(d.postgresUrl);
    if (pgRef && pgRef !== IZINLI_REF) {
      console.error('[supabase-migrate] Postgres host ref doğrulanamadı:', pgRef);
      process.exit(1);
    }
  }

  console.log(
    `[supabase-migrate] Şema uygulanıyor (proje ${IZINLI_REF}, postgres env: ${postgresEnvOzeti().join(', ')})…`,
  );
  await migrateViaPg(d.postgresUrl);
  await tablolariDogrulaAnon();
}

main().catch((e) => {
  console.error('[supabase-migrate] Hata:', e.message || e);
  if (process.env.VERCEL === '1') {
    console.warn('[supabase-migrate] Vercel build şema hatasına rağmen devam ediyor — SQL Editor’da schema.sql doğrulayın.');
    process.exit(0);
  }
  process.exit(1);
});
