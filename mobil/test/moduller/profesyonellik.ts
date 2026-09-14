import { test, type TestModul } from '../cerceve';
import {
  ASAMA_10,
  ASAMA_5,
  VARSAYILAN_PAKET,
  getAsamaPaketi,
  sonrakiAsama,
} from '../../kaynak/profesyonellik/asamalar';
import { analizEt } from '../../kaynak/profesyonellik/analiz';

export const profesyonellikModul: TestModul = {
  grup: 'profesyonellik',
  calistir() {
    const dusuk = analizEt({ kayit: 'ezber', asi: 'yok', tartim: 'hic', yem: 'tahmin' }, 5);
    // ort≈2.8 → floor 2, sonraki 3 (kayit defter=2 zayıf ama 0 yok)
    const orta = analizEt(
      {
        kayit: 'defter',
        asi: 'hatirla',
        tarim: 'ara-sira',
        tartim: 'ara',
        yem: 'sabit',
        satis: 'his',
      },
      5
    );
    // tüm güçlü: ort (3+3+3+4+4+4)/6 = 3.5 → 3, sonraki 4
    const yuksek = analizEt(
      {
        kayit: 'telefon',
        asi: 'takvim',
        tarim: 'programli',
        tartim: 'duzenli',
        yem: 'rasyon',
        satis: 'sure',
      },
      5
    );
    const sonraki = sonrakiAsama('a1-temel-kayit', 5);

    return [
      test(
        'profesyonellik',
        'varsayılan paket 5',
        VARSAYILAN_PAKET === 5 && getAsamaPaketi().length === 5
      ),
      test(
        'profesyonellik',
        '10 paket üst bağ',
        ASAMA_10.length === 10 && ASAMA_10.every((a) => ASAMA_5.some((u) => u.id === a.ustAsamaId))
      ),
      test(
        'profesyonellik',
        'düşük skor → aşama 1 önerisi',
        dusuk.mevcutSira === 1 && dusuk.sonraki?.sira === 1
      ),
      test(
        'profesyonellik',
        'orta skor → üst aşama 3',
        orta.mevcutSira === 2 && orta.sonraki?.sira === 3
      ),
      test(
        'profesyonellik',
        'yüksek skor → üst aşama 4',
        yuksek.mevcutSira === 3 && yuksek.sonraki?.sira === 4
      ),
      test(
        'profesyonellik',
        'sonrakiAsama N-model',
        sonraki?.id === 'a2-saglik' && getAsamaPaketi(10).length === 10
      ),
      test(
        'profesyonellik',
        'Tarım Bakanlığı eylemi aşama 2',
        ASAMA_5[1].eylemler.some((e) => e.etiket === 'tarim-bakanligi')
      ),
    ];
  },
};
