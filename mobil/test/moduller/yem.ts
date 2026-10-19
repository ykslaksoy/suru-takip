import { test, type TestModul, type TestSonuc } from '../cerceve';
import {
  agirlikliFiyat,
  bekleyenGunler,
  dusumNotu,
  dusumPlani,
  EN_COK_GERIYE_GUN,
  gunlukTuketim,
  ilerletilecekRasyonlar,
  kacGunYeter,
  rasyonDogrula,
  rasyonMaliyeti,
  sayiOku,
  yemBitisOlaylari,
  yemDurumlari,
  type PartiRasyonu,
} from '@/kaynak/yem/hesap';
import { kabaPayi, partiOrtalamaKg, rasyonOnerisi, rasyonsuzPartiler, VARSAYILAN_KG, yemSinifi } from '@/kaynak/yem/oneri';
import { calculateRation } from '@/kaynak/rasyon/hesapla';
import { partiMaliyetleri } from '@/kaynak/maliyet/hesap';
import type { Animal, StockItem, StockMovement } from '@/kaynak/cekirdek/tipler';

const G = 'Yem ve rasyon';

function r(p: Partial<PartiRasyonu>): PartiRasyonu {
  return { id: 'r1', parti: 'Padok A', kalemler: [{ stockId: 'arpa', kgBasGun: 0.6 }, { stockId: 'yonca', kgBasGun: 0.4 }], baslangic: '2026-10-17', sonDusum: null, aktif: true, guncelleme: '', ...p };
}

export const yemModul: TestModul = {
  grup: G,
  calistir() {
    const out: TestSonuc[] = [];
    const t = (ad: string, k: boolean) => {
      out.push(test(G, ad, k));
    };
    const bugun = '2026-10-19';
    t('ilk çalışmada başlangıçtan bugüne (dahil) 3 gün', bekleyenGunler(r({}), bugun).join() === '2026-10-17,2026-10-18,2026-10-19');
    t('bugün düşüldüyse bekleyen yok (çift düşüm yok)', bekleyenGunler(r({ sonDusum: bugun }), bugun).length === 0);
    t('dünden kalan tek gün', bekleyenGunler(r({ sonDusum: '2026-10-18' }), bugun).join() === bugun);
    t('ileri tarihli başlangıç beklemez', bekleyenGunler(r({ baslangic: '2026-10-25' }), bugun).length === 0);
    t('pasif rasyon düşülmez', bekleyenGunler(r({ aktif: false }), bugun).length === 0);
    t(`geriye en çok ${EN_COK_GERIYE_GUN} gün`, bekleyenGunler(r({ baslangic: '2026-01-01' }), bugun).length === EN_COK_GERIYE_GUN);
    t('ay sonu geçişi', bekleyenGunler(r({ baslangic: '2026-10-30' }), '2026-11-01').join() === '2026-10-30,2026-10-31,2026-11-01');

    const plan = dusumPlani([r({}), r({ id: 'r2', parti: 'Padok B', kalemler: [{ stockId: 'arpa', kgBasGun: 1 }] })], { 'Padok A': 10, 'Padok B': 5 }, bugun);
    const arpaA = plan.find((p) => p.parti === 'Padok A' && p.stockId === 'arpa');
    t('düşüm = kg/baş/gün × baş × gün (0,6 × 10 × 3 = 18)', arpaA?.kg === 18 && arpaA.gunSayisi === 3);
    t('her parti ayrı kalem', plan.length === 3 && plan.find((p) => p.parti === 'Padok B')?.kg === 15);
    t('boş parti için kalem yok ama gün ilerler', dusumPlani([r({})], {}, bugun).length === 0 && ilerletilecekRasyonlar([r({})], bugun).length === 1);
    t('ondalık yuvarlama', dusumPlani([r({ kalemler: [{ stockId: 'x', kgBasGun: 0.35 }], sonDusum: '2026-10-18' })], { 'Padok A': 3 }, bugun)[0].kg === 1.05);

    const tk = gunlukTuketim([r({}), r({ id: 'r2', parti: 'Padok B', kalemler: [{ stockId: 'arpa', kgBasGun: 1 }] }), r({ id: 'r3', aktif: false, parti: 'C' })], { 'Padok A': 10, 'Padok B': 5, C: 100 });
    t('günlük tüketim yem başına toplanır, pasif sayılmaz', tk.arpa === 11 && tk.yonca === 4);
    t('kaç gün yeter', kacGunYeter(100, 11) === 9 && kacGunYeter(100, 0) === null && kacGunYeter(-5, 3) === 0);

    const d = yemDurumlari(
      [
        { id: 'arpa', name: 'Arpa', quantity: 50, minQuantity: 10 },
        { id: 'yonca', name: 'Yonca', quantity: 400, minQuantity: 10 },
        { id: 'saman', name: 'Saman', quantity: 5, minQuantity: 20 },
        { id: 'misir', name: 'Mısır', quantity: 0, minQuantity: 0 },
      ],
      { ...tk, misir: 2 },
      { arpa: 9 },
    );
    const du = (id: string) => d.find((x) => x.stockId === id);
    t('7 günden az yetecek yem "az"', du('arpa')?.uyari === 'az' && du('arpa')?.yeterGun === 4);
    t('yeten yem uyarısız', du('yonca')?.uyari === null && du('yonca')?.yeterGun === 100);
    t('rasyonda olmayan ama min altı "min"', du('saman')?.uyari === 'min');
    t('stok 0 ve rasyonda → "bitti"', du('misir')?.uyari === 'bitti');
    t('uyarılılar önce sıralanır', d[0].uyari != null && d[d.length - 1].stockId === 'yonca');
    t('takvim: tahmini bitiş günü', yemBitisOlaylari(d, bugun).find((e) => e.id === 'yem-bitis-arpa')?.tarih === '2026-10-23');

    t('ağırlıklı ortalama fiyat: 100 kg × 10 + 300 kg × 12 = 11,5', agirlikliFiyat(100, 10, 300, 12) === 11.5);
    t('stok boşsa yeni fiyat', agirlikliFiyat(0, 10, 100, 12) === 12 && agirlikliFiyat(50, null, 100, 12) === 12);
    t('sayı okuma 0,6 / 1.250 / 11.5', sayiOku('0,6') === 0.6 && sayiOku('1.250') === 1250 && sayiOku('11.5') === 11.5 && sayiOku('') === null);

    const m = rasyonMaliyeti(r({}), 10, { arpa: 10, yonca: 5 });
    t('rasyon maliyeti: 0,6×10 + 0,4×5 = 8 ₺/baş/gün, 10 baş 80 ₺', m.tlBasGun === 8 && m.tlGun === 80 && m.kgBasGun === 1);
    t('fiyatsız yem sayılır', rasyonMaliyeti(r({}), 10, { arpa: 10 }).fiyatsiz === 1);
    t('doğrulama: parti, boş, aşırı kg, tekrar', rasyonDogrula({ parti: '', kalemler: [] }) != null && rasyonDogrula({ parti: 'A', kalemler: [] }) != null && rasyonDogrula({ parti: 'A', kalemler: [{ stockId: 'a', kgBasGun: 8 }] }) != null && rasyonDogrula({ parti: 'A', kalemler: [{ stockId: 'a', kgBasGun: 1 }, { stockId: 'a', kgBasGun: 1 }] }) != null && rasyonDogrula({ parti: 'A', kalemler: [{ stockId: 'a', kgBasGun: 1 }] }) === null);

    // Maliyet entegrasyonu: düşüm notu parti adını taşır → yem gideri o partiye
    const not = dusumNotu({ parti: 'Padok B', gunSayisi: 3, ilkGun: '2026-10-17', sonGun: bugun, bas: 5 });
    t('düşüm notu parti + gün aralığı', not.includes('Padok B') && not.includes('3 gün') && not.includes('17.10–19.10'));
    const hay = (id: string, p: string) => ({ id, paddock: p, status: 'healthy', notes: '', earTag: id } as unknown as Animal);
    const items = [{ id: 'arpa', type: 'feed', name: 'Arpa' } as StockItem];
    const mov = [{ id: 'm', stockId: 'arpa', movementType: 'out', quantity: 15, recordedAt: '', notes: not } as StockMovement];
    const pm = partiMaliyetleri({ animals: [hay('a', 'Padok A'), hay('b', 'Padok B')], sonKg: {}, items, movements: mov, fiyatlar: { arpa: 10 }, ayar: { partiler: {}, hayvanAlis: {} } });
    t('maliyet: rasyon düşümü yalnız o partiye yem gideri (15 kg × 10 ₺)', pm.find((p) => p.parti === 'Padok B')?.yem === 150 && pm.find((p) => p.parti === 'Padok A')?.yem === 0);
    // Rasyonsuz padok önerisi
    {
      const yemler = [{ id: 'arpa', name: 'Arpa' }, { id: 'yonca', name: 'Yonca kuru otu' }, { id: 'hazir', name: 'Kuzu besi yemi' }];
      t('yem sınıfı: yonca/saman/silaj kaba, arpa/hazır yem kesif', yemSinifi('Yonca') === 'kaba' && yemSinifi('Buğday samanı') === 'kaba' && yemSinifi('Mısır silajı') === 'kaba' && yemSinifi('Arpa') === 'kesif' && yemSinifi('Kuzu besi yemi') === 'kesif');
      t('rasyonsuz partiler: kuzusu olup aktif rasyonu olmayan', rasyonsuzPartiler({ 'Padok A': 5, 'Padok C': 8, 'Padok B': 0 }, [{ parti: 'Padok A', aktif: true }]).join() === 'Padok C');
      t('pasif rasyon "rasyon yok" sayılır', rasyonsuzPartiler({ 'Padok A': 5 }, [{ parti: 'Padok A', aktif: false }]).join() === 'Padok A');
      const ort = partiOrtalamaKg([{ paddock: 'Padok C', sonKg: 30 }, { paddock: 'Padok C', sonKg: 40 }, { paddock: 'Padok C', sonKg: null }, { paddock: 'Padok D', sonKg: null }]);
      t('ortalama sadece tartımlılardan; tartımsız padok null', ort['Padok C'] === 35 && ort['Padok D'] === null);
      const o = rasyonOnerisi({ parti: 'Padok C', bas: 10, ortKg: 35, yemler });
      const ref = calculateRation({ liveWeightKg: 35, count: 10, phase: 'lamb_fattening', forageQuality: 'medium' });
      t('varsayılan dönem besi', o.faz === 'lamb_fattening' && o.tartimli);
      t('toplam kg/baş calculateRation ile uyumlu', Math.abs(o.gunlukKgBas - ref.dailyFeedKg) < 0.03);
      const kaba = o.kalemler.filter((k) => k.sinif === 'kaba').reduce((s, k) => s + k.kgBasGun, 0);
      t('besi: kaba pay %40', Math.abs(kaba - ref.dailyFeedKg * kabaPayi('lamb_fattening')) < 0.03);
      t('kesif pay stoktaki kesif yemlere eşit bölünür', o.kalemler.find((k) => k.stockId === 'arpa')?.kgBasGun === o.kalemler.find((k) => k.stockId === 'hazir')?.kgBasGun);
      t('stok tam → eksik yok', !o.eksikVar && o.kalemler.every((k) => k.stockId));
      t('padok toplamı = kg/baş × baş', Math.abs(o.toplamGunlukKg - o.gunlukKgBas * 10) < 0.1);
      const e = rasyonOnerisi({ parti: 'Padok C', bas: 10, ortKg: 35, yemler: [{ id: 'arpa', name: 'Arpa' }] });
      t('kaba yem stokta yoksa eksik işaretli kalem', e.eksikVar && e.kalemler.some((k) => k.eksik && k.stockId === null && k.sinif === 'kaba'));
      const b = rasyonOnerisi({ parti: 'X', bas: 3, ortKg: null, yemler });
      t('tartım yoksa varsayılan kg', !b.tartimli && b.ortKg === VARSAYILAN_KG);
      const m = rasyonOnerisi({ parti: 'X', bas: 3, ortKg: 60, faz: 'maintenance', yemler });
      t('dönem değişince miktar değişir (bakım < besi)', m.faz === 'maintenance' && m.gunlukKgBas < rasyonOnerisi({ parti: 'X', bas: 3, ortKg: 60, yemler }).gunlukKgBas);
    }
    return out;
  },
};
