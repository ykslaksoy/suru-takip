import type { VetCevaplar } from './netlestirme';
import { tespitTema, type VetTema } from './netlestirme';
import type { VetSuggestion } from '@/kaynak/cekirdek/tipler';
import { hastalikTamAd } from './doz-hesap';

export type HastalikDerece = 'baslangic' | 'ileri';

export type IlacDoz = {
  id: string;
  ilacAdi: string;
  tip: 'igne' | 'asi' | 'oral' | 'topikal';
  /** Sabit doz metni (oral/topikal) veya hesap sonrası dolar */
  doz: string;
  uygulama: string;
  siklik: string;
  not?: string;
  /** kg × mgPerKg → ml hesabı (iç hesap) */
  mgPerKg?: number;
  mlSabit?: number;
  iuPerKg?: number;
  /** Şişe konsantrasyonu — kg'den ml çevirmek için */
  urunMgMl?: number;
  urunIuMl?: number;
};

export type VetDanisma = 'zorunlu' | 'onerilen' | 'gerekmez';

export type SuruMudahale = 'yok' | 'ayni_padok' | 'tum_kuzular';

export type HastalikTeshis = {
  hastalikId: string;
  /** Türkçe ad (Tıbbi ad) — gösterim */
  hastalikAdi: string;
  hastalikAdiTr: string;
  tibbiAd: string;
  derece: HastalikDerece;
  dereceEtiket: string;
  bulasici: boolean;
  vetDanisma: VetDanisma;
  ilaclar: IlacDoz[];
  etkiSuresiGun: number;
  karantinaGerekli: boolean;
  suruMudahale: SuruMudahale;
  suruIlaclari: IlacDoz[];
  aciklama: string;
};

type Protokol = {
  id: string;
  adTr: string;
  tibbiAd: string;
  bulasici: boolean;
  vetDanisma: VetDanisma;
  etkiSuresiGun: number;
  karantina: boolean;
  suruMudahale: SuruMudahale;
  baslangic: IlacDoz[];
  ileri: IlacDoz[];
  suruBaslangic?: IlacDoz[];
  suruIleri?: IlacDoz[];
  aciklama: string;
};

const PROTOKOLLER: Record<VetTema, Protokol> = {
  ishal: {
    id: 'enterit',
    adTr: 'İshal',
    tibbiAd: 'Enterit',
    bulasici: true,
    vetDanisma: 'onerilen',
    etkiSuresiGun: 5,
    karantina: true,
    suruMudahale: 'ayni_padok',
    aciklama: 'Sulu dışkı ve bağırsak enfeksiyonu.',
    baslangic: [
      {
        id: 'e1',
        ilacAdi: 'Elektrolit solüsyonu',
        tip: 'oral',
        doz: '500 ml / gün',
        uygulama: 'Ağızdan',
        siklik: '2×1 gün',
        not: 'Kesif yem azaltın',
      },
      {
        id: 'e2',
        ilacAdi: 'Sulfa grubu (vet reçetesi)',
        tip: 'igne',
        doz: '',
        mgPerKg: 15,
        urunMgMl: 400,
        uygulama: 'IM',
        siklik: '1×3 gün',
      },
    ],
    ileri: [
      {
        id: 'e3',
        ilacAdi: 'Florfenikol',
        tip: 'igne',
        doz: '',
        mgPerKg: 20,
        urunMgMl: 300,
        uygulama: 'IM',
        siklik: '1×3 gün',
      },
      {
        id: 'e4',
        ilacAdi: 'Elektrolit + B kompleks',
        tip: 'oral',
        doz: '500 ml + 5 ml / gün',
        uygulama: 'Ağızdan',
        siklik: '2×2 gün',
      },
    ],
    suruBaslangic: [
      {
        id: 'es1',
        ilacAdi: 'Profilaktik sulfa (vet önerisi)',
        tip: 'igne',
        doz: '',
        mgPerKg: 10,
        urunMgMl: 400,
        uygulama: 'SC',
        siklik: 'Tek doz',
      },
    ],
  },
  topallama: {
    id: 'pododermatit',
    adTr: 'Ayak yarası / topallık',
    tibbiAd: 'Pododermatit',
    bulasici: false,
    vetDanisma: 'gerekmez',
    etkiSuresiGun: 7,
    karantina: false,
    suruMudahale: 'yok',
    aciklama: 'Tırnak arası enfeksiyon (yay) veya ayak travması.',
    baslangic: [
      {
        id: 'p1',
        ilacAdi: 'Ayak banyosu (antiseptik)',
        tip: 'topikal',
        doz: '10 dk banyo',
        uygulama: 'Ayak banyosu',
        siklik: '1×2 gün',
      },
      {
        id: 'p2',
        ilacAdi: 'Oksitetrasiklin sprey',
        tip: 'topikal',
        doz: '2 püskürtme',
        uygulama: 'Yara üzerine',
        siklik: '1×5 gün',
      },
    ],
    ileri: [
      {
        id: 'p3',
        ilacAdi: 'Penisilin + streptomisin',
        tip: 'igne',
        doz: '',
        mgPerKg: 10,
        urunMgMl: 250,
        iuPerKg: 10000,
        urunIuMl: 300000,
        uygulama: 'IM',
        siklik: '1×5 gün',
      },
      {
        id: 'p4',
        ilacAdi: 'Meloksikam (ağrı kesici)',
        tip: 'igne',
        doz: '',
        mgPerKg: 0.5,
        urunMgMl: 5,
        uygulama: 'SC',
        siklik: '1×3 gün',
      },
    ],
  },
  kuzu: {
    id: 'kuzu-zayif',
    adTr: 'Zayıf kuzu / emmeme',
    tibbiAd: 'Neonatal yetmezlik · Omphalitis',
    bulasici: false,
    vetDanisma: 'onerilen',
    etkiSuresiGun: 3,
    karantina: false,
    suruMudahale: 'yok',
    aciklama: 'Kolostrum yetersizliği veya göbek enfeksiyonu şüphesi.',
    baslangic: [
      {
        id: 'k1',
        ilacAdi: 'Kolostrum',
        tip: 'oral',
        doz: '250 ml',
        uygulama: 'Biberon',
        siklik: '2 saat içinde',
      },
      {
        id: 'k2',
        ilacAdi: 'B vitamini',
        tip: 'igne',
        doz: '2 ml',
        mlSabit: 2,
        uygulama: 'SC',
        siklik: 'Tek doz',
      },
    ],
    ileri: [
      {
        id: 'k3',
        ilacAdi: 'Geniş spektrum antibiyotik',
        tip: 'igne',
        doz: 'Veteriner dozu',
        mgPerKg: 15,
        urunMgMl: 300,
        uygulama: 'IM',
        siklik: '1×5 gün',
        not: 'Göbek enfeksiyonu şüphesi',
      },
      {
        id: 'k4',
        ilacAdi: 'Glukoz + elektrolit',
        tip: 'oral',
        doz: '100 ml',
        uygulama: 'Ağızdan',
        siklik: '4×1 gün',
      },
    ],
  },
  solunum: {
    id: 'solunum-enf',
    adTr: 'Solunum enfeksiyonu',
    tibbiAd: 'Pasteurellosis · BRD',
    bulasici: true,
    vetDanisma: 'zorunlu',
    etkiSuresiGun: 7,
    karantina: true,
    suruMudahale: 'tum_kuzular',
    aciklama: 'Öksürük, burun/göz akıntısı, hızlı solunum.',
    baslangic: [
      {
        id: 's1',
        ilacAdi: 'Oksitetrasiklin LA',
        tip: 'igne',
        doz: '',
        mgPerKg: 20,
        urunMgMl: 200,
        uygulama: 'IM',
        siklik: '1×3 gün',
      },
    ],
    ileri: [
      {
        id: 's2',
        ilacAdi: 'Florfenikol',
        tip: 'igne',
        doz: '',
        mgPerKg: 20,
        urunMgMl: 300,
        uygulama: 'IM',
        siklik: '1×3 gün',
      },
      {
        id: 's3',
        ilacAdi: 'Meloksikam',
        tip: 'igne',
        doz: '',
        mgPerKg: 0.5,
        urunMgMl: 5,
        uygulama: 'SC',
        siklik: '1×3 gün',
      },
    ],
    suruBaslangic: [
      {
        id: 'ss1',
        ilacAdi: 'Pastörella aşısı',
        tip: 'asi',
        doz: '2 ml / hayvan',
        mlSabit: 2,
        uygulama: 'SC veya IM',
        siklik: 'Tek doz — vet programı',
      },
    ],
    suruIleri: [
      {
        id: 'ss2',
        ilacAdi: 'Sürü profilaktik antibiyotik',
        tip: 'igne',
        doz: 'Veteriner dozu',
        mgPerKg: 15,
        urunMgMl: 300,
        uygulama: 'IM',
        siklik: 'Vet talimatı',
      },
    ],
  },
  istahsiz: {
    id: 'istahsizlik',
    adTr: 'İştahsızlık',
    tibbiAd: 'Anoreksi · Parazitoz',
    bulasici: false,
    vetDanisma: 'onerilen',
    etkiSuresiGun: 5,
    karantina: false,
    suruMudahale: 'yok',
    aciklama: 'Yem yememe ve kilo kaybı.',
    baslangic: [
      {
        id: 'i1',
        ilacAdi: 'İvermektin (antiparaziter)',
        tip: 'igne',
        doz: '',
        mgPerKg: 0.2,
        urunMgMl: 10,
        uygulama: 'SC',
        siklik: 'Tek doz',
      },
    ],
    ileri: [
      {
        id: 'i2',
        ilacAdi: 'B kompleks + ivermektin',
        tip: 'igne',
        doz: '',
        mlSabit: 2,
        mgPerKg: 0.2,
        urunMgMl: 10,
        uygulama: 'SC',
        siklik: '1×2 gün',
      },
    ],
  },
  genel: {
    id: 'genel-halsiz',
    adTr: 'Genel halsizlik',
    tibbiAd: 'Sistemik hastalık (ayırıcı tanı gerekli)',
    bulasici: false,
    vetDanisma: 'onerilen',
    etkiSuresiGun: 3,
    karantina: false,
    suruMudahale: 'yok',
    aciklama: 'Belirgin teşhis için daha fazla bulgu gerekir.',
    baslangic: [
      {
        id: 'g1',
        ilacAdi: 'B vitamini (destek)',
        tip: 'igne',
        doz: '2 ml',
        mlSabit: 2,
        uygulama: 'SC',
        siklik: 'Tek doz',
      },
    ],
    ileri: [
      {
        id: 'g2',
        ilacAdi: 'Geniş spektrum antibiyotik',
        tip: 'igne',
        doz: 'Veteriner dozu',
        mgPerKg: 15,
        urunMgMl: 300,
        uygulama: 'IM',
        siklik: 'Vet talimatı',
      },
    ],
  },
};

function dereceBelirle(tema: VetTema, cevaplar: VetCevaplar, oneri: VetSuggestion): HastalikDerece {
  if (oneri.urgency === 'high') return 'ileri';

  if (tema === 'ishal') {
    if (cevaplar['ishal-kan'] === 'evet' || cevaplar['ishal-sure'] === '3gun+') return 'ileri';
    if (cevaplar['ishal-yayilim'] === 'suru') return 'ileri';
  }
  if (tema === 'topallama') {
    if (cevaplar['topallama-sure'] === '2gun+' || cevaplar['topallama-sis'] === 'evet') return 'ileri';
  }
  if (tema === 'kuzu') {
    if (cevaplar['kuzu-emme'] === 'hic' || cevaplar['kuzu-gobek'] === 'koku') return 'ileri';
  }
  if (tema === 'solunum') {
    if (cevaplar['solunum-nefes'] === 'hizli' || cevaplar['solunum-ates'] === 'evet') return 'ileri';
  }
  if (tema === 'istahsiz') {
    if (cevaplar['istah-sure'] === '3gun+' || cevaplar['istah-kilo'] === 'evet') return 'ileri';
  }

  return 'baslangic';
}

/** Semptom + cevaplardan teşhis, derece ve ilaç/doz planı */
export function olusturTeshis(input: {
  symptoms: string;
  cevaplar: VetCevaplar;
  oneri: VetSuggestion;
}): HastalikTeshis {
  const tema = tespitTema(input.symptoms.toLowerCase(), [], input.cevaplar);
  const proto = PROTOKOLLER[tema];
  const derece = dereceBelirle(tema, input.cevaplar, input.oneri);
  const ilaclar = derece === 'ileri' ? proto.ileri : proto.baslangic;
  const suruIlaclari =
    derece === 'ileri' ? (proto.suruIleri ?? proto.suruBaslangic ?? []) : (proto.suruBaslangic ?? []);

  let vetDanisma = proto.vetDanisma;
  if (derece === 'ileri' && vetDanisma === 'gerekmez') vetDanisma = 'onerilen';
  if (derece === 'ileri' && proto.bulasici) vetDanisma = 'zorunlu';

  return {
    hastalikId: proto.id,
    hastalikAdi: hastalikTamAd(proto.adTr, proto.tibbiAd),
    hastalikAdiTr: proto.adTr,
    tibbiAd: proto.tibbiAd,
    derece,
    dereceEtiket: derece === 'ileri' ? 'İleri derece' : 'Başlangıç',
    bulasici: proto.bulasici,
    vetDanisma,
    ilaclar,
    etkiSuresiGun: proto.etkiSuresiGun,
    karantinaGerekli: proto.karantina && (proto.bulasici || derece === 'ileri'),
    suruMudahale: proto.suruMudahale,
    suruIlaclari,
    aciklama: proto.aciklama,
  };
}

export function teshisOzeti(t: HastalikTeshis): string {
  return `${t.hastalikAdi} · ${t.dereceEtiket}${t.bulasici ? ' · Bulaşıcı' : ''}`;
}
