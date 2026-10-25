import { tarihGunKismi, tarihZamani } from '@/kaynak/gorevler/tarih';
import { test, type TestModul } from '../cerceve';

function ornekFormat(iso: string): string {
  const gun = tarihGunKismi(iso);
  if (!gun) return '—';
  return new Date(`${gun}T12:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export const tarihModul: TestModul = {
  grup: 'Tarih metni',
  calistir() {
    const iso = '2024-03-15T08:30:00.000Z';
    const metin = ornekFormat(iso);
    return [
      test('Tarih metni', 'ISO gun kismi', tarihGunKismi(iso) === '2024-03-15'),
      test('Tarih metni', 'ISO formatlanir', !metin.includes('Invalid'), metin),
      test('Tarih metni', 'Geçersiz —', tarihGunKismi('not-a-date') === null),
      test('Tarih metni', 'Zaman sırası', tarihZamani(iso) > tarihZamani('2024-03-14')),
    ];
  },
};
