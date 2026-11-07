import { test, type TestModul } from '../cerceve';
import {
  aktifRasyonBul,
  onerilenSablonId,
  padokRasyonDurumu,
  planOzeti,
  sonYemlemePadok,
} from '@/kaynak/yem/padok-durum';
import type { DusumKaydi } from '@/kaynak/yem/kayit';
import type { PartiRasyonu } from '@/kaynak/yem/hesap';

const rasyon = (p: Partial<PartiRasyonu>): PartiRasyonu => ({
  id: 'r1',
  parti: 'A',
  ad: 'Stokla plan',
  kalemler: [{ stockId: 'arpa', kgBasGun: 0.6 }],
  baslangic: '2026-01-01',
  sonDusum: '2026-01-05',
  aktif: true,
  guncelleme: '2026-01-01T10:00:00Z',
  ...p,
});

export const rasyonPadokDurumModul: TestModul = {
  grup: 'Rasyon · padok durumu',
  calistir() {
    const aktif = aktifRasyonBul([rasyon({})], 'A');
    const yok = planOzeti(null, 10);
    const ozet = padokRasyonDurumu('A', 10, [rasyon({})], [], (id) => (id === 'arpa' ? 'Arpa' : id));

    const dusum: DusumKaydi[] = [
      {
        id: 'd1',
        gun: '2026-02-01',
        zaman: '2026-02-01T08:00:00Z',
        kalemler: [
          {
            rasyonId: 'r1',
            parti: 'A',
            stockId: 'arpa',
            kg: 60,
            gunSayisi: 1,
            ilkGun: '2026-02-01',
            sonGun: '2026-02-01',
            bas: 10,
            dusulen: 60,
            eksik: 0,
          },
        ],
        anlik: [{ rasyonId: 'r1', parti: 'A', ad: 'Eski ad', kalemler: [{ stockId: 'arpa', kgBasGun: 0.5 }], guncelleme: 'x' }],
      },
    ];
    const son = sonYemlemePadok(dusum, 'A', (id) => 'Arpa');
    const guncelPlan = rasyon({ kalemler: [{ stockId: 'arpa', kgBasGun: 0.9 }], ad: 'Yeni' });

    return [
      test('Padok durum', 'Aktif rasyon bulunur', aktif?.id === 'r1'),
      test('Padok durum', 'Rasyon yok metni', yok.tur === 'yok'),
      test('Padok durum', 'Plan özeti kg', ozet.plan.kgBasGunToplam === 0.6 && ozet.plan.padokGunlukKg === 6),
      test('Padok durum', 'Yemleme yok', ozet.sonYemleme === null),
      test('Padok durum', 'Şablon önerisi ≠ uygulanmış', onerilenSablonId(20, 30) === 'besi-baslangic'),
      test('Padok durum', 'Anlık görüntü plan değişince korunur', son?.anlik?.kalemler[0].kgBasGun === 0.5 && guncelPlan.kalemler[0].kgBasGun === 0.9),
      test('Padok durum', 'Şablon id tartıma göre', onerilenSablonId(40, 30) === 'besi-bitirme'),
    ];
  },
};
