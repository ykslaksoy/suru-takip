import {
  alisBasTutarHesap,
  kalemToplamTutar,
  varsayilanKalemlerBos,
  type BesiEkonomiKalem,
} from '@/kaynak/maliyet/besi-ekonomi-kalem';
import { gercekCiftSayimAnahtarlari, partiMaliyettenOzet } from '@/kaynak/maliyet/besi-ekonomi-gercek';
import type { PartiMaliyet } from '@/kaynak/maliyet/hesap';
import { hesaplaBesiEkonomiSenaryo } from '@/kaynak/maliyet/besi-ekonomi-senaryo';
import { test, type TestModul } from '../cerceve';

const parti: PartiMaliyet = {
  parti: 'Padok A',
  bas: 10,
  alis: 30000,
  alisEksikBas: 0,
  alisTahminiBas: 0,
  yem: 15000,
  ilac: 2000,
  sigorta: 0,
  toplam: 47000,
  basBasi: 4700,
  toplamKg: 400,
  kgBasi: 117.5,
  tahminiSatis: null,
  tahminiKar: null,
  gercekSatis: null,
  gercekKar: null,
};

function kalem(kod: BesiEkonomiKalem['kod'], tutar: number, odeme: BesiEkonomiKalem['odeme']): BesiEkonomiKalem {
  const s = varsayilanKalemlerBos().find((x) => x.kod === kod)!;
  return { ...s, degerDurumu: 'tutar', birimTutar: tutar, odeme, alisBaz: kod === 'alis' ? 'basina' : s.alisBaz };
}

export const besiEkonomiModul: TestModul = {
  grup: 'Besi ekonomi kalemleri',
  calistir() {
    const g = 'Besi ekonomi kalemleri';
    const ctx = { basSayisi: 10, toplamGun: 60, girisCanliKg: 30 };

    const alisKg = alisBasTutarHesap(
      { ...kalem('alis', 50, 'tek'), alisBaz: 'canli_kg', girisCanliKg: 30 },
      ctx,
    );
    const alisLot = alisBasTutarHesap({ ...kalem('alis', 28000, 'tek'), alisBaz: 'parti_toplam' }, ctx);
    const ozet = partiMaliyettenOzet(parti);
    const cift = gercekCiftSayimAnahtarlari(ozet);
    const yemK = kalem('yem', 5, 'gunluk_bas');
    const atlanan = kalemToplamTutar(yemK, ctx, { haricCiftSayim: cift });

    const kalemler = [
      { ...kalem('alis', 3000, 'tek'), alisBaz: 'basina' as const },
      kalem('kira', 10000, 'aylik_adim'),
      kalem('coban', 20000, 'aylik_adim'),
      yemK,
    ];

    const senaryo = hesaplaBesiEkonomiSenaryo({
      basSayisi: 10,
      toplamGun: 60,
      girisCanliKg: 30,
      satisGelirBas: 4500,
      kalemler,
      planDegiskenToplam: 5000,
      gercekParti: ozet,
      donguArasiBosGun: null,
    });

    return [
      test(g, 'Alış ₺/kg canlı', alisKg.tutar === 15000),
      test(g, 'Alış parti toplam', alisLot.tutar === 28000),
      test(g, 'Gerçek stok çift sayım anahtarı', cift.has('parti_yem_stok')),
      test(g, 'Yem projeksiyon atlandı', atlanan.atlandi),
      test(g, 'Senaryo kısmi veya hazir', senaryo.durum === 'kismi' || senaryo.durum === 'hazir'),
      test(g, 'Kira 60g min 3 ay', kalemToplamTutar({ ...kalem('kira', 10000, 'aylik_adim'), minSozlesmeAy: 3 }, ctx).tutar === 30000),
      test(
        g,
        'Bilinmiyor eksik',
        kalemToplamTutar({ ...kalem('diger', 0, 'tek'), degerDurumu: 'bilinmiyor' }, ctx).eksik.length > 0,
      ),
      test(g, 'Sıfır explicit', kalemToplamTutar({ ...kalem('nakliye', 0, 'tek'), degerDurumu: 'sifir' }, ctx).tutar === 0),
    ];
  },
};
