import { OZELLIK_BAYRAKLARI } from '@/sabitler/OzellikBayraklari';
import { meraHaritaAktif } from '@/sabitler/ozellik-acik';
import { test, type TestModul } from '../cerceve';

const MERA_HARITA_ANAHTAR = 'sy_mera_harita_v1';

export const meraHaritaModul: TestModul = {
  grup: 'Mera haritası',
  calistir() {
    const bayrak = OZELLIK_BAYRAKLARI.find((o) => o.id === 'mera-harita');
    return [
      test('Mera haritası', 'Anahtar sy_mera_harita_v1', MERA_HARITA_ANAHTAR === 'sy_mera_harita_v1'),
      test('Mera haritası', 'Bayrak pilot', bayrak?.durum === 'pilot'),
      test('Mera haritası', 'Varsayılan aktif', meraHaritaAktif()),
    ];
  },
};
