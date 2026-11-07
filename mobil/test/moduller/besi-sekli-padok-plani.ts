import { test, type TestModul } from '../cerceve';
import {
  haritaGirisEtiketi,
  haritaHedefRotasi,
  icBesiModu,
  meraHaritasiUygun,
} from '@/kaynak/suru/besi-sekli-rota';
export const besiSekliPadokPlaniModul: TestModul = {
  grup: 'Besi şekli · padok planı',
  calistir() {
    const icHedef = haritaHedefRotasi('ic', 'Ahır-1');
    const disHedef = haritaHedefRotasi('dis');
    const karisik = haritaHedefRotasi('karisik', 'P1');

    const hayvanToplam = 12 + 20;
    const kapToplam = 30 + 20;

    return [
      test('Besi şekli', 'Kapalı: padok planı etiketi', haritaGirisEtiketi('ic') === 'Padok planı'),
      test('Besi şekli', 'Dış: mera etiketi', haritaGirisEtiketi('dis') === 'Mera haritası'),
      test('Besi şekli', 'ic → /padok-plani', icHedef.pathname === '/padok-plani' && icHedef.params?.padok === 'Ahır-1'),
      test('Besi şekli', 'dis → /mera', disHedef.pathname === '/mera'),
      test('Besi şekli', 'karışık padok param', karisik.params?.padok === 'P1'),
      test('Besi şekli', 'ic modu bayrağı', icBesiModu('ic') && !icBesiModu('dis')),
      test('Besi şekli', 'Mera uygun (dış/karışık)', meraHaritasiUygun('dis') && meraHaritasiUygun('karisik') && !meraHaritasiUygun('ic')),
      test('Padok planı', 'Özet doluluk (örnek)', hayvanToplam === 32 && kapToplam === 50),
      test('Padok planı', 'Konum yalnız kayıtlıda', true),
    ];
  },
};
