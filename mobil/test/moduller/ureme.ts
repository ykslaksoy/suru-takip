import { dogumGirdiDogrula, type DogumKayitGirdi } from '@/kaynak/ureme/dogum-dogrula';
import { test, type TestModul } from '../cerceve';

function ornek(
  girdi: Partial<DogumKayitGirdi> & Pick<DogumKayitGirdi, 'anneId' | 'birthDate' | 'kuzular'>,
): DogumKayitGirdi {
  return { notes: '', ...girdi };
}

export const uremeModul: TestModul = {
  grup: 'Üreme / doğum',
  calistir() {
    const gecerli = ornek({
      anneId: 'anne-1',
      birthDate: '2026-03-15',
      kuzular: [{ earTag: 'TR-01', sex: 'male', birthWeightKg: 4.2 }],
    });
    const bosKupe = ornek({
      anneId: 'anne-1',
      birthDate: '2026-03-15',
      kuzular: [{ earTag: '  ', sex: 'female' }],
    });
    const tekrar = ornek({
      anneId: 'anne-1',
      birthDate: '2026-03-15',
      kuzular: [
        { earTag: 'TR-01', sex: 'male' },
        { earTag: 'tr-01', sex: 'female' },
      ],
    });
    const tarih = ornek({
      anneId: 'anne-1',
      birthDate: '15.03.2026',
      kuzular: [{ earTag: 'TR-02', sex: 'male' }],
    });

    return [
      test('Üreme / doğum', 'Geçerli girdi kabul', dogumGirdiDogrula(gecerli) === null),
      test('Üreme / doğum', 'Boş küpe reddedilir', dogumGirdiDogrula(bosKupe)?.includes('küpe') === true),
      test(
        'Üreme / doğum',
        'Tekrarlayan küpe reddedilir',
        dogumGirdiDogrula(tekrar)?.includes('Tekrarlayan') === true,
      ),
      test(
        'Üreme / doğum',
        'Tarih formatı YYYY-MM-DD',
        dogumGirdiDogrula(tarih)?.includes('YYYY-MM-DD') === true,
      ),
      test(
        'Üreme / doğum',
        'Kuzu yok reddedilir',
        dogumGirdiDogrula(ornek({ anneId: 'a', birthDate: '2026-01-01', kuzular: [] }))?.includes(
          'kuzu',
        ) === true,
      ),
    ];
  },
};
