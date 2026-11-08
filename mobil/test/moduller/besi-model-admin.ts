import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, type TestModul } from '../cerceve';
import { birlesBesiModel, besiModelAdminGuncellemeGecerliMi } from '@/kaynak/maliyet/besi-model-birles';
import { irkTaslakHesapIcin } from '@/kaynak/maliyet/besi-plan-irk-efektif';
import { varsayilanIrkTaslak } from '@/kaynak/maliyet/besi-plan-irk';

const g = 'Besi admin teknik modeli t386u';
const KOK = join(process.cwd());

export const besiModelAdminModul: TestModul = {
  grup: g,
  calistir() {
    const adminJs = readFileSync(join(KOK, '..', 'api', 'admin', 'besi-model.js'), 'utf8');
    const modelJs = readFileSync(join(KOK, '..', 'api', 'besi', 'model.js'), 'utf8');
    const schema = readFileSync(join(KOK, 'supabase', 'schema.sql'), 'utf8');
    const admin = birlesBesiModel({
      pazarUyumDususYuzde: { irk_bilinmiyor: 5, irk_kismen: 3, irk_belli: 0 },
    });
    const hesap = irkTaslakHesapIcin(
      { ...varsayilanIrkTaslak(), pazarUyumDususYuzde: 25, olcumGcaaGramGun: 999 },
      { planBasSayisi: 10, bilinenIrkBas: 4, olcumGcaaGramGun: 205, kaynak: 'tartim', aciklama: [], olcumBas: null, olcumBit: null, uygunGcaaSayisi: 3, olculenGcaaSayisi: 4 },
    );
    return [
      test(g, 'schema admin_besi_model_surum', schema.includes('admin_besi_model_surum')),
      test(g, 'admin API 403', adminJs.includes('403') && adminJs.includes('adminMi')),
      test(g, 'public model GET', modelJs.includes('/rest/v1/admin_besi_model_surum')),
      test(g, 'birles dogrulama', besiModelAdminGuncellemeGecerliMi({ pazarUyumDususYuzde: { irk_bilinmiyor: 6 } }).ok),
      test(g, 'kullanıcı pazar yok sayılır', hesap.pazarUyumDususYuzde == null),
      test(g, 'ölçüm gerçekten gelir', hesap.olcumGcaaGramGun === 205),
      test(g, 'admin pazar birles', admin.pazarUyumDususYuzde.irk_bilinmiyor === 5),
    ];
  },
};
