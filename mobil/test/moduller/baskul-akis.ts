import {
  BASKUL_ADAPTOR_TANIMLI,
  baskulBaglantiyiKes,
  baskulBagliMi,
  baskulDurum,
  baskulDurumEtiket,
  baskulOturumuSifirla,
} from '@/kaynak/baskul';
import {
  baskulAdaptorDurumuMetni,
  baskulBagliykenKayitAcilir,
  baskulDestekSecenekleri,
  baskulOlcumuGecerliMi,
  ciftOlcumEventiMi,
  tartimYontemDegisinceKiloSifirla,
  yeniBaskulOturumNesli,
} from '@/kaynak/baskul';
import { hizliTartimKayitEtkin } from '@/kaynak/kilo/hizli-tartim-akisi';
import { test, type TestModul } from '../cerceve';

export const baskulAkisModul: TestModul = {
  grup: 'Baskül akışı',
  calistir() {
    const g = 'Baskül akışı';
    baskulOturumuSifirla();
    return [
      test(g, 'Adaptör tanımlı değil', BASKUL_ADAPTOR_TANIMLI === false),
      test(g, 'Başta bağlı değil', baskulBagliMi() === false),
      test(g, 'Durum bekleniyor veya yapılandırılmamış', ['bekleniyor', 'yapilandirilmamis'].includes(baskulDurum())),
      test(g, 'Adaptör metni dürüst', baskulAdaptorDurumuMetni(false).includes('marka/model')),
      test(g, 'Rehber seçenekleri dolu', baskulDestekSecenekleri({ serial: true, bluetooth: true }).length >= 2),
      test(g, 'Kayıt bağlı değilken kapalı', baskulBagliykenKayitAcilir(false) === false),
      test(g, 'Hızlı tartım kayıt kuralı', hizliTartimKayitEtkin(true, 'baskul', false) === false),
      test(g, 'Hızlı tartım elle açık', hizliTartimKayitEtkin(true, 'manuel', false) === true),
      test(
        g,
        'Yöntem değişince kilo silinir',
        tartimYontemDegisinceKiloSifirla('50', 'manuel', 'baskul') === '',
      ),
      test(
        g,
        'Ölçüm nesil uyumsuz',
        !baskulOlcumuGecerliMi(
          { kg: 50, baglantiNesli: 0, hayvanId: 'a1', okunduAt: Date.now() },
          'a1',
          { baglantiNesli: 1, hayvanNesli: 0, yontemNesli: 0 },
          Date.now(),
        ),
      ),
      test(g, 'Çift ölçüm eventi', ciftOlcumEventiMi({ kg: 50, atMs: 1000, hayvanId: 'a1' }, 'a1', 50, 1500)),
      test(g, 'Bağlantı kes etiketi', baskulDurumEtiket('kesildi').includes('kesildi')),
      test(g, 'Bağlan adaptörsüz başarısız', (() => {
        baskulOturumuSifirla();
        return baskulDurum() === 'bekleniyor';
      })()),
      test(g, 'Kesilince bağlı değil', (() => {
        baskulBaglantiyiKes();
        return !baskulBagliMi();
      })()),
      test(
        g,
        'Hayvan nesli artar',
        yeniBaskulOturumNesli({ baglantiNesli: 0, hayvanNesli: 1, yontemNesli: 0 }, 'hayvanNesli').hayvanNesli === 2,
      ),
    ];
  },
};
