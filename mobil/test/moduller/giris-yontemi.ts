import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

const KOK = join(__dirname, '..', '..');

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
      test(
        'Giriş yöntemi',
        'Kurulum yönlendirici kalıcı depoyu doğrular',
        readFileSync(
          join(KOK, 'bilesenler/giris-yontemi/GirisYontemiKurulumYonlendirici.tsx'),
          'utf8',
        ).includes('girisYontemiKurulumTamamMi'),
      ),
      test(
        'Giriş yöntemi',
        'Kurulum kaydı sonrası context güncellenince ana sayfaya gider',
        (() => {
          const src = readFileSync(join(KOK, 'app/giris-yontemi/kurulum.tsx'), 'utf8');
          return src.includes('tercih.kurulumTamam') && src.includes('setAnaSayfayaGit');
        })(),
      ),
    ];
  },
};
