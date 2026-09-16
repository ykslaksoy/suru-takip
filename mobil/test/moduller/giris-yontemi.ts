import {
  KUZU_SECIM_SECENEKLER,
  TARTIM_GIRIS_SECENEKLER,
  VARSAYILAN_GIRIS_YONTEMI,
  etkinKuzuSecim,
  etkinTartimGiris,
  kiloAyikla,
  kupeNumarasiAyikla,
} from '@/kaynak/giris-yontemi';
import { test, type TestModul } from '../cerceve';

export const girisYontemiModul: TestModul = {
  grup: 'Giriş yöntemi',
  calistir() {
    return [
      test(
        'Giriş yöntemi',
        '6 kuzu seçim yöntemi',
        KUZU_SECIM_SECENEKLER.length === 6,
      ),
      test(
        'Giriş yöntemi',
        '6 tartım giriş yöntemi (son tartım kopyala yok)',
        TARTIM_GIRIS_SECENEKLER.length === 6 &&
          !TARTIM_GIRIS_SECENEKLER.some((s) => /kopyala/i.test(s.baslik)),
      ),
      test(
        'Giriş yöntemi',
        'Varsayılan kurulum tamamlanmamış',
        VARSAYILAN_GIRIS_YONTEMI.kurulumTamam === false,
      ),
      test(
        'Giriş yöntemi',
        'IoT/API manuele düşer',
        etkinTartimGiris('iot-api') === 'manuel',
      ),
      test(
        'Giriş yöntemi',
        'Sesle kilo ayıklama',
        kiloAyikla('68 kilo') === 68,
      ),
      test(
        'Giriş yöntemi',
        'Küpe ayıklama',
        kupeNumarasiAyikla('küpe TR-34-001234') === 'TR-34-001234',
      ),
      test(
        'Giriş yöntemi',
        'Tüm kuzu yöntemleri etkin',
        KUZU_SECIM_SECENEKLER.every((s) => etkinKuzuSecim(s.id) === s.id),
      ),
    ];
  },
};
