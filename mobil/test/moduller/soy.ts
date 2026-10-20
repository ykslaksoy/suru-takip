import { test, type TestModul, type TestSonuc } from '../cerceve';
import {
  akrabalikHesaplayici,
  akrabaSeviyesi,
  bilinenAtaSayisi,
  ciftlesmeKontrol,
  ebeveynDogrula,
  iliskiAdi,
  soyAgaci,
  soyHaritasi,
  yavrular,
  yuzde,
  type SoyKaydi,
} from '@/kaynak/soy/hesap';

const G = 'Soy ağacı';
const k = (id: string, sex: 'male' | 'female', fatherId: string | null = null, motherId: string | null = null): SoyKaydi => ({ id, sex, fatherId, motherId });
const yakin = (a: number, b: number) => Math.abs(a - b) < 1e-9;

export const soyModul: TestModul = {
  grup: G,
  calistir() {
    const r: TestSonuc[] = [];
    const t = (ad: string, ok: boolean) => {
      r.push(test(G, ad, ok));
    };
    // Aile: K1×A1 → O1 (♂), O2 (♀), O3 (♀); K2×A1 → U1 (♀, üvey); K1×A2 → U2 (♀)
    // O1×X → T1 (♂); O2×K3 → T2 (♀) → T1 ve T2 kuzen
    const l = [
      k('K1', 'male'), k('K2', 'male'), k('K3', 'male'), k('A1', 'female'), k('A2', 'female'), k('X', 'female'),
      k('O1', 'male', 'K1', 'A1'), k('O2', 'female', 'K1', 'A1'), k('O3', 'female', 'K1', 'A1'),
      k('U1', 'female', 'K2', 'A1'), k('U2', 'female', 'K1', 'A2'),
      k('T1', 'male', 'O1', 'X'), k('T2', 'female', 'K3', 'O2'),
      k('I1', 'male', 'O1', 'O2'), // öz kardeş çiftleşmesinden
    ];
    const h = soyHaritasi(l);
    const c = akrabalikHesaplayici(h);
    t('akraba olmayan eşleşme: F = 0', c.yavruF('K3', 'X') === 0);
    t('öz kardeş eşleşmesi: F = %25', yakin(c.yavruF('O1', 'O2'), 0.25));
    t('ebeveyn × yavru: F = %25', yakin(c.yavruF('K1', 'O2'), 0.25));
    t('üvey kardeş: F = %12,5', yakin(c.yavruF('O1', 'U1'), 0.125) && yakin(c.yavruF('O1', 'U2'), 0.125));
    t('kuzen: F = %6,25', yakin(c.yavruF('T1', 'T2'), 0.0625));
    t('büyük ebeveyn × torun: F = %12,5', yakin(c.yavruF('K1', 'T2'), 0.125));
    t('kardeş evliliğinden doğanın kendi F değeri %25', yakin(c.kendilesme('I1'), 0.25));
    t('kardeş evliliğinden doğan × halası: F = %25', yakin(c.yavruF('I1', 'O3'), 0.25));
    t('akrabalık derecesi: öz kardeş r = 0,5', yakin(c.iliski('O2', 'O3'), 0.5));
    t('ilişki adı: öz kardeş / üvey / ebeveyn / kuzen', iliskiAdi(h, 'O1', 'O2') === 'öz kardeş' && iliskiAdi(h, 'O1', 'U1')?.startsWith('üvey') === true && iliskiAdi(h, 'K1', 'O2') === 'ebeveyn – yavru' && iliskiAdi(h, 'T1', 'T2') === 'kuzen');
    t('ilişki adı: büyük ebeveyn, amca–yeğen', iliskiAdi(h, 'K1', 'T2') === 'büyük ebeveyn – torun' && iliskiAdi(h, 'O1', 'T2') === 'amca/hala – yeğen');
    t('seviye eşikleri', akrabaSeviyesi(0.25) === 'yuksek' && akrabaSeviyesi(0.125) === 'yuksek' && akrabaSeviyesi(0.0625) === 'orta' && akrabaSeviyesi(0.01) === 'dusuk' && akrabaSeviyesi(0) === 'yok');
    const u = ciftlesmeKontrol(h, 'O1', 'O2');
    t('eşleşme uyarısı: yakın akraba ⛔ ve yüzde', u.seviye === 'yuksek' && u.mesaj.startsWith('⛔') && u.mesaj.includes('%25') && u.mesaj.includes('öz kardeş'));
    t('eşleşme uyarısı: kuzen ⚠️', ciftlesmeKontrol(h, 'T1', 'T2').mesaj.startsWith('⚠️'));
    t('eşleşme uyarısı: akraba yok ✅', ciftlesmeKontrol(h, 'K3', 'X').mesaj.startsWith('✅'));
    t('yüzde biçimi', yuzde(0.0625) === '%6,3' && yuzde(0.25) === '%25');
    const a = soyAgaci(h, 'T2', 3);
    t('3 nesil ağaç: ana, ananın babası', a.ana?.id === 'O2' && a.ana?.baba?.id === 'K1' && a.ana?.ana?.id === 'A1' && a.baba?.id === 'K3' && a.baba?.baba?.id === null);
    t('ağaç 3. nesilden derine inmez', a.ana?.ana?.ana == null);
    t('bilinen ata sayısı', bilinenAtaSayisi(a) === 4 && bilinenAtaSayisi(soyAgaci(h, 'K1', 3)) === 0);
    t('ebeveyn: kendisi olamaz', ebeveynDogrula(h, 'O1', 'baba', 'O1') !== null);
    t('ebeveyn: cinsiyet kontrolü', ebeveynDogrula(h, 'T2', 'ana', 'K1') === 'Ana dişi olmalı' && ebeveynDogrula(h, 'T2', 'baba', 'A1') === 'Baba erkek olmalı');
    t('ebeveyn: kendi torunu olamaz (döngü)', ebeveynDogrula(h, 'K1', 'ana', 'T2') !== null && ebeveynDogrula(h, 'K1', 'ana', 'X') === null);
    t('ebeveyn kaldırma her zaman geçerli', ebeveynDogrula(h, 'O1', 'ana', null) === null);
    t('yavrular (ana ya da baba olarak)', yavrular(h, 'K1').sort().join() === 'O1,O2,O3,U2' && yavrular(h, 'O2').sort().join() === 'I1,T2');
    // hatalı döngülü veri çökmez
    const bozuk = soyHaritasi([k('P', 'male', 'Q', null), k('Q', 'male', 'P', null), k('R', 'female')]);
    const cb = akrabalikHesaplayici(bozuk);
    t('döngülü hatalı kayıt çökertmez', Number.isFinite(cb.yavruF('P', 'R')) && Number.isFinite(cb.kendilesme('P')));
    t('kayıtta olmayan ebeveyn = bilinmiyor', akrabalikHesaplayici(soyHaritasi([k('Z', 'male', 'yok1', 'yok2')])).kendilesme('Z') === 0);
    // büyük sürü performansı
    const buyuk: SoyKaydi[] = [];
    for (let i = 0; i < 2000; i++) buyuk.push(k(`h${i}`, i % 2 ? 'male' : 'female', i >= 20 ? `h${(i % 10) * 2 + 1}` : null, i >= 20 ? `h${(i % 7) * 2}` : null));
    const t0 = Date.now();
    const cbu = akrabalikHesaplayici(soyHaritasi(buyuk));
    for (let i = 1500; i < 1600; i++) cbu.yavruF(`h${i + 1}`, `h${i}`);
    t('2000 hayvanda 100 eşleşme < 1 sn', Date.now() - t0 < 1000);
    return r;
  },
};
