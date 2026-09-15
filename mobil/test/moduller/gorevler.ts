import { gorevleriSirala, type Gorev } from '@/kaynak/gorevler/siralama';
import { test, type TestModul } from '../cerceve';

function gorev(id: string, tarih: string, seviye: Gorev['seviye'] = 'plan'): Gorev {
  return {
    id,
    baslik: id,
    aciklama: '',
    seviye,
    kaynak: 'asi',
    href: '/gorevler',
    cta: 'Aç',
    tarih,
  };
}

export const gorevlerModul: TestModul = {
  grup: 'Görev sıralama',
  calistir() {
    const g1 = gorev('takviye-ozet-asi-karma', '2026-09-01');
    const g2 = gorev('takviye-ozet-parazit-ivermektin', '2026-09-01');
    const g3 = gorev('takviye-ozet-asi-karma-rapel', '2026-09-15');
    const sirali = gorevleriSirala([g3, g1, g2]);
    const tarihSirali = gorevleriSirala([
      gorev('a', '2026-09-20'),
      gorev('b', '2026-09-10'),
      gorev('c', '2026-09-15'),
    ]);

    return [
      test(
        'Görev sıralama',
        'Aynı günde parazit karma’dan önce',
        sirali[0]!.id === g2.id,
        sirali.map((g) => g.id).join(' → '),
      ),
      test(
        'Görev sıralama',
        'Tarih önce (yakın gün üstte)',
        tarihSirali[0]!.tarih === '2026-09-10',
      ),
      test(
        'Görev sıralama',
        'Gelecek tarih sonda',
        tarihSirali[tarihSirali.length - 1]!.tarih === '2026-09-20',
      ),
    ];
  },
};
