import { test, type TestModul } from '../cerceve';
import {
  ARINMA_TABLOSU,
  gunEkle,
  gunFarki,
  hayvanArinmalari,
  ilacGunu,
  kayitArinmasi,
  kesilemezMetni,
  metindenIlaclar,
  satistaArinmadakiler,
  tarihTR,
  type ArinmaKaydi,
} from '@/kaynak/arinma/hesap';
import { arinmaKontroluGerekli, cikisaHazirla, cikisDurumu, cikisNotu } from '@/kaynak/satis';
import { STOK_KATALOGU } from '@/kaynak/stok/katalog';
import type { Animal } from '@/kaynak/cekirdek/tipler';

const G = 'İlaç arınma süresi';
const k = (id: string, animalId: string, recordedAt: string, medicine: string, withdrawalDays = 0): ArinmaKaydi => ({
  id, animalId, recordedAt, medicine, treatment: '', withdrawalDays,
});

export const arinmaModul: TestModul = {
  grup: G,
  calistir() {
    const bugun = '2026-10-19';
    const kayitlar = [
      k('1', 'a', '2026-10-10', 'Parazit koruma (İvermektin iğne)'), // 42 → 2026-11-21
      k('2', 'a', '2026-10-15', 'Albendazol'), // 10 → 2026-10-25 (daha erken)
      k('3', 'b', '2026-09-01', 'Albendazol'), // bitti
      k('4', 'c', '2026-10-18T09:00:00.000Z', 'Karma aşı'), // 0
      k('5', 'd', '2026-10-18', 'Özel ilaç', 5), // elle 5 → 2026-10-23
      k('6', 'e', '2026-10-01', 'oxytetracycline LA'), // 28 → 2026-10-29
    ];
    const l = hayvanArinmalari(kayitlar, bugun);
    const a = l.find((x) => x.animalId === 'a');
    const an: Animal = {
      id: 'x', earTag: 'TR1', turkvetNo: '', name: '', breed: '', species: 'sheep', sex: 'male', birthDate: '', paddock: 'A',
      status: 'healthy', motherId: null, gehisId: null, sirtNo: null, modId: 'mod1', notes: 'Alım', createdAt: '', updatedAt: '', syncStatus: 'synced',
    };
    const ilacIds = STOK_KATALOGU.filter((s) => s.type === 'medicine' || s.type === 'vaccine').map((s) => s.id);
    return [
      test(G, 'katalogdaki her ilaç ve aşının arınma satırı var', ilacIds.every((id) => ARINMA_TABLOSU.some((t) => t.id === id))),
      test(G, 'gün ekleme ay geçişi', gunEkle('2026-10-10', 42) === '2026-11-21' && gunEkle('2026-12-31T22:00:00Z', 1) === '2027-01-01'),
      test(G, 'gün farkı', gunFarki('2026-10-19', '2026-11-21') === 33),
      test(G, 'ivermektin eşleşir (iğne metninden)', metindenIlaclar('Parazit koruma (İvermektin iğne)')[0]?.tanim.id === 'ivermectin'),
      test(G, 'ingilizce etken madde eşleşir', metindenIlaclar('Dectomax')[0]?.tanim.id === 'doramectin'),
      test(G, 'varsayılan değer tahmini', ilacGunu(ARINMA_TABLOSU.find((t) => t.id === 'doramectin')!).kaynak === 'tahmini'),
      test(G, 'kullanıcı düzeltmesi esas alınır', ilacGunu(ARINMA_TABLOSU.find((t) => t.id === 'doramectin')!, { doramectin: 35 }).gun === 35),
      test(G, 'aşı arınma yaratmaz', kayitArinmasi(k('x', 'c', bugun, 'Karma aşı')) === null),
      test(G, 'elle gün tablodan büyükse elle esas', kayitArinmasi(k('x', 'a', bugun, 'Albendazol', 30))?.gun === 30),
      test(G, 'tablo elle günden büyükse tablo esas', kayitArinmasi(k('x', 'a', bugun, 'İvermektin', 14))?.gun === 42),
      test(G, 'tanımsız ilaç + elle gün', kayitArinmasi(k('x', 'd', bugun, 'Özel ilaç', 5))?.kaynak === 'kayit'),
      test(G, 'hayvan başına en geç biten arınma', a?.bitis === '2026-11-21' && a?.ilac === 'İvermektin' && a?.kalanGun === 33),
      test(G, 'süresi biten arınma listede yok', !l.some((x) => x.animalId === 'b')),
      test(G, 'aşı kaydı listede yok', !l.some((x) => x.animalId === 'c')),
      test(G, 'liste en yakın bitişe göre sıralı', l.map((x) => x.animalId).join(',') === 'd,e,a'),
      test(G, 'bitiş günü serbest (dahil değil)', !hayvanArinmalari(kayitlar, '2026-10-23').some((x) => x.animalId === 'd')),
      test(G, 'satılan/ölen hayvan hariç tutulur', !hayvanArinmalari(kayitlar, bugun, {}, new Set(['a'])).some((x) => x.animalId !== 'a')),
      test(G, 'satışta arınmadakiler ayıklanır', satistaArinmadakiler(['a', 'b', 'c'], l).map((x) => x.animalId).join(',') === 'a'),
      test(G, 'kesilemez metni', kesilemezMetni({ bitis: '2026-11-21', ilac: 'İvermektin', kalanGun: 33 }).includes('21.11.2026 tarihine kadar kesilemez')),
      test(G, 'tarih TR', tarihTR('2026-11-21T00:00:00Z') === '21.11.2026'),
      test(G, 'çıkış durumları', cikisDurumu('satis') === 'sold' && cikisDurumu('kesim') === 'sold' && cikisDurumu('olum') === 'dead'),
      test(G, 'ölümde arınma kontrolü yok', !arinmaKontroluGerekli('olum') && arinmaKontroluGerekli('kesim')),
      test(G, 'çıkış notu eklenir', cikisNotu(an, 'satis', '19.10.2026', 9000).endsWith('Çıkış: Satış 19.10.2026 · 9.000 ₺')),
      test(G, 'çıkışa hazırla durumu değiştirir', cikisaHazirla(an, 'kesim', '19.10.2026').status === 'sold'),
    ];
  },
};
