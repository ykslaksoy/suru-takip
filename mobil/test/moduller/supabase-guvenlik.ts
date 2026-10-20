import { test, type TestModul } from '../cerceve';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const g = require('../../scripts/supabase-proje-guvenlik') as typeof import('../../scripts/supabase-proje-guvenlik');

const G = 'Supabase proje güvenliği';

export const supabaseGuvenlikModul: TestModul = {
  grup: G,
  calistir() {
    const kaydet = { ...process.env };
    const temizle = () => {
      delete process.env.SUPABASE_URL;
      delete process.env.POSTGRES_URL;
      delete process.env.POSTGRES_URL_NON_POOLING;
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    };
    temizle();
    const r = [
      test(G, 'Env yokken doğrulama geçer', g.dogrula().izinli),
      test(G, 'URL parser SuperKuzu', g.refSupabaseUrlden('https://eferktaopilgoeetgggk.supabase.co') === 'eferktaopilgoeetgggk'),
    ];
    process.env.SUPABASE_URL = 'https://ssminvxldxaqnzizbrfy.supabase.co';
    r.push(test(G, 'SuperAri ref reddedilir', !g.dogrula().izinli));
    temizle();
    process.env.SUPABASE_URL = 'https://eferktaopilgoeetgggk.supabase.co';
    r.push(test(G, 'SuperKuzu ref kabul', g.dogrula().izinli));
    for (const [k, v] of Object.entries(kaydet)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    return r;
  },
};
