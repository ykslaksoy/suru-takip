import { test, type TestModul, type TestSonuc } from '../cerceve';
import { boyutMetni, gorunenler, gunlereBol, HAYVAN_BASI_EN_COK, kapasiteHatasi, komsu, olcekle, suresiDolanlar, type FotoKaydi } from '@/kaynak/galeri/hesap';

const G = 'Fotoğraf galerisi';
const f = (id: string, p: Partial<FotoKaydi> = {}): FotoKaydi => ({ id, animalId: 'a', tarih: '2026-10-19T10:00:00Z', etiket: 'genel', en: 100, boy: 100, bayt: 1000, ...p });

export const galeriModul: TestModul = {
  grup: G,
  calistir() {
    const r: TestSonuc[] = [];
    const t = (ad: string, k: boolean) => {
      r.push(test(G, ad, k));
    };
    t('yatay 4000×3000 → 1600×1200', JSON.stringify(olcekle(4000, 3000, 1600)) === '{"en":1600,"boy":1200}');
    t('dikey 3000×4000 → 240×320 küçük', JSON.stringify(olcekle(3000, 4000, 320)) === '{"en":240,"boy":320}');
    t('küçük görüntü büyütülmez', JSON.stringify(olcekle(800, 600, 1600)) === '{"en":800,"boy":600}');
    t('geçersiz boyut', olcekle(0, 10, 100).en === 0);
    const l = [f('1', { tarih: '2026-10-18T09:00:00Z' }), f('2'), f('3', { animalId: 'b' }), f('4', { silindi: '2026-10-19T00:00:00Z' })];
    const g = gorunenler(l, 'a');
    t('görünen: kuzuya ait, silinmemiş, yeni → eski', g.map((x) => x.id).join() === '2,1');
    t('gün grupları', gunlereBol(g).length === 2 && gunlereBol(g)[0].gun === '2026-10-19');
    t('kutuda 30 günü dolan görüntü temizlenir', suresiDolanlar([f('x', { silindi: '2026-09-01T00:00:00Z' }), f('y', { silindi: '2026-10-18T00:00:00Z' }), f('z')], Date.parse('2026-10-19T00:00:00Z')).map((x) => x.id).join() === 'x');
    const dolu = Array.from({ length: HAYVAN_BASI_EN_COK }, (_, i) => f(`k${i}`));
    t(`kuzu başına en çok ${HAYVAN_BASI_EN_COK}`, kapasiteHatasi(dolu, 'a') != null && kapasiteHatasi(dolu, 'b') === null);
    t('tam ekran gezinme sınırda durur', komsu(g, '2', 1)?.id === '1' && komsu(g, '1', 1) === null && komsu(g, '2', -1) === null);
    t('boyut metni', boyutMetni(512) === '512 B' && boyutMetni(2048) === '2 KB' && boyutMetni(1572864) === '1,5 MB');
    return r;
  },
};
