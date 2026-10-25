import fs from 'node:fs';
import path from 'node:path';
import { test, type TestModul } from '../cerceve';

const schema = fs.readFileSync(path.join(__dirname, '../../supabase/schema.sql'), 'utf8');

export const adminSchemaModul: TestModul = {
  grup: 'Admin şema',
  calistir() {
    return [
      test('Admin şema', 'destek_talebi', schema.includes('create table if not exists public.destek_talebi')),
      test('Admin şema', 'admin_ozellik_bayrak', schema.includes('admin_ozellik_bayrak')),
      test('Admin şema', 'icerik_surum', schema.includes('icerik_surum')),
      test('Admin şema', 'admin_kullanici', schema.includes('admin_kullanici')),
    ];
  },
};
