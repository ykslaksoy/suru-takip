import { test, type TestModul } from '../cerceve';
import {
  gecmisKaydiOlustur,
  kapsamHayvanlari,
  kupeEsle,
  sayimaEkle,
  sayimRaporu,
  sesGeriOkuma,
  sestenKupeler,
  type SayimOturumu,
} from '@/kaynak/sayim/hesap';
import type { Animal } from '@/kaynak/cekirdek/tipler';

const G = 'Sayım listesi';
const an = (n: number, paddock: string, status: Animal['status'] = 'healthy'): Animal => ({
  id: `h${n}`, earTag: `TR-34-2000${String(n).padStart(2, '0')}`, turkvetNo: '', name: '', breed: '', species: 'sheep', sex: 'male',
  birthDate: '', paddock, status, motherId: null, gehisId: null, sirtNo: String(n), modId: 'mod1', notes: '', createdAt: '', updatedAt: '', syncStatus: 'synced',
});

export const sayimModul: TestModul = {
  grup: G,
  calistir() {
    const suru = [an(1, 'Padok A'), an(2, 'Padok A'), an(3, 'Padok A'), an(4, 'Padok B'), an(5, 'Padok B', 'sold')];
    const bos: SayimOturumu = { id: 's1', kapsam: 'tum', baslangic: '', sayilan: [] };
    const r1 = sayimaEkle(bos, suru, 'TR-34-200001');
    const r2 = sayimaEkle(r1.oturum, suru, '1'); // aynı kuzu sırt no ile
    const r3 = sayimaEkle(r2.oturum, suru, '2', 'ses');
    const r4 = sayimaEkle(r3.oturum, suru, '999777');
    const r5 = sayimaEkle(r4.oturum, suru, '999777');
    const r6 = sayimaEkle(r5.oturum, suru, 'abc');
    const rap = sayimRaporu(r6.oturum, suru);
    const padokOt: SayimOturumu = { id: 's2', kapsam: 'Padok A', baslangic: '', sayilan: [] };
    const p1 = sayimaEkle(padokOt, suru, '4');
    const padokRap = sayimRaporu(sayimaEkle(p1.oturum, suru, '1').oturum, suru);
    const satilan = sayimaEkle(bos, suru, 'TR-34-200005');
    const gk = gecmisKaydiOlustur(r6.oturum, rap, '2026-10-19T10:00:00.000Z');
    return [
      test(G, 'küpe ile eşleşir', kupeEsle(suru, 'tr-34-200003')?.id === 'h3'),
      test(G, 'sırt no ile eşleşir', kupeEsle(suru, '4')?.id === 'h4'),
      test(G, 'eklendi', r1.durum === 'eklendi' && r1.oturum.sayilan.length === 1),
      test(G, 'tekrar okutma yok sayılır (bildirimle)', r2.durum === 'tekrar' && r2.oturum.sayilan.length === 1 && r2.mesaj.includes('zaten')),
      test(G, 'sesli giriş yöntemi saklanır', r3.oturum.sayilan[1].yontem === 'ses'),
      test(G, 'sürüde olmayan küpe = fazla', r4.durum === 'fazla' && r4.oturum.sayilan.length === 3),
      test(G, 'fazla küpe de tekrar sayılmaz', r5.durum === 'tekrar' && r5.oturum.sayilan.length === 3),
      test(G, 'rakamsız giriş geçersiz', r6.durum === 'gecersiz'),
      test(G, 'satılan kuzu sürüde sayılmaz (fazla)', satilan.durum === 'fazla'),
      test(G, 'beklenen = aktif sürü', rap.beklenen === 4 && kapsamHayvanlari(suru, 'Padok B').length === 1),
      test(G, 'rapor: eksik', rap.eksik.map((a) => a.id).join(',') === 'h3,h4'),
      test(G, 'rapor: fazla', rap.fazla.join(',') === '999777' && rap.sayilan === 3 && rap.eslesen === 2),
      test(G, 'padok sayımı: başka padoktaki kuzu ayrı', p1.durum === 'eklendi' && padokRap.baskaPadok.map((a) => a.id).join(',') === 'h4' && padokRap.beklenen === 3 && padokRap.eksik.length === 2),
      test(G, 'geçmiş kaydı etiketli ve tarihli', gk.bitis.startsWith('2026-10-19') && gk.eksik[0].etiket === 'Sırt 3' && gk.fazla[0] === '999777'),
      test(G, 'sesten tek küpe', sestenKupeler('küpe 1203').join(',') === '1203'),
      test(G, 'sesten çoklu küpe', sestenKupeler('1201 1202 ve 1203').join(',') === '1201,1202,1203'),
      test(G, 'sesten TR küpe birleşir', sestenKupeler('TR 34 200001').join(',') === 'TR-34-200001'),
      test(G, 'geri okuma onay ister', sesGeriOkuma(['1203']).includes('bin iki yüz üç') && sesGeriOkuma(['1203']).includes('tamam')),
      test(G, 'geri okuma çoklu', sesGeriOkuma(['1201', '1202']).startsWith('2 küpe')),
      test(G, 'anlaşılmadı metni', sesGeriOkuma([]).includes('anlaşılmadı')),
    ];
  },
};
