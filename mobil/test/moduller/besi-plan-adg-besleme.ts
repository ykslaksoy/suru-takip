import { test, type TestModul } from '../cerceve';
import { birlesBesiModel } from '@/kaynak/maliyet/besi-model-birles';
import {
  adgGrupForIrk,
  cozPlanAdg,
  hedefCikisKgAdg,
} from '@/kaynak/maliyet/besi-plan-adg-besleme';
import { varsayilanBeslemeTaslak, type BesiPlanBeslemeTaslak } from '@/kaynak/maliyet/besi-plan-besleme';
import { varsayilanIrkTaslak } from '@/kaynak/maliyet/besi-plan-irk';
import { efektifGcaaGramGun } from '@/kaynak/maliyet/besi-plan-irk';
import { hesaplaBesiPiyasaOzet } from '@/kaynak/maliyet/besi-plan-piyasa-ozet';
import { hesaplaYemIllustrasyon60 } from '@/kaynak/maliyet/besi-plan-yem-illustrasyon';
import { besiPlanTaslakYazilabilirMi } from '@/kaynak/maliyet/besi-plan-depo-guard';
import type { BesiPlanSenaryo } from '@/kaynak/maliyet/besi-plan-tipler';

const g = 'Besi ADG besleme t372u';

const hazir: BesiPlanBeslemeTaslak = { yontem: 'hazir_pellet', formulDogrulandi: false, katkiSecildi: false };
const mera: BesiPlanBeslemeTaslak = { yontem: 'mera_kaba', formulDogrulandi: false, katkiSecildi: false };
const evBozuk: BesiPlanBeslemeTaslak = {
  yontem: 'ev_karisimi',
  formulDogrulandi: false,
  katkiSecildi: true,
};

export const besiPlanAdgBeslemeModul: TestModul = {
  grup: g,
  calistir() {
    const pazar = {
      ...varsayilanIrkTaslak(),
      koken: 'pazar_toplama' as const,
      irkBilgi: 'irk_bilinmiyor' as const,
      hedefIrk: 'generic_kuzu' as const,
    };
    const karacabey = {
      ...varsayilanIrkTaslak(),
      koken: 'uretim_suru' as const,
      irkBilgi: 'irk_belli' as const,
      hedefIrk: 'karacabey_merinos' as const,
    };
    const asaf = {
      ...varsayilanIrkTaslak(),
      hedefIrk: 'asaf' as const,
      irkBilgi: 'irk_belli' as const,
      koken: 'uretim_suru' as const,
    };

    const genelBek = cozPlanAdg('beklenen', pazar, hazir);
    const kcbBek = cozPlanAdg('beklenen', karacabey, hazir);
    const meraMuh = cozPlanAdg('muhafazakar', karacabey, mera);
    const evIyim = cozPlanAdg('iyimser', karacabey, evBozuk);

    const yemHazir = hesaplaYemIllustrasyon60({ aktif: true, beslemeYontem: 'hazir_pellet' }).hazirKg;
    const yemMera = hesaplaYemIllustrasyon60({ aktif: true, beslemeYontem: 'mera_kaba' }).hazirKg;

    const ozet60 = hesaplaBesiPiyasaOzet({
      girisKg: 25,
      alisBas: 12000,
      satisKaynak: 'edirne_tobb',
      satisBirimi: 'canli_kg',
      karkasVerim: null,
      adgSenaryo: 'senaryo_taban',
      adgKanit: 'beklenen',
      donemler: [],
      yemIllustrasyon: true,
      irkTaslak: karacabey,
      beslemeTaslak: mera,
    });

    const c60 = ozet60.ufuk60.cikisKg ?? 0;
    const c90 = ozet60.ufuk90.cikisKg ?? 0;
    const y60 = ozet60.ufuk60.yemBas ?? 0;
    const y90 = ozet60.ufuk90.yemBas ?? 0;

    return [
      test(g, 'pazar grup belirsiz', adgGrupForIrk(pazar) === 'genel_belirsiz'),
      test(g, 'karacabey merinos_tip', adgGrupForIrk(karacabey) === 'merinos_tip'),
      test(g, 'asaf geliştirilmiş', adgGrupForIrk(asaf) === 'gelistirilmis_melez'),
      test(g, 'genel bek 250 varsayılan', genelBek.seciliGcaa === 250),
      test(
        g,
        'pazar uyum admin modeli',
        cozPlanAdg(
          'beklenen',
          { ...pazar, pazarUyumDususYuzde: 99 },
          hazir,
          birlesBesiModel({
            surum: 2,
            adgGrupBand: {},
            pazarUyumDususYuzde: { irk_belli: 0, irk_kismen: 0, irk_bilinmiyor: 6 },
            beslemeKatsayi: {},
          }),
        ).seciliGcaa === 235,
      ),
      test(g, 'karacabey bek ~250', kcbBek.seciliGcaa === 250),
      test(g, 'mera düşürür', (meraMuh.seciliGcaa ?? 999) < kcbBek.muhafazakar),
      test(g, 'ev iyimser tavan beklenen', evIyim.seciliGcaa === 250),
      test(g, 'katkı uyarısı', evIyim.uyari.some((u) => u.includes('Katkı'))),
      test(g, '90g ağırlık > 60g', c90 > c60),
      test(g, '90g yem > 60g yem', y90 > y60 && y60 > 0),
      test(g, 'mera yem az hazır', yemMera < yemHazir),
      test(
        g,
        'ölçüm öncelik',
        efektifGcaaGramGun('muhafazakar', { ...karacabey, olcumGcaaGramGun: 210 }, hazir).gcaa === 210,
      ),
      test(
        g,
        'hedef kg',
        hedefCikisKgAdg(25, 60, kcbBek) === 40,
      ),
      test(g, 'besleme JSON alanı', (() => {
        const raw = JSON.stringify({
          beslemeTaslagi: { ...varsayilanBeslemeTaslak(), yontem: 'mera_kaba' },
        });
        const p = JSON.parse(raw) as Pick<BesiPlanSenaryo, 'beslemeTaslagi'>;
        return p.beslemeTaslagi?.yontem === 'mera_kaba';
      })()),
      test(g, 'onaylı plan kilit', !besiPlanTaslakYazilabilirMi({ durum: 'onayli' } as BesiPlanSenaryo)),
    ];
  },
};
