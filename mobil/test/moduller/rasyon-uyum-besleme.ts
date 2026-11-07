import { test, type TestModul } from '../cerceve';
import {
  padokUyumKaydi,
  uyumBitisTarihi,
  uyumDonemDurumu,
  uyumOtomatikRasyonDegisimi,
  type UyumBeslemeKayit,
} from '@/kaynak/yem/uyum-besleme';

const k = (p: Partial<UyumBeslemeKayit>): UyumBeslemeKayit => ({
  id: 'u1',
  padok: 'Gözlem',
  baslangic: '2026-11-01',
  gunSayisi: 2,
  kayitZaman: '2026-10-31',
  ...p,
});

export const rasyonUyumBeslemeModul: TestModul = {
  grup: 'Rasyon · uyum beslemesi',
  calistir() {
    const bitis = uyumBitisTarihi('2026-11-01', 2);
    const kayit = k({});
    const liste = [kayit, k({ id: 'u2', padok: 'Padok A', kayitZaman: '2026-11-02' })];

    return [
      test('Uyum', '2 gün bitiş dahil', bitis === '2026-11-02'),
      test('Uyum', 'Devam içinde', uyumDonemDurumu(kayit, '2026-11-01') === 'devam'),
      test('Uyum', 'Süre sonu inceleme', uyumDonemDurumu(kayit, '2026-11-05') === 'inceleme_gerekli'),
      test('Uyum', 'Onay sonrası', uyumDonemDurumu({ ...kayit, incelemeOnay: true }, '2026-11-10') === 'onaylandi'),
      test('Uyum', 'Otomatik rasyon yok', uyumOtomatikRasyonDegisimi(kayit, '2026-11-10') === false),
      test('Uyum', 'Kayıt yok durumu', uyumDonemDurumu(null, '2026-11-01') === 'yok'),
      test('Uyum', 'Padok başına son kayıt', padokUyumKaydi(liste, 'Padok A')?.id === 'u2'),
      test('Uyum', 'Eksik padok kayıt', padokUyumKaydi(liste, 'Yok') === null),
    ];
  },
};
