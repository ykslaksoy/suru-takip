import { test, type TestModul } from '../cerceve';
import {
  incelemeGerekliMi,
  uyumDonemDurumu,
  uyumEtkinBitis,
  uyumOtomatikRasyonDegisimi,
  type UyumBeslemeKayit,
} from '@/kaynak/yem/uyum-besleme';
import {
  karantinaKapsamGecerli,
  uyumKararUygula,
  uyumOtomatikIlacUygulama,
  uyumOtomatikKarantina,
  uyumOtomatikSaglikTemizligi,
  uyumUzatmaOneriBitis,
} from '@/kaynak/yem/uyum-inceleme';
import { uyumVeterinerOzeti } from '@/kaynak/yem/uyum-veteriner-baglam';

const k = (p: Partial<UyumBeslemeKayit>): UyumBeslemeKayit => ({
  id: 'u1',
  padok: 'Gözlem',
  baslangic: '2026-11-01',
  gunSayisi: 2,
  kayitZaman: '2026-10-31',
  ...p,
});

export const rasyonUyumIncelemeModul: TestModul = {
  grup: 'Rasyon · gözlem inceleme',
  calistir() {
    const kayit = k({});
    const bitis = uyumEtkinBitis(kayit);

    const uzat = uyumKararUygula(kayit, {
      karar: 'gozlem_uzat',
      neden: 'İştah düzensiz',
      sonrakiInceleme: '2026-11-08',
      hayvanIds: [],
    });
    const besiye = uyumKararUygula(kayit, {
      karar: 'besiye_gecis',
      neden: 'Padok stabil',
      hayvanIds: [],
    });
    const suphe = uyumKararUygula(kayit, {
      karar: 'karantina_suphe',
      neden: 'Tek kuzu halsiz',
      supheNotu: 'Halsizlik — teşhis yok',
      hayvanIds: ['a1'],
      hedefPadok: 'Karantina',
    });

    const vetBos = uyumVeterinerOzeti(['a1'], [], []);
    const vetVar = uyumVeterinerOzeti(
      ['a1'],
      [{ animalId: 'a1', recordType: 'treatment', treatment: 'Plan', medicine: 'X', diagnosis: '', vetName: 'Dr' }],
      [],
    );

    return [
      test('Inceleme', 'Süre sonu inceleme zorunlu', uyumDonemDurumu(kayit, '2026-11-05') === 'inceleme_gerekli'),
      test('Inceleme', 'Süre sonu otomatik karantina yok', uyumOtomatikKarantina(kayit, '2026-11-05') === false),
      test('Inceleme', 'Süre sonu otomatik ilaç yok', uyumOtomatikIlacUygulama() === false),
      test('Inceleme', 'Süre sonu otomatik sağlık temizliği yok', uyumOtomatikSaglikTemizligi() === false),
      test('Inceleme', 'Uzatma bitişine kadar devam', uyumDonemDurumu(uzat, '2026-11-07') === 'devam'),
      test(
        'Inceleme',
        'Uzatma sonrası tekrar inceleme',
        uyumDonemDurumu(uzat, '2026-11-09') === 'inceleme_gerekli',
      ),
      test('Inceleme', 'Uzatma rasyon otomatik değişmez', uyumOtomatikRasyonDegisimi(uzat, '2026-11-07') === false),
      test('Inceleme', 'Besiye geçiş onayı', uyumDonemDurumu(besiye, '2026-11-20') === 'besiye_gecis_onay'),
      test('Inceleme', 'Şüphe kaydı', uyumDonemDurumu(suphe, '2026-11-20') === 'suphe_kaydi'),
      test('Inceleme', 'Şüphe teşhis alanı boş kalmaz zorunlu', suphe.incelemeKararlari?.[0]?.supheNotu?.includes('teşhis') === true),
      test('Inceleme', 'Bireysel kapsam geçerli', karantinaKapsamGecerli(['a1'], ['a1', 'a2']) === true),
      test('Inceleme', 'Bireysel kapsam dış padok yok', karantinaKapsamGecerli(['x'], ['a1']) === false),
      test('Inceleme', 'Karar geçmişi korunur', (uzat.incelemeKararlari?.length ?? 0) === 1),
      test('Inceleme', 'Etkin bitiş uzatmayı yansıtır', uyumEtkinBitis(uzat) === '2026-11-08'),
      test('Inceleme', 'Etkin bitiş temel', bitis === '2026-11-02'),
      test('Inceleme', 'Uzatma öneri tarihi', uyumUzatmaOneriBitis('2026-11-05', 2) === '2026-11-07'),
      test('Inceleme', 'İnceleme gerekli bayrağı', incelemeGerekliMi(kayit, '2026-11-05') === true),
      test('Vet', 'Plan yoksa eylem gerekli', vetBos.eylemGerekli === true),
      test('Vet', 'Plan varsa eylem gerekli değil', vetVar.eylemGerekli === false),
      test('Vet', 'Otomatik tedavi yok mesajı', vetBos.ozet.includes('veteriner') === true),
    ];
  },
};
