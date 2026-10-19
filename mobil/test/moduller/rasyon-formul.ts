import { test, type TestModul, type TestSonuc } from '../cerceve';
import { simpleks } from '@/kaynak/rasyon/simpleks';
import { besinKontrol, enUcuzRasyon, gereksinim, HAZIR_RASYONLAR, hazirSec, karisimKg, malzemeOlustur } from '@/kaynak/rasyon/formul';
import { standartYem, STANDART_YEMLER } from '@/kaynak/rasyon/yem-besin';

const G = 'Rasyon formülasyonu';
const yak = (a: number, b: number, e = 1e-6) => Math.abs(a - b) < e;

export const rasyonFormulModul: TestModul = {
  grup: G,
  calistir() {
    const out: TestSonuc[] = [];
    const t = (ad: string, k: boolean, d?: string) => out.push(test(G, ad, k, d));
    // Simpleks
    const a = simpleks([-3, -5], [{ a: [1, 0], tip: '<=', b: 4 }, { a: [0, 2], tip: '<=', b: 12 }, { a: [3, 2], tip: '<=', b: 18 }]);
    t('simpleks: klasik maks problemi (x=2,y=6)', a.durum === 'optimal' && yak(a.x[0], 2) && yak(a.x[1], 6) && yak(a.deger, -36));
    const b = simpleks([2, 3], [{ a: [1, 1], tip: '>=', b: 10 }, { a: [1, 0], tip: '<=', b: 4 }]);
    t('simpleks: >= kısıtlı min (x=4,y=6)', b.durum === 'optimal' && yak(b.x[0], 4) && yak(b.x[1], 6));
    const c = simpleks([1, 1], [{ a: [1, 1], tip: '=', b: 5 }, { a: [1, -1], tip: '=', b: 1 }]);
    t('simpleks: eşitlikler', c.durum === 'optimal' && yak(c.x[0], 3) && yak(c.x[1], 2));
    t('simpleks: uygunsuz', simpleks([1], [{ a: [1], tip: '<=', b: 1 }, { a: [1], tip: '>=', b: 2 }]).durum === 'uygunsuz');
    t('simpleks: sınırsız', simpleks([-1], [{ a: [1], tip: '>=', b: 1 }]).durum === 'sinirsiz');
    t('simpleks: negatif b normalize', (() => { const r = simpleks([1], [{ a: [-1], tip: '<=', b: -3 }]); return r.durum === 'optimal' && yak(r.x[0], 3); })());
    // Yem tablosu
    t('tabloda 13 standart yem', STANDART_YEMLER.length === 13);
    t('ad eşleme: "Buğday samanı" ≠ Buğday', standartYem('Buğday samanı')?.ad === 'Buğday samanı' && standartYem('Arpa kırması')?.ad === 'Arpa' && standartYem('Yonca kuru ot')?.ad === 'Yonca kuru otu');
    // Formül
    const g = gereksinim(30, 'lamb_fattening');
    const fiy: Record<string, number> = { Arpa: 15, Mısır: 14, Buğday: 13, 'Buğday kepeği': 9, 'Ayçiçeği küspesi': 14, 'Soya küspesi': 25, 'Pamuk tohumu küspesi': 15, 'Yonca kuru otu': 13, 'Buğday samanı': 4.5, 'Mısır silajı': 3, 'Mermer tozu (kireçtaşı)': 3, Tuz: 5, 'Vitamin-mineral premiksi': 60 };
    const tum = STANDART_YEMLER.map((y) => malzemeOlustur(y.ad, fiy[y.ad]));
    const r = enUcuzRasyon(tum, g);
    t('tam malzemeyle tüm kısıtlar yeşil', r.uygun, JSON.stringify(r.kontrol));
    const km = r.kalemler.reduce((s, k) => s + k.kmKg, 0);
    t('kuru madde = gereksinim', Math.abs(km - g.kmKg) < 0.02);
    t('tuz/premiks sabit payda', r.kalemler.some((k) => k.ad === 'Tuz') && r.kalemler.some((k) => k.ad === 'Vitamin-mineral premiksi'));
    t('maliyet = Σ kg × ₺', yak(r.tlBasGun, r.kalemler.reduce((s, k) => s + k.tlBasGun, 0), 0.02) && r.tlBasGun > 0);
    // Daha pahalı yemi seçmez: arpa çok ucuzsa arpa artar
    const ucuz = enUcuzRasyon(tum.map((m) => (m.ad === 'Arpa' ? { ...m, fiyatKg: 5 } : m)), g);
    const arpa = (x: typeof r) => x.kalemler.find((k) => k.ad === 'Arpa')?.kgBasGun ?? 0;
    t('ucuzlayan yem rasyonda artar', arpa(ucuz) >= arpa(r) && ucuz.tlBasGun < r.tlBasGun);
    // Sadece saman → enerji/protein uyarısı
    const s = enUcuzRasyon([malzemeOlustur('Buğday samanı', 4)], g);
    t('sadece samanla uyarı ve kırmızı kontrol', !s.uygun && s.uyarilar.some((u) => u.includes('Enerji')) && s.uyarilar.some((u) => u.includes('Protein')) && s.kontrol.some((k) => !k.tamam));
    t('boş malzeme listesi', enUcuzRasyon([], g).uyarilar.length === 1);
    t('özel yem varsayılan besinle eklenir', malzemeOlustur('Bizim karışım', 10).me > 0);
    // Hazır
    t('ağırlığa göre hazır seçimi', hazirSec(20) === 'besi-baslangic' && hazirSec(30) === 'besi-buyutme' && hazirSec(40) === 'besi-bitirme');
    t('hazır rasyonlar %100', HAZIR_RASYONLAR.every((h) => Math.abs(h.karisim.reduce((s2, k) => s2 + k.yuzde, 0) - 100) < 0.01));
    const kk = karisimKg([{ ad: 'A', yuzde: 60 }, { ad: 'B', yuzde: 40 }], 1.5);
    t('karışım % → kg/baş', yak(kk[0].kgBasGun, 0.9) && yak(kk[1].kgBasGun, 0.6));
    const h = HAZIR_RASYONLAR.find((x) => x.id === 'besi-buyutme')!;
    const hk = besinKontrol(karisimKg(h.karisim, g.yemKg).map((k) => ({ m: malzemeOlustur(k.ad, 0), kg: k.kgBasGun })), g);
    t('hazır büyütme rasyonu kaba oranı ve KM uygun', hk.find((x) => x.ad === 'Kaba yem oranı')!.tamam && hk.find((x) => x.ad === 'Kuru madde')!.tamam, JSON.stringify(hk));
    return out;
  },
};
