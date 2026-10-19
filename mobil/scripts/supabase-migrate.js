#!/usr/bin/env node
/**
 * Build-time: mobil/supabase/schema.sql dosyasını Vercel entegrasyon Postgres URL ile uygular.
 * Idempotent (schema.sql IF NOT EXISTS / CREATE OR REPLACE). Yanlış projede çalışmaz.
 */
const fs = require('fs');
const path = require('path');
const { dogrula, IZINLI_REF } = require('./supabase-proje-guvenlik');

async function main() {
  const d = dogrula();
  if (!d.izinli && d.refs.length > 0) {
    console.error('[supabase-migrate]', d.hata);
    process.exit(1);
  }
  if (!d.postgresUrl) {
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

  let pg;
  try {
    pg = require('pg');
  } catch {
    console.error('[supabase-migrate] pg paketi gerekli (npm ci).');
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new pg.Client({
    connectionString: d.postgresUrl,
    ssl: { rejectUnauthorized: false },
  });

  console.log(`[supabase-migrate] Şema uygulanıyor (proje ${IZINLI_REF})…`);
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

main().catch((e) => {
  console.error('[supabase-migrate] Hata:', e.message || e);
  process.exit(1);
});
