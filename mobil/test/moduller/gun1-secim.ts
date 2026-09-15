import {
  GUN1_BESLENME_PROGRAM_IDS,
  GUN1_SECENEKLER,
  girisPaketindeAlbendazol,
  girisPaketindeSelen,
  gorevdenProgramId,
  gun1KalemEtiketleri,
  gun1ProgramIdsForMod,
  gunGruplariniSecimeGoreFiltrele,
  type Gun1SecimKayit,
} from '@/kaynak/gorevler/gun1-secim';
import { TARTIM_GIRIS_PROGRAM_ID } from '@/kaynak/akilli-veteriner/takviye-tipler';
import { test, type TestModul } from '../cerceve';

export const gun1SecimModul: TestModul = {
  grup: 'Gün 1 oturum seçimi',
  calistir() {
    const sadece = gun1ProgramIdsForMod('sadece-tartim');
    const paket = gun1ProgramIdsForMod('tarti-parazit-karma');
    const hepsi = gun1ProgramIdsForMod('hepsi');
    const ozel = gun1ProgramIdsForMod('ozel', [
      TARTIM_GIRIS_PROGRAM_ID,
      'karma',
      'probiyotik',
      'premiks',
    ]);
    const kalemler = gun1KalemEtiketleri();

    const sahteSecim: Gun1SecimKayit = {
      tarih: '2026-09-15',
      padokAnahtar: 'acik-alim',
      mod: 'tarti-parazit-karma',
      programIds: paket,
      kaydedildiAt: '2026-09-15T12:00:00.000Z',
    };
    const filtreli = gunGruplariniSecimeGoreFiltrele(
      [
        {
          gun: 1,
          baslik: 'Gün 1',
          gorevler: [
            {
              id: `takviye-ozet-tartim-${TARTIM_GIRIS_PROGRAM_ID}`,
              seviye: 'sira',
              kaynak: 'tartim',
              baslik: 'T1',
              aciklama: '',
              href: '/',
              planGun: 1,
            },
            {
              id: 'takviye-ozet-parazit-ivermektin',
              seviye: 'sira',
              kaynak: 'asi',
              baslik: 'İver',
              aciklama: '',
              href: '/',
              planGun: 1,
            },
            {
              id: 'takviye-ozet-vitamin-selen-e',
              seviye: 'plan',
              kaynak: 'asi',
              baslik: 'Selen',
              aciklama: '',
              href: '/',
              planGun: 1,
            },
            {
              id: 'takviye-ozet-asi-karma',
              seviye: 'sira',
              kaynak: 'asi',
              baslik: 'Karma',
              aciklama: '',
              href: '/',
              planGun: 1,
            },
            {
              id: 'takviye-ozet-vitamin-probiyotik',
              seviye: 'plan',
              kaynak: 'asi',
              baslik: 'Probiyotik',
              aciklama: '',
              href: '/',
              planGun: 1,
            },
            {
              id: 'takviye-ozet-vitamin-premiks',
              seviye: 'plan',
              kaynak: 'asi',
              baslik: 'Premiks',
              aciklama: '',
              href: '/',
              planGun: 1,
            },
          ],
        },
        {
          gun: 21,
          baslik: 'Gün 21',
          gorevler: [
            {
              id: 'takviye-ozet-asi-karma-rapel',
              seviye: 'plan',
              kaynak: 'asi',
              baslik: 'Rapel',
              aciklama: '',
              href: '/',
              planGun: 21,
            },
          ],
        },
      ],
      sahteSecim,
    );
    const gun1 = filtreli.find((g) => g.gun === 1);

    return [
      test('Gün 1 oturum seçimi', '4 seçenek', GUN1_SECENEKLER.length === 4),
      test(
        'Gün 1 oturum seçimi',
        'Sadece tartım',
        sadece.length === 1 && sadece[0] === TARTIM_GIRIS_PROGRAM_ID,
      ),
      test(
        'Gün 1 oturum seçimi',
        'Paket tartı+iver+alben+karma',
        paket.includes(TARTIM_GIRIS_PROGRAM_ID) &&
          paket.includes('ivermektin') &&
          paket.includes('karma') &&
          (!girisPaketindeAlbendazol() || paket.includes('albendazol')),
      ),
      test(
        'Gün 1 oturum seçimi',
        'Hepsi = tartı+aşı/iğne, yem yok',
        hepsi[0] === TARTIM_GIRIS_PROGRAM_ID &&
          hepsi.length === 7 &&
          !hepsi.some((id) =>
            (GUN1_BESLENME_PROGRAM_IDS as readonly string[]).includes(id),
          ) &&
          hepsi.includes('selen-e'),
      ),
      test(
        'Gün 1 oturum seçimi',
        'Özel beslenmeyi eler',
        ozel.length === 2 &&
          ozel.includes('karma') &&
          !ozel.includes('probiyotik') &&
          !ozel.includes('premiks'),
      ),
      test(
        'Gün 1 oturum seçimi',
        'Checklist’te yem/beslenme yok',
        kalemler.some((k) => k.programId === 'selen-e') &&
          girisPaketindeSelen() &&
          !kalemler.some((k) =>
            (GUN1_BESLENME_PROGRAM_IDS as readonly string[]).includes(k.programId),
          ),
      ),
      test(
        'Gün 1 oturum seçimi',
        'Hepsi metni yem ayrı diyor',
        /yem ayrı/i.test(GUN1_SECENEKLER.find((s) => s.mod === 'hepsi')!.aciklama),
      ),
      test(
        'Gün 1 oturum seçimi',
        'programId parse',
        gorevdenProgramId('takviye-ozet-parazit-ivermektin') === 'ivermektin',
      ),
      test(
        'Gün 1 oturum seçimi',
        'Filtre selen/beslenme çıkarır, rapel kalır',
        !!gun1 &&
          !gun1.gorevler.some((g) => g.id.includes('selen')) &&
          !gun1.gorevler.some((g) => g.id.includes('probiyotik')) &&
          !gun1.gorevler.some((g) => g.id.includes('premiks')) &&
          gun1.gorevler.some((g) => g.id.includes('ivermektin')) &&
          filtreli.some((g) => g.gun === 21),
      ),
    ];
  },
};
