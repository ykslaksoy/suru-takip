import type { FotoTur, VakaFotografi } from './fotograf';
import type { VetCevaplar } from './netlestirme';
import { tespitTema, type VetTema } from './netlestirme';

export type FotoIstek = {
  id: string;
  tur: FotoTur;
  talimat: string;
  ornek: string;
  zorunlu: boolean;
};

const FOTO_ISTEK_BANKASI: Record<VetTema, FotoIstek[]> = {
  ishal: [
    {
      id: 'diski-yakin',
      tur: 'diski',
      talimat: 'Dışkıyı beyaz zemin üzerinde yakından çekin — renk ve kıvam görünsün.',
      ornek: 'Beyaz kağıt / tahta üzerinde',
      zorunlu: true,
    },
  ],
  topallama: [
    {
      id: 'ayak-alt',
      tur: 'ayak',
      talimat: 'Topallayan ayağın altından çekin — tırnak arası ve yay görünsün.',
      ornek: 'Hayvanı kaldırıp ayak tabanından',
      zorunlu: true,
    },
    {
      id: 'ayak-yan',
      tur: 'ayak',
      talimat: 'Aynı ayağın yan tarafından şişlik veya yara var mı gösterin.',
      ornek: 'Ayak bileğinden aşağısı',
      zorunlu: false,
    },
  ],
  kuzu: [
    {
      id: 'kuzu-genel',
      tur: 'genel',
      talimat: 'Kuzunun tüm vücudunu yan profilden çekin — postür ve kondisyon görünsün.',
      ornek: 'Ayakta veya yatarken yan açı',
      zorunlu: true,
    },
    {
      id: 'gobek',
      tur: 'agiz',
      talimat: 'Göbek (naval) bölgesini yakından çekin — şişlik veya akıntı var mı?',
      ornek: 'Göbek çevresi net görünsün',
      zorunlu: false,
    },
  ],
  solunum: [
    {
      id: 'solunum-genel',
      tur: 'genel',
      talimat: 'Hayvanın baş ve boyun bölgesini çekin — burun/göz akıntısı görünsün.',
      ornek: 'Burun ve göz hizası net',
      zorunlu: true,
    },
  ],
  istahsiz: [
    {
      id: 'kondisyon',
      tur: 'genel',
      talimat: 'Hayvanın yan profilini çekin — zayıflık / kondisyon kaybı değerlendirilsin.',
      ornek: 'Kaburga ve bel hattı görünsün',
      zorunlu: false,
    },
  ],
  genel: [
    {
      id: 'genel-durum',
      tur: 'genel',
      talimat: 'Hayvanın genel durumunu çekin — postür, halsizlik, ayakta mı yatıyor mu?',
      ornek: '2–3 metre mesafeden net',
      zorunlu: true,
    },
  ],
};

/** Cevaplara göre ek foto istekleri */
function cevapFotoIstekleri(tema: VetTema, cevaplar: VetCevaplar): FotoIstek[] {
  const ek: FotoIstek[] = [];
  if (tema === 'ishal' && cevaplar['ishal-kan'] === 'evet') {
    ek.push({
      id: 'diski-kan',
      tur: 'diski',
      talimat: 'Kanlı dışkıyı ayrı bir fotoğrafla net gösterin.',
      ornek: 'Kan lekesi yakın plan',
      zorunlu: true,
    });
  }
  if (tema === 'topallama' && cevaplar['topallama-sis'] === 'evet') {
    ek.push({
      id: 'ayak-sis',
      tur: 'yara',
      talimat: 'Şiş/yara bölgesini yakından çekin — kızarıklık ve akıntı görünsün.',
      ornek: 'Yara merkezi net odakta',
      zorunlu: true,
    });
  }
  if (tema === 'kuzu' && (cevaplar['kuzu-gobek'] === 'sis' || cevaplar['kuzu-gobek'] === 'koku')) {
    ek.push({
      id: 'gobek-sis',
      tur: 'agiz',
      talimat: 'Göbek enfeksiyonu şüphesi — göbek bölgesini yakın çekim.',
      ornek: 'Göbek ve çevresi',
      zorunlu: true,
    });
  }
  return ek;
}

function turKapsandi(istek: FotoIstek, fotograflar: VakaFotografi[], karsilananIdler: Set<string>): boolean {
  if (karsilananIdler.has(istek.id)) return true;
  return fotograflar.some((f) => f.tur === istek.tur);
}

/** Henüz eklenmemiş fotoğraf istekleri */
export function eksikFotoIstekleri(input: {
  symptoms: string;
  fotograflar: VakaFotografi[];
  cevaplar?: VetCevaplar;
  karsilananIstekler?: string[];
}): FotoIstek[] {
  const cevaplar = input.cevaplar ?? {};
  const tema = tespitTema(input.symptoms.toLowerCase(), input.fotograflar.map((f) => f.tur), cevaplar);
  const banka = [...(FOTO_ISTEK_BANKASI[tema] ?? []), ...cevapFotoIstekleri(tema, cevaplar)];
  const karsilanan = new Set(input.karsilananIstekler ?? []);

  const benzersiz = new Map<string, FotoIstek>();
  for (const i of banka) {
    if (!benzersiz.has(i.id)) benzersiz.set(i.id, i);
  }

  return [...benzersiz.values()].filter((i) => !turKapsandi(i, input.fotograflar, karsilanan));
}

export function zorunluFotoEksik(istekler: FotoIstek[]): boolean {
  return istekler.some((i) => i.zorunlu);
}
