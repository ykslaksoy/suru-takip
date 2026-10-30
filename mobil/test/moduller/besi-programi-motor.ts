import {
  BESI_PLAN_TAVAN_GUN,
  BESI_SATIS_UFUK_GUN,
  besiProgramOzeti,
  besiTakviyeSablonuUfukta,
  normalizeBesiUfukGun,
  olusturBesiGorevZamanCizelgesi,
  takvimSatirlariUfukta,
  yemSatirlariUfukta,
} from '@/kaynak/besi-programi';
import { HIZLI_BESI_TAKVIM } from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import { test, type TestModul } from '../cerceve';
import { hesaplaBesiMaliyetTahmin } from '@/kaynak/besi-programi/maliyet-tahmin';

export const besiProgramiMotorModul: TestModul = {
  grup: 'Besi programı motoru (faz 1)',
  calistir() {
    const ufuk90 = takvimSatirlariUfukta(90);
    const ufuk120 = takvimSatirlariUfukta(120);
    const cizelge = olusturBesiGorevZamanCizelgesi({ ufukGun: 90 });
    const sablon90 = besiTakviyeSablonuUfukta(90);
    const sablon120 = besiTakviyeSablonuUfukta(120);
    const gun90Tartim = HIZLI_BESI_TAKVIM.filter((t) => t.gun === 105);
    return [
      test(
        'Besi motor',
        'Varsayılan ufuk 90',
        normalizeBesiUfukGun(BESI_SATIS_UFUK_GUN) === 90,
      ),
      test(
        'Besi motor',
        '120 ufuk tüm takvim',
        ufuk120.length === HIZLI_BESI_TAKVIM.length,
      ),
      test(
        'Besi motor',
        '90 ufuk 105g tartımı düşürür',
        ufuk90.every((t) => t.gun <= 90) && gun90Tartim.length > 0 && !ufuk90.some((t) => t.gun === 105),
      ),
      test(
        'Besi motor',
        'Zaman çizelgesi görev href',
        cizelge.length > 0 && cizelge.every((s) => s.href.startsWith('/')),
      ),
      test(
        'Besi motor',
        '90g şablon < 120g şablon',
        sablon90.length > 0 && sablon90.length <= sablon120.length,
      ),
      test(
        'Besi motor',
        'Yem satırları ufukla kırpılır',
        yemSatirlariUfukta(90).every((y) => y.gun <= 90) &&
          yemSatirlariUfukta(BESI_PLAN_TAVAN_GUN).length >= yemSatirlariUfukta(90).length,
      ),
      test(
        'Besi motor',
        'Program özeti adım sayısı',
        besiProgramOzeti(90).asiSatir + besiProgramOzeti(90).yemSatir === cizelge.length,
      ),
      ...(() => {
        const a = hesaplaBesiMaliyetTahmin({ ufukGun: 90, basSayisi: 10, alisBasFiyat: 3000, girisKg: 22, satisKgFiyat: 280 });
        const f = hesaplaBesiMaliyetTahmin({ ufukGun: 90, basSayisi: 10, alisBasFiyat: 3000, hedefSatisKg: 45, satisKgFiyat: 280, fireOrani: 0.1 });
        const t0 = hesaplaBesiMaliyetTahmin({ ufukGun: 90, basSayisi: 10, alisBasFiyat: 3000, hedefSatisKg: 45, satisKgFiyat: 280 });
        const bb = t0.basabasKgFiyat ?? 0;
        const sifir = hesaplaBesiMaliyetTahmin({ ufukGun: 90, basSayisi: 10, alisBasFiyat: 3000, hedefSatisKg: 45, satisKgFiyat: bb });
        return [
          test('Besi motor', 'Hedef kg yoksa giriş + 0,25×ufuk', a.satisKgBas === 44.5),
          test('Besi motor', 'Yem dönüşüm oranı hesaplanır', (a.yemDonusumOrani ?? 0) > 3 && (a.yemDonusumOrani ?? 0) < 8),
          test('Besi motor', 'Fire geliri düşürür', f.tahminiSatisGelir < t0.tahminiSatisGelir && f.satilanBas === 9),
          test('Besi motor', 'Başabaş fiyatta kâr ~0', Math.abs(sifir.tahminiKar) <= 50),
          test('Besi motor', 'Dilim dökümü yem toplamına eşit', Math.abs(t0.dilimDokum.reduce((s, d) => s + d.yemKg, 0) - t0.tahminiYemKg) < 1),
          test('Besi motor', 'NaN girdi güvenli', Number.isFinite(hesaplaBesiMaliyetTahmin({ ufukGun: 90, basSayisi: NaN, alisBasFiyat: NaN, satisKgFiyat: NaN }).toplamMaliyet)),
        ];
      })(),
    ];
  },
};
