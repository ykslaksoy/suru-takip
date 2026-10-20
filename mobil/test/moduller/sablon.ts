import { test, type TestModul } from '../cerceve';
import {
  adimEtiket,
  adimlariTemizle,
  adimTasi,
  GIRIS_PAKETI_ID,
  sablonDogrula,
  sablonOzet,
  secilebilirAdimlar,
  VARSAYILAN_SABLONLAR,
  type SablonAdim,
} from '@/kaynak/sablon/hesap';

const G = 'Kayıt şablonları';

export const sablonModul: TestModul = {
  grup: G,
  calistir() {
    const giris = VARSAYILAN_SABLONLAR.find((s) => s.id === GIRIS_PAKETI_ID)!;
    const adimlar: SablonAdim[] = [{ tur: 'tartim' }, { tur: 'asi', programId: 'karma' }];
    return [
      test(G, 'Giriş paketi 5 adım: tartım, ivermektin, albendazol, karma, selenyum-E',
        giris.adimlar.map((a) => (a.tur === 'tartim' ? 'tartim' : a.programId)).join(',') === 'tartim,ivermektin,albendazol,karma,selen-e'),
      test(G, 'varsayılan adımların hepsi geçerli', VARSAYILAN_SABLONLAR.every((s) => adimlariTemizle(s.adimlar).length === s.adimlar.length)),
      test(G, 'aynı adım iki kez eklenmez', adimlariTemizle([...adimlar, { tur: 'asi', programId: 'karma' }]).length === 2),
      test(G, 'geçersiz program atılır', adimlariTemizle([{ tur: 'asi', programId: 'yok-boyle' }]).length === 0),
      test(G, 'adım etiketi', adimEtiket({ tur: 'tartim' }).includes('Tartım') && adimEtiket({ tur: 'vitamin', programId: 'selen-e' }).startsWith('🧪')),
      test(G, 'parazit adımı ilaç simgesi', adimEtiket({ tur: 'asi', programId: 'ivermektin' }).startsWith('💊')),
      test(G, 'özet sırayı korur', sablonOzet({ adimlar }).indexOf('Tartım') < sablonOzet({ adimlar }).indexOf('Karma')),
      test(G, 'adım yukarı taşınır', (adimTasi(adimlar, 1, -1)[0] as { programId?: string }).programId === 'karma'),
      test(G, 'sınırda taşıma değiştirmez', adimTasi(adimlar, 0, -1) === adimlar),
      test(G, 'doğrulama: ad zorunlu', sablonDogrula(' ', adimlar) !== null),
      test(G, 'doğrulama: adım zorunlu', sablonDogrula('X', []) !== null),
      test(G, 'doğrulama: aynı ad (büyük/küçük harf)', sablonDogrula('giriş paketi', adimlar, ['Giriş paketi']) !== null),
      test(G, 'doğrulama: geçerli', sablonDogrula('Sütten kesim', adimlar, ['Giriş paketi']) === null),
      test(G, 'seçilebilir adımlarda tartım + aşı + vitamin', (() => {
        const l = secilebilirAdimlar();
        return l[0].tur === 'tartim' && l.some((a) => a.tur === 'asi') && l.some((a) => a.tur === 'vitamin');
      })()),
    ];
  },
};
