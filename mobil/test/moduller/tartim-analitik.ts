import type { WeightRecord } from '@/kaynak/cekirdek/tipler';
import { adgGramGunuOrNull, adgHesapla } from '@/kaynak/kilo/adg';
import { calculateFCR } from '@/kaynak/kilo/fcr';
import { tartimKayitlariKronolojik, tartimKgDogrula, tartimYinelenenMi } from '@/kaynak/kilo/tartim-siralama';
import { senkronlanirMi } from '@/kaynak/bulut/siniflama';
import { tartimBulutMesaji } from '@/kaynak/kilo/tartim-bulut-durum';
import { test, type TestModul } from '../cerceve';

const w = (id: string, kg: number, at: string, animalId = 'a1'): WeightRecord => ({
  id,
  animalId,
  weightKg: kg,
  recordedAt: at,
  notes: '',
});

export const tartimAnalitikModul: TestModul = {
  grup: 'Tartım analitiği',
  calistir() {
    const g = 'Tartım analitiği';
    const r = [
      test(g, 'Kronolojik sıra', tartimKayitlariKronolojik([w('2', 50, '2025-02-02'), w('1', 40, '2025-01-01')])[0].id === '1'),
      test(g, 'GCA pozitif', adgGramGunuOrNull([w('1', 40, '2025-01-01'), w('2', 46, '2025-01-31')]) === 200),
      test(g, 'Kilo kaybı GCA yok', adgHesapla([w('1', 50, '2025-01-01'), w('2', 48, '2025-01-31')]).durum === 'yok'),
      test(g, 'Aynı an GCA yok', adgHesapla([w('1', 40, '2025-01-01T12:00:00Z'), w('2', 42, '2025-01-01T12:00:00Z')]).durum === 'yok'),
      test(g, 'Tek tartım GCA yok', adgHesapla([w('1', 40, '2025-01-01')]).durum === 'yok'),
      test(g, 'Geri tarihli kayıt sıra', adgGramGunuOrNull([w('2', 46, '2025-01-31'), w('1', 40, '2025-01-01')]) === 200),
      test(g, 'FCR sıfır payda yok', calculateFCR(100, 0) == null),
      test(g, 'FCR NaN yok', calculateFCR(0, 10) == null),
      test(g, 'Dönem kayıp artış yok', adgHesapla([w('1', 50, '2025-01-01'), w('2', 48, '2025-01-31')]).kod === 'kayip'),
      test(
        g,
        'Yinelenen tespit',
        tartimYinelenenMi([w('1', 50, '2025-01-01T12:00:00Z')], { animalId: 'a1', weightKg: 50, recordedAt: '2025-01-01T12:00:05Z' }, 60_000)?.id === '1',
      ),
      test(g, 'Kg doğrulama', tartimKgDogrula(-1).ok === false),
      test(g, 'sy_weights senkronlanır', senkronlanirMi('sy_weights')),
      test(g, 'Bulut mesajı senkron iddiası yok', !tartimBulutMesaji('senkronlanabilir').includes('gönderildi')),
    ];
    return r;
  },
};
