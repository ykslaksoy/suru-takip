import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, type TestModul } from '../cerceve';
import { DAHA_MENUSU, KILITLI_DOCK, KILITLI_HIZLI_ISLEMLER } from '../../sabitler/HizliIslemler';

const KOK = join(__dirname, '..', '..');

const HIZLI_ETIKET = [
  'Kuzu Ekle',
  'Aşı',
  'Hızlı Tartım',
  'Rasyon',
  'Veteriner',
  'Stok',
  'FCR GCA',
  'Görevler',
];

const DOCK_ETIKET = ['Ana Sayfa', 'Sürü', 'Stok', 'Akıllı Kuzu', 'Daha'];

const VARLIKLAR = [
  'assets/home-locked/akilli-kuzu-home-locked.png',
  'assets/home-locked/mascot-lamb.png',
  'assets/home-locked/icons-strip.png',
  'assets/home-locked/icon-kuzu-ekle.png',
  'assets/home-locked/icon-asi.png',
  'assets/home-locked/icon-hizli-tartim.png',
  'assets/home-locked/icon-rasyon.png',
  'assets/home-locked/icon-veteriner.png',
  'assets/home-locked/icon-stok.png',
  'assets/home-locked/icon-fcr-gca.png',
  'assets/home-locked/icon-gorevler.png',
];

export const anaSayfaKilitModul: TestModul = {
  grup: 'Kilitli ana sayfa',
  calistir() {
    const ozet = readFileSync(join(KOK, 'kaynak/ana-sayfa/ozet.ts'), 'utf8');
    const ana = readFileSync(join(KOK, 'bilesenler/ana-sayfa/KilitliAnaSayfa.tsx'), 'utf8');
    return [
      test('Kilitli ana sayfa', 'Başlık Akıllı Kuzu', ozet.includes("KILITLI_ANA_BASLIK = 'Akıllı Kuzu'")),
      test('Kilitli ana sayfa', 'Sezon 2026 Sezonu', ozet.includes("KILITLI_SEZON_ETIKET = '2026 Sezonu'")),
      test(
        'Kilitli ana sayfa',
        'Hızlı İşlemler 8 etiket',
        KILITLI_HIZLI_ISLEMLER.length === 8 &&
          KILITLI_HIZLI_ISLEMLER.every((x, i) => x.label === HIZLI_ETIKET[i]),
      ),
      test(
        'Kilitli ana sayfa',
        'Dock 5 etiket',
        KILITLI_DOCK.length === 5 && KILITLI_DOCK.every((x, i) => x.title === DOCK_ETIKET[i]),
      ),
      test('Kilitli ana sayfa', 'Padok A yaş', ozet.includes('2–2,5 aylık')),
      test('Kilitli ana sayfa', 'Padok B yaş', ozet.includes('3,5 aylık')),
      test('Kilitli ana sayfa', 'Padok C yaş', ozet.includes('4,5 aylık')),
      test('Kilitli ana sayfa', 'Maskot header’da', ana.includes('KILITLI_MASKOT')),
      test('Kilitli ana sayfa', 'Daha menüsü dolu', DAHA_MENUSU.length >= 5),
      ...VARLIKLAR.map((d) => test('Kilitli ana sayfa', `Varlık: ${d}`, existsSync(join(KOK, d)))),
    ];
  },
};
