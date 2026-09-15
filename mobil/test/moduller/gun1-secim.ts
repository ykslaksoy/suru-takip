import {
  GUN1_BESLENME_PROGRAM_IDS,
  GUN1_MIN_STANDART_PROGRAM_IDS,
  GUN1_SECENEKLER,
  eksikMinStandart,
  etkinMinStandartIds,
  girisPaketindeAlbendazol,
  girisPaketindeSelen,
  gorevdenProgramId,
  gun1KalemEtiketleri,
  gun1ProgramIdsForMod,
  gunGruplariniSecimeGoreFiltrele,
  kalemFayda,
  minStandartTavsiyeMesaji,
  opsiyonelVitaminOner,
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
      'ad3e',
    ]);
    const kalemler = gun1KalemEtiketleri();
    const eksikSadece = eksikMinStandart(sadece);
    const tavsiye = minStandartTavsiyeMesaji(eksikSadece);

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
              id: 'takviye-ozet-vitamin-ad3e',
              seviye: 'plan',
              kaynak: 'asi',
              baslik: 'AD3E',
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
    const kullaniciStandart = etkinMinStandartIds([
      TARTIM_GIRIS_PROGRAM_ID,
      'ivermektin',
      'karma',
    ]);
    const hepsiOverride = gun1ProgramIdsForMod('hepsi', undefined, kullaniciStandart);

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
        'Hepsi = min standart (5), A-D3-E/B/yem yok',
        hepsi.length === GUN1_MIN_STANDART_PROGRAM_IDS.length &&
          hepsi.every((id) => GUN1_MIN_STANDART_PROGRAM_IDS.includes(id)) &&
          !hepsi.includes('ad3e') &&
          !hepsi.includes('b-kompleks') &&
          !hepsi.some((id) =>
            (GUN1_BESLENME_PROGRAM_IDS as readonly string[]).includes(id),
          ) &&
          hepsi.includes('selen-e'),
      ),
      test(
        'Gün 1 oturum seçimi',
        'Özel beslenmeyi eler, A-D3-E opsiyonel kalır',
        ozel.includes('karma') &&
          ozel.includes('ad3e') &&
          !ozel.includes('probiyotik') &&
          !ozel.includes('premiks'),
      ),
      test(
        'Gün 1 oturum seçimi',
        'Checklist’te selen + opsiyonel A-D3-E, yem yok',
        kalemler.some((k) => k.programId === 'selen-e') &&
          girisPaketindeSelen() &&
          kalemler.some((k) => k.programId === 'ad3e' && k.opsiyonel) &&
          kalemler.some((k) => k.programId === 'b-kompleks' && k.opsiyonel) &&
          !kalemler.some((k) =>
            (GUN1_BESLENME_PROGRAM_IDS as readonly string[]).includes(k.programId),
          ),
      ),
      test(
        'Gün 1 oturum seçimi',
        'Hepsi metni min standart',
        /minimum standart/i.test(GUN1_SECENEKLER.find((s) => s.mod === 'hepsi')!.aciklama),
      ),
      test(
        'Gün 1 oturum seçimi',
        'Soft tavsiye + fayda',
        !!tavsiye &&
          /tavsiye edilir/i.test(tavsiye) &&
          !!kalemFayda('selen-e') &&
          !!kalemFayda('ivermektin'),
      ),
      test(
        'Gün 1 oturum seçimi',
        'Kullanıcı standardı hepsi’yi ezer',
        hepsiOverride.length === 3 &&
          hepsiOverride.includes('karma') &&
          !hepsiOverride.includes('selen-e'),
      ),
      test(
        'Gün 1 oturum seçimi',
        'AI gerekli → A-D3-E/B öner',
        opsiyonelVitaminOner({ zayif: true, istahYok: true }).includes('ad3e') &&
          opsiyonelVitaminOner({ stres: true }).includes('b-kompleks'),
      ),
      test(
        'Gün 1 oturum seçimi',
        'programId parse',
        gorevdenProgramId('takviye-ozet-parazit-ivermektin') === 'ivermektin',
      ),
      test(
        'Gün 1 oturum seçimi',
        'Filtre selen/ad3e/beslenme çıkarır, rapel kalır',
        !!gun1 &&
          !gun1.gorevler.some((g) => g.id.includes('selen')) &&
          !gun1.gorevler.some((g) => g.id.includes('ad3e')) &&
          !gun1.gorevler.some((g) => g.id.includes('probiyotik')) &&
          gun1.gorevler.some((g) => g.id.includes('ivermektin')) &&
          filtreli.some((g) => g.gun === 21),
      ),
    ];
  },
};
