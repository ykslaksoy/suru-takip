import type { Animal } from '@/kaynak/cekirdek/tipler';
import {
  ciftTartimKaydiMi,
  hayvanKesinEslestir,
  hizliTartimYontemOzeti,
  kiloDogrula,
  sonrakiKuzuIcinSadeceHayvanSifirla,
  tartimKaydaHazirMi,
} from '@/kaynak/kilo/hizli-tartim-akisi';
import { baskulBaglantiVarMi } from '@/kaynak/baskul';
import { hizliTartimKayitEtkin } from '@/kaynak/kilo/hizli-tartim-akisi';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, type TestModul } from '../cerceve';

const KOK = join(__dirname, '..', '..');

const mock = (p: Partial<Animal> & Pick<Animal, 'id' | 'earTag'>): Animal =>
  ({
    turkvetNo: '',
    name: '',
    breed: '',
    species: 'sheep',
    sex: 'male',
    birthDate: '2025-01-01',
    paddock: 'A',
    status: 'healthy',
    motherId: null,
    gehisId: null,
    sirtNo: null,
    ...p,
  }) as Animal;

const SURU = [
  mock({ id: 'a1', earTag: 'TR-34-001', sirtNo: '12' }),
  mock({ id: 'a2', earTag: 'TR-34-002', sirtNo: '87' }),
  mock({ id: 'a3', earTag: 'TR-35-100', gehisId: 'GEKIS-9' }),
];

export const hizliTartimAkisiModul: TestModul = {
  grup: 'Hızlı tartım akışı',
  calistir() {
    const g = 'Hızlı tartım akışı';
    return [
      test(g, 'Tam küpe eşleşmesi', hayvanKesinEslestir('TR-34-001', SURU).durum === 'bulundu'),
      test(g, 'Sırt no eşleşmesi', hayvanKesinEslestir('87', SURU).durum === 'bulundu'),
      test(
        g,
        'Belirsiz aramada ilk sonucu seçmez',
        hayvanKesinEslestir('TR-34', SURU).durum === 'belirsiz',
      ),
      test(g, 'Bilinmeyen küpe yok', hayvanKesinEslestir('YOK-999', SURU).durum === 'yok'),
      test(g, 'Geçerli kilo', kiloDogrula('68,5').ok === true && kiloDogrula('68,5').ok && (kiloDogrula('68,5') as { kg: number }).kg === 68.5),
      test(g, 'Sıfır kilo reddedilir', kiloDogrula('0').ok === false),
      test(g, 'Onaysız kayıt engeli', tartimKaydaHazirMi(null, 'a1', '50').hazir === false),
      test(
        g,
        'Yanlış kuzu id engeli',
        tartimKaydaHazirMi('a1', 'a2', '50').hazir === false,
      ),
      test(
        g,
        'Onaylı kayıt hazır',
        tartimKaydaHazirMi('a1', 'a1', '55').hazir === true,
      ),
      test(g, 'Sonraki kuzu yöntemi sıfırlamaz', sonrakiKuzuIcinSadeceHayvanSifirla().onayliHayvanId === null),
      test(g, 'Çift kayıt engeli', ciftTartimKaydiMi({ animalId: 'a1', kg: 50, atMs: 1000 }, 'a1', 50, 2000)),
      test(g, 'Çift kayıt pencere dışı', !ciftTartimKaydiMi({ animalId: 'a1', kg: 50, atMs: 1000 }, 'a1', 50, 6000)),
      test(g, 'Baskül bağlantısı yok', baskulBaglantiVarMi() === false),
      test(
        g,
        'Yöntem özeti baskül',
        hizliTartimYontemOzeti('Elle', 'Bağlı tartı', 'baskul', 'bekleniyor').includes('bekleniyor'),
      ),
      test(g, 'Kayıt baskülsüz kapalı', hizliTartimKayitEtkin(true, 'baskul', false) === false),
      test(
        g,
        'Sarma çip bileşeni',
        readFileSync(join(KOK, 'bilesenler/kilo/YontemCipIzgarasi.tsx'), 'utf8').includes('flexWrap'),
      ),
      test(
        g,
        'Seri aşı tartım ekranından ayrı',
        readFileSync(join(__dirname, '..', '..', 'app/seri-giris/index.tsx'), 'utf8').includes('/seri-asi') &&
          !readFileSync(join(__dirname, '..', '..', 'app/seri-giris/index.tsx'), 'utf8').includes("'asi', label: 'Seri aşı'"),
      ),
    ];
  },
};
