import { PAKET_ADETLER, PAKET_LISTESI, SUBSCRIPTION_LIMITS } from '@/kaynak/abonelik/paketler';
import { test, type TestModul } from '../cerceve';

export const abonelikModul: TestModul = {
  grup: 'Abonelik / paketler',
  calistir() {
    const adetler = PAKET_LISTESI.map((p) => p.adet);
    return [
      test(
        'Abonelik / paketler',
        '10 kademe tanımlı',
        PAKET_LISTESI.length === 10,
        `${PAKET_LISTESI.length} paket`,
      ),
      test(
        'Abonelik / paketler',
        'Adet listesi doğru',
        JSON.stringify(adetler) === JSON.stringify([...PAKET_ADETLER]),
      ),
      test(
        'Abonelik / paketler',
        '30 kuzu ücretsiz',
        PAKET_LISTESI[0]?.ucretsiz && PAKET_LISTESI[0]?.adet === 30,
      ),
      test(
        'Abonelik / paketler',
        '1000 kuzu üst paket',
        PAKET_LISTESI[PAKET_LISTESI.length - 1]?.adet === 1000,
      ),
      test(
        'Abonelik / paketler',
        'Limit haritası tutarlı',
        PAKET_LISTESI.every((p) => SUBSCRIPTION_LIMITS[p.id] === p.adet),
      ),
      test(
        'Abonelik / paketler',
        'Ücretli paketlerde fiyat var',
        PAKET_LISTESI.filter((p) => !p.ucretsiz).every((p) => p.monthly > 0 && p.yearly > 0),
      ),
    ];
  },
};
