import { test, type TestModul } from '../cerceve';
import { PIYASA_YENILEME_SONUC, piyasaKayitOku } from '@/kaynak/maliyet/besi-piyasa-kayit';
import { hedefCanliKgKanit } from '@/kaynak/maliyet/besi-adg-kanit';
import { hesaplaBesiPiyasaOzet } from '@/kaynak/maliyet/besi-plan-piyasa-ozet';
import { hesaplaBrutKar, BRUT_KAR_ETIKET } from '@/kaynak/maliyet/besi-plan-brut-kar';
import { ortakGiderMutabakat } from '@/kaynak/maliyet/besi-plan-butce-hesap';
import { efektifGcaaGramGun, irkAdgPolitikasi, varsayilanIrkTaslak } from '@/kaynak/maliyet/besi-plan-irk';
import { hesaplaKararSimulasyon, kararVarsayilanSenaryo } from '@/kaynak/maliyet/besi-plan-karar-sim';

const g = 'Besi piyasa ADG t355u';

export const besiPiyasaAdgModul: TestModul = {
  grup: g,
  calistir() {
    const bal = piyasaKayitOku().kayitlar.find((k) => k.id === 'balikesir-kuzu-canli-kg-agustos2026');
    const edirne = piyasaKayitOku().kayitlar.find((k) => k.id === 'tobb-edirne-kasaplik-kuzu');
    const ozet = hesaplaBesiPiyasaOzet({
      girisKg: 25,
      alisBas: 12000,
      satisKaynak: 'edirne_tobb',
      satisBirimi: 'canli_kg',
      karkasVerim: null,
      adgSenaryo: 'senaryo_taban',
      adgKanit: 'beklenen',
      donemler: [],
      yemIllustrasyon: true,
      yemFireYuzde: 5,
    });
    const brut = hesaplaBrutKar({ satisBas: 100, alisBas: 60, yemBas: 30 });
    const ortak = ortakGiderMutabakat({
      kira: 10000,
      coban: 20000,
      elektrik: 1000,
      digerToplam: 5000,
      donem: 'aylik',
      donemAdet: 3,
      payBasSayisi: 100,
    });

    const pazar = { ...varsayilanIrkTaslak(), koken: 'pazar_toplama' as const, irkBilgi: 'irk_bilinmiyor' as const };
    const olcumIrk = { ...pazar, olcumGcaaGramGun: 210 };
    const ozetOlcum = hesaplaBesiPiyasaOzet({
      girisKg: 25,
      alisBas: 12000,
      satisKaynak: 'edirne_tobb',
      satisBirimi: 'canli_kg',
      karkasVerim: null,
      adgSenaryo: 'senaryo_taban',
      adgKanit: 'beklenen',
      donemler: [],
      yemIllustrasyon: true,
      irkTaslak: olcumIrk,
    });
    return [
      test(g, 'Balıkesir canlı fiyat dolu', (bal?.deger ?? 0) > 300),
      test(g, 'Edirne 397.38', edirne?.deger === 397.38),
      test(g, '60g hedef ~40kg', hedefCanliKgKanit(25, 60, 'beklenen') === 40),
      test(g, 'Brüt kar aşı hariç etiket', brut.etiket === BRUT_KAR_ETIKET),
      test(g, 'Brüt kar 10', brut.brutKar === 10),
      test(g, 'Yenile manual_only', PIYASA_YENILEME_SONUC === 'manuel_only'),
      test(g, '60g brut hesap', ozet.ufuk60.brutKar.brutKar != null),
      test(g, 'Ortak dönem çarpan', ortak.basBasi === 1080),
      test(g, 'Yem illustrasyon', ozet.ufuk60.yemKaynak === 'illustrasyon' || ozet.ufuk60.yemBas != null),
      test(g, 't358u pazar generic', pazar.hedefIrk === 'generic_kuzu'),
      test(g, 't358u iyimser üst 320', irkAdgPolitikasi(pazar).iyimserGcaaUst === 320),
      test(g, 't358u ölçüm gcaa', efektifGcaaGramGun('iyimser', olcumIrk).gcaa === 210),
      test(g, 't358u 60g 37.6kg', ozetOlcum.ufuk60.cikisKg === 37.6),
      test(g, 't358u irk tip', pazar.irkBilgi === 'irk_bilinmiyor'),
      test(g, 't359u varsayılan muhafazakar', kararVarsayilanSenaryo(pazar) === 'muhafazakar'),
      test(g, 't359u politik default muh', irkAdgPolitikasi(pazar).varsayilanSenaryo === 'muhafazakar'),
      (() => {
        const k = hesaplaKararSimulasyon(
          {
            girisKg: 25,
            alisBas: 12000,
            satisKaynak: 'edirne_tobb',
            satisBirimi: 'canli_kg',
            karkasVerim: null,
            adgSenaryo: 'senaryo_taban',
            adgKanit: 'muhafazakar',
            donemler: [],
            yemIllustrasyon: true,
            yemFireYuzde: 5,
            irkTaslak: pazar,
            basSayisi: 1,
          },
          null,
        );
        const m = k.satirlar.find((s) => s.senaryo === 'muhafazakar')!;
        return [
          test(g, 't359u 60g çıkış 37', m.gun60.cikisKg === 37),
          test(g, 't359u brüt 60g hesap', m.gun60.brutKar != null),
          test(g, 't359u breakeven kg', (k.breakevenCanliFiyatKg60 ?? 0) > 300),
        ];
      })(),
    ].flat();
  },
};
