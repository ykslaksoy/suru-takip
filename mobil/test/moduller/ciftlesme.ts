import { test, type TestModul, type TestSonuc } from '../cerceve';
import {
  aktifMi,
  beklenenDogum,
  beklenenKuzuSayisi,
  durum,
  gorevHatirlatmalari,
  grupla,
  gunEkle,
  gunFarki,
  hatirlatmalar,
  katimDogrula,
  katimKayitlari,
  koyunKaydi,
  ozet,
  sungerCikis,
  sungerdenKatim,
  ultrasonTarihi,
  type CiftlesmeKaydi,
} from '@/kaynak/ciftlesme/hesap';

const G = 'Çiftleşme / doğum';
let n = 0;
const yeniId = () => `c${++n}`;
const kayit = (p: Partial<CiftlesmeKaydi> = {}): CiftlesmeKaydi => ({ id: yeniId(), koyunId: 'k1', kocId: 'koc', yontem: 'koc', katimTarih: '2026-10-01', gebelikGun: 150, olusturma: '2026-10-01T10:00:00Z', ...p });

export const ciftlesmeModul: TestModul = {
  grup: G,
  calistir() {
    const r: TestSonuc[] = [];
    const t = (ad: string, k: boolean) => {
      r.push(test(G, ad, k));
    };
    t('gün ekle / fark (ay ve yıl geçişi)', gunEkle('2026-12-25', 10) === '2027-01-04' && gunFarki('2026-10-01', '2027-02-28') === 150);
    t('beklenen doğum = katım + 150', beklenenDogum({ katimTarih: '2026-10-01', gebelikGun: 150 }) === '2027-02-28');
    t('gebelik süresi düzenlenebilir (147)', beklenenDogum({ katimTarih: '2026-10-01', gebelikGun: 147 }) === '2027-02-25');
    t('ultrason = katım + 45', ultrasonTarihi({ katimTarih: '2026-10-01' }) === '2026-11-15');
    t('sünger: takma + 14 çıkış, +2 koç', sungerCikis({ sungerTakma: '2026-10-01', sungerGun: 14 }) === '2026-10-15' && sungerdenKatim('2026-10-01', 14) === '2026-10-17');
    // doğrulama
    t('katım: koç yöntemi koç ister', katimDogrula({ koyunIds: ['a'], kocId: null, yontem: 'koc', tarih: '2026-10-01' }, '2026-10-19') === 'Koç seç');
    t('katım: suni tohumlamada koç gerekmez', katimDogrula({ koyunIds: ['a'], kocId: null, yontem: 'suni', tarih: '2026-10-01' }, '2026-10-19') === null);
    t('katım: koyun seçilmeli', katimDogrula({ koyunIds: [], kocId: 'x', yontem: 'koc', tarih: '2026-10-01' }, '2026-10-19') !== null);
    t('katım: gelecek tarih yalnız süngerde', katimDogrula({ koyunIds: ['a'], kocId: 'x', yontem: 'koc', tarih: '2026-10-25' }, '2026-10-19') !== null && katimDogrula({ koyunIds: ['a'], kocId: 'x', yontem: 'sunger', tarih: '2026-10-25' }, '2026-10-19') === null);
    t('katım: gebelik 140–160 dışı reddedilir', katimDogrula({ koyunIds: ['a'], kocId: 'x', yontem: 'koc', tarih: '2026-10-01', gebelikGun: 120 }, '2026-10-19') !== null);
    // toplu
    const mevcut = [kayit({ koyunId: 'k2' })];
    const s = katimKayitlari({ koyunIds: ['k1', 'k2', 'k3', 'k1'], kocId: 'koc', yontem: 'sunger', tarih: '2026-10-01', sungerGun: 12 }, mevcut, yeniId, 'now');
    t('toplu katım: aktif kaydı olan atlanır, tekrar tekilleşir', s.kayitlar.length === 2 && s.atlanan.join() === 'k2');
    t('toplu süngerleme: katım tarihi hesaplanır', s.kayitlar[0].katimTarih === '2026-10-15' && s.kayitlar[0].sungerTakma === '2026-10-01');
    const bos = [kayit({ koyunId: 'k2', ultrason: { tarih: '2026-11-15', sonuc: 'bos' } })];
    t('boş çıkan koyun yeniden koça verilebilir', katimKayitlari({ koyunIds: ['k2'], kocId: 'koc', yontem: 'koc', tarih: '2026-12-01' }, bos, yeniId, 'now').kayitlar.length === 1);
    // durum
    t('durum: sünger takılı', durum(s.kayitlar[0], '2026-10-10') === 'sunger');
    t('durum: katım yapıldı → gebe → doğurdu', durum(kayit(), '2026-10-19') === 'bekleniyor' && durum(kayit({ ultrason: { tarih: '2026-11-15', sonuc: 'gebe' } }), '2026-12-01') === 'gebe' && durum(kayit({ dogum: { tarih: '2027-02-27', kuzuIds: ['x'], canli: 1, olu: 0 } }), '2027-03-01') === 'dogurdu');
    t('durum: beklenen + 7 gün geçti → gecikti', durum(kayit(), '2027-03-08') === 'gecikti' && durum(kayit(), '2027-03-07') === 'bekleniyor');
    t('durum: boş', durum(kayit({ ultrason: { tarih: '2026-11-15', sonuc: 'bos' } }), '2026-12-01') === 'bos' && !aktifMi(kayit({ ultrason: { tarih: '2026-11-15', sonuc: 'bos' } })));
    // hatırlatma
    const h = hatirlatmalar([kayit({ koyunId: 'a' }), kayit({ koyunId: 'b' }), kayit({ koyunId: 'c', ultrason: { tarih: '2026-11-15', sonuc: 'gebe' } })], '2026-10-19');
    t('hatırlatma: ultrasonu olmayana ultrason + herkese doğum', h.filter((x) => x.tur === 'ultrason').length === 2 && h.filter((x) => x.tur === 'dogum').length === 3);
    const gr = grupla(h);
    t('aynı gün aynı iş tek satır (toplu)', gr.length === 2 && gr.find((g) => g.tur === 'dogum')?.koyunIds.length === 3);
    t('görevler: ultrason günü gelmeden görünmez', gorevHatirlatmalari([kayit()], '2026-11-10').length === 0 && gorevHatirlatmalari([kayit()], '2026-11-15').some((x) => x.tur === 'ultrason'));
    t('görevler: doğuma 14 gün kala görünür', gorevHatirlatmalari([kayit({ ultrason: { tarih: '2026-11-15', sonuc: 'gebe' } })], '2027-02-14').some((x) => x.tur === 'dogum') && gorevHatirlatmalari([kayit({ ultrason: { tarih: '2026-11-15', sonuc: 'gebe' } })], '2027-02-10').length === 0);
    t('görevler: sünger çıkarma bir gün önceden', gorevHatirlatmalari([s.kayitlar[0]], '2026-10-12').some((x) => x.tur === 'sunger-cikar') && !gorevHatirlatmalari([s.kayitlar[0]], '2026-10-10').some((x) => x.tur === 'sunger-cikar'));
    t('görevler: gecikti', gorevHatirlatmalari([kayit()], '2027-03-10').some((x) => x.tur === 'gecikti'));
    t('doğurmuş / silinmiş kayıt hatırlatma üretmez', hatirlatmalar([kayit({ dogum: { tarih: '2027-02-27', kuzuIds: [], canli: 2, olu: 0 } }), kayit({ silindi: 'x' })], '2026-10-19').length === 0);
    // özet
    const o = ozet(
      [
        kayit({ ultrason: { tarih: '2026-11-15', sonuc: 'gebe' }, dogum: { tarih: '2027-02-27', kuzuIds: ['1', '2'], canli: 2, olu: 0 } }),
        kayit({ ultrason: { tarih: '2026-11-15', sonuc: 'gebe' }, dogum: { tarih: '2027-02-28', kuzuIds: ['3'], canli: 1, olu: 1 } }),
        kayit({ ultrason: { tarih: '2026-11-15', sonuc: 'bos' } }),
        kayit({ ultrason: { tarih: '2026-11-15', sonuc: 'gebe', yavruSayisi: 2 } }),
      ],
      '2027-01-01',
    );
    t('özet: gebelik oranı %75, kuzu verimi 2', o.gebelikOrani === 0.75 && o.kuzuVerimi === 2 && o.dogurdu === 2 && o.bos === 1 && o.gebe === 1 && o.oluKuzu === 1);
    t('doğum formu: ultrason ikiz → 2 kuzu satırı', beklenenKuzuSayisi(kayit({ ultrason: { tarih: 'x', sonuc: 'gebe', yavruSayisi: 2 } })) === 2 && beklenenKuzuSayisi(null) === 1);
    t('koyunun kaydı: aktif olan önce', koyunKaydi([kayit({ koyunId: 'z', katimTarih: '2026-01-01', dogum: { tarih: '2026-05-30', kuzuIds: [], canli: 1, olu: 0 } }), kayit({ koyunId: 'z', katimTarih: '2026-09-01' })], 'z')?.katimTarih === '2026-09-01');
    return r;
  },
};
