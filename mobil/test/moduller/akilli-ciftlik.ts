import { test, type TestModul } from '../cerceve';
import { fiyatSinirla } from '@/kaynak/akilli-ciftlik/katalog';
import {
  GERCEK_DEPO_KORUNAN,
  ilerleGun,
  kuzuSatinAl,
  netKar,
  simulasyonDepoAnahtari,
  yeniOyun,
} from '@/kaynak/akilli-ciftlik/motor';
import { bakimAyarla } from '@/kaynak/akilli-ciftlik/motor';

const g = 'Akıllı Çiftlik sim';

export const akilliCiftlikModul: TestModul = {
  grup: g,
  calistir() {
    let o = yeniOyun({ baslangicButce: 250_000, tohum: 1 });
    const al = kuzuSatinAl(o, 20);
    const alSonrasiBas = al.durum.kuzuBas;
    o = al.durum;
    o = bakimAyarla(o, { kesifAniGecis: true, suVeTemizlikIy: false });
    const onceBas = o.kuzuBas;
    o = ilerleGun(o, 14);
    const fiyat = fiyatSinirla('kuzu_alis_kg', 1200);
    const izole = simulasyonDepoAnahtari();
    const korunan = GERCEK_DEPO_KORUNAN.every((k) => k !== izole);

    return [
      test(g, 'alım nakit düşer', o.nakit < 250_000),
      test(g, '20 baş', alSonrasiBas === 20),
      test(g, 'fiyat tavan', fiyat === 900),
      test(g, 'izole depo anahtarı', izole.startsWith('sy_akilli_ciftlik')),
      test(g, 'gerçek depo korunur', korunan),
      test(g, 'risk sonrası baş<=once', o.kuzuBas <= onceBas),
      test(g, 'iflas veya nakit', o.nakit > -500_000),
      test(g, 'net kar başta null', netKar(yeniOyun({ baslangicButce: 100_000 })) === null),
    ];
  },
};
