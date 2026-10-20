import { test, type TestModul, type TestSonuc } from '../cerceve';
import {
  adimaYuvarla,
  ayriAyarMetni,
  igneUcuAdedi,
  igneUcuKurali,
  igneUcuStokMu,
  igneUcuToplam,
  tabancaAdimi,
  tabancaAyariHesapla,
  tabancaDozTipi,
  tabancaStokMu,
} from '@/kaynak/akilli-veteriner/asi-tabancasi';
import { EKIPMAN_KATALOGU, STOK_KATALOGU } from '@/kaynak/stok/katalog';
import { FIYAT_EKSIK, FIYAT_REFERANS } from '@/kaynak/maliyet/fiyat-referans';
import { STOCK_TYPE_LABELS, STOCK_TYPE_ORDER } from '@/kaynak/cekirdek/tipler';
import { geriOkumaMetni, onayCumlesi } from '@/kaynak/ses/geri-okuma';
import type { GrupAsiKomutu } from '@/kaynak/ses/tipler';

const G = 'Aşı tabancası';
const kuzular = (kgs: (number | null)[]) => kgs.map((kg, i) => ({ id: `k${i}`, etiket: `TR-${i}`, kg }));

export const asiTabancasiModul: TestModul = {
  grup: G,
  calistir: () => {
    const r: TestSonuc[] = [];

    const karma = tabancaAyariHesapla('karma', kuzular(Array(42).fill(20)), 2);
    r.push(test(G, 'karma 42 kuzu: 2 ml · şişede ~84 ml', karma.satir === "Tabancayı 2 ml'ye ayarla · 42 kuzu · şişede ~84 ml gerekir", karma.satir));
    const karma1 = tabancaAyariHesapla('karma', kuzular([20, 20]), 1);
    r.push(test(G, '1 ml tabancada 2 ml doz: 2 kez bas', karma1.uygun && karma1.ayarMl === 1 && karma1.basis === 2 && karma1.satir.includes('2 kez bas'), karma1.satir));
    const rapel = tabancaDozTipi('karma-rapel');
    r.push(test(G, 'karma rapel ana programın dozunu alır', rapel.tur === 'sabit' && rapel.ml === 2));
    const selen = tabancaDozTipi('selen-e');
    r.push(test(G, 'Selenyum-E katalog dozu (1 ml)', selen.tur === 'sabit' && selen.ml === 1));

    const iv = tabancaAyariHesapla('ivermektin', kuzular([20, 20, 20, 20, 40]), 1);
    r.push(test(G, 'ivermektin: ort. 24 kg → 0,5 ml (0,1 adım)', iv.uygun && iv.kiloyaGore && iv.ortKg === 24 && iv.ayarMl === 0.5, JSON.stringify(iv.uygun && { o: iv.ortKg, a: iv.ayarMl })));
    r.push(test(G, '40 kg kuzu ayrı ayarlanır (0,8 ml)', iv.uygun && iv.ayri.length === 1 && iv.ayri[0].ml === 0.8 && iv.ayri[0].etiket === 'TR-4'));
    r.push(test(G, 'ayrı ayarla metni', iv.uygun && ayriAyarMetni(iv) === 'Bu kuzuları ayrı ayarla: TR-4 (0,8 ml)', iv.uygun ? ayriAyarMetni(iv) ?? '' : ''));
    r.push(test(G, 'bir adım fark ayrı listeye düşmez', iv.uygun && !iv.ayri.some((k) => k.kg === 20)));
    r.push(test(G, 'şişe toplamı ayrı kuzuyu kendi dozuyla sayar', iv.uygun && iv.toplamMl === 2.8, String(iv.uygun && iv.toplamMl)));

    const kiloYok = tabancaAyariHesapla('doramektin', kuzular([null, 30]), 2);
    r.push(test(G, 'kilosu olmayan kuzu ~20 kg sayılır ve işaretlenir', kiloYok.uygun && kiloYok.kiloYok.length === 1 && kiloYok.kiloYok[0].etiket === 'TR-0'));
    r.push(test(G, 'ortalama tartılı kuzulardan', kiloYok.uygun && kiloYok.ortKg === 30 && kiloYok.ayarMl === 0.6, JSON.stringify(kiloYok.uygun && { o: kiloYok.ortKg, a: kiloYok.ayarMl })));
    const hicKilo = tabancaAyariHesapla('ivermektin', kuzular([null, null]), 2);
    r.push(test(G, 'hiç tartım yoksa 20 kg → 0,4 ml', hicKilo.uygun && hicKilo.ortKg === 20 && hicKilo.ayarMl === 0.4));

    const alb = tabancaAyariHesapla('albendazol', kuzular([20]), 2);
    r.push(test(G, 'hap/ağızdan kalemde tabanca yok', !alb.uygun && alb.satir.includes('ağızdan')));

    r.push(test(G, 'adım: 1→0,1 · 2→0,2 · 5→0,5', tabancaAdimi(1) === 0.1 && tabancaAdimi(2) === 0.2 && tabancaAdimi(5) === 0.5));
    r.push(test(G, 'adıma yuvarlama', adimaYuvarla(0.48, 0.1) === 0.5 && adimaYuvarla(0.05, 0.2) === 0.2 && adimaYuvarla(2.6, 0.5) === 2.5));

    r.push(test(G, 'iğne ucu: her 20 kuzuda bir, en az 1', igneUcuAdedi(42) === 3 && igneUcuAdedi(20) === 1 && igneUcuAdedi(5) === 1 && igneUcuAdedi(0) === 0));
    r.push(test(G, 'iğne ucu: her aşı türünde yeni uç', igneUcuToplam([42, 42]) === 6 && igneUcuToplam([5, 5, 5]) === 3));
    r.push(test(G, 'kural metinde yazar', igneUcuKurali().includes('20 kuzu') && igneUcuKurali().includes('aşı türünde')));

    r.push(test(G, 'stok adı tanıma', tabancaStokMu('Otomatik aşı tabancası') && !tabancaStokMu('Tabanca iğne ucu') && igneUcuStokMu('Tabanca iğne ucu') && !igneUcuStokMu('Karma aşı')));

    r.push(test(G, 'ekipman kategorisi (3 kalem, adet)', EKIPMAN_KATALOGU.length === 3 && EKIPMAN_KATALOGU.every((k) => k.type === 'equipment' && k.birim === 'adet')));
    r.push(test(G, 'katalogda tabanca + iğne ucu', ['asi-tabancasi', 'tabanca-igne-ucu'].every((id) => STOK_KATALOGU.some((k) => k.id === id))));
    r.push(test(G, 'Ekipman etiketi ve filtre sırası', STOCK_TYPE_LABELS.equipment === 'Ekipman' && STOCK_TYPE_ORDER.includes('equipment')));
    r.push(test(G, 'ekipman fiyatı uydurulmaz (null, fiyat eksik listesinde)',
      ['asi-tabancasi', 'tabanca-igne-ucu', 'siringa'].every((id) => FIYAT_REFERANS.find((x) => x.id === id)?.fiyat === null && FIYAT_EKSIK.some((x) => x.id === id))));

    const e: GrupAsiKomutu = { tur: 'grup_asi', grup: { tur: 'padok', ad: 'Padok C' }, asiAdi: 'karma aşı', programId: 'karma', programTur: 'asi', hayvanSayisi: 42, tabancaMl: 2 };
    r.push(test(G, 'sesli onay tabanca ayarını söyler', onayCumlesi(e).startsWith('Tabanca 2 ml, ') && onayCumlesi(e).includes('Onaylıyor musunuz?'), onayCumlesi(e)));
    r.push(test(G, 'geri okuma metni tabanca içerir', geriOkumaMetni(e).includes('Tabanca 2 ml') && geriOkumaMetni(e).includes('42 kuzu')));
    const { tabancaMl: _t, ...tabancasiz } = e;
    r.push(test(G, 'tabancasız komut eskisi gibi', !onayCumlesi(tabancasiz).includes('Tabanca')));
    return r;
  },
};
