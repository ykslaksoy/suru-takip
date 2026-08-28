import type { FotoTur } from './fotograf';

export type VetSoruSecenek = { id: string; label: string };

export type VetSoru = {
  id: string;
  soru: string;
  secenekler: VetSoruSecenek[];
};

export type VetCevaplar = Record<string, string>;

export type VetAnalizSonuc = {
  oneri: import('@/kaynak/cekirdek/tipler').VetSuggestion | null;
  sorular: VetSoru[];
  fotoIstekleri: import('./foto-istek').FotoIstek[];
  netlestirmeGerekli: boolean;
  fotoBekleniyor: boolean;
  /** Sorular + zorunlu foto tamam — tedavi önerisi hazır */
  hazir: boolean;
  baglamMetni: string;
};

export type VetTema = 'ishal' | 'topallama' | 'kuzu' | 'solunum' | 'istahsiz' | 'genel';

type SoruSablon = VetSoru & {
  /** Metinde bu kelimeler varsa soru atlanır */
  atlaAnahtar?: string[];
};

const SORU_BANKASI: Record<VetTema, SoruSablon[]> = {
  ishal: [
    {
      id: 'ishal-sure',
      soru: 'İshal ne kadar süredir devam ediyor?',
      secenekler: [
        { id: 'bugun', label: 'Bugün / 1 günden az' },
        { id: '1-3gun', label: '1–3 gündür' },
        { id: '3gun+', label: '3 günden uzun' },
      ],
      atlaAnahtar: ['bugün', '1 gün', '2 gün', '3 gün', 'hafta', 'süredir'],
    },
    {
      id: 'ishal-kan',
      soru: 'Dışkıda kan veya siyah dışkı var mı?',
      secenekler: [
        { id: 'evet', label: 'Evet, kan veya siyah' },
        { id: 'hayir', label: 'Hayır, kan yok' },
        { id: 'emin-degil', label: 'Emin değilim' },
      ],
      atlaAnahtar: ['kan', 'siyah dışkı', 'kanlı'],
    },
    {
      id: 'ishal-yayilim',
      soru: 'Başka hayvanlarda da aynı durum var mı?',
      secenekler: [
        { id: 'tek', label: 'Sadece bu hayvan' },
        { id: 'birkac', label: 'Birkaç hayvan' },
        { id: 'suru', label: 'Sürü genelinde' },
      ],
      atlaAnahtar: ['sadece', 'birkaç', 'sürü', 'hepsi', 'yayıld'],
    },
  ],
  topallama: [
    {
      id: 'topallama-sure',
      soru: 'Topallık ne zamandan beri var?',
      secenekler: [
        { id: 'bugun', label: 'Bugün başladı' },
        { id: '1-2gun', label: '1–2 gündür' },
        { id: '2gun+', label: '2 günden uzun' },
      ],
      atlaAnahtar: ['bugün', 'dün', 'gündür', 'hafta'],
    },
    {
      id: 'topallama-ayak',
      soru: 'Hangi ayak topallıyor?',
      secenekler: [
        { id: 'on', label: 'Ön ayak' },
        { id: 'arka', label: 'Arka ayak' },
        { id: 'bilinmiyor', label: 'Emin değilim' },
      ],
      atlaAnahtar: ['ön ayak', 'arka ayak', 'sol', 'sağ'],
    },
    {
      id: 'topallama-sis',
      soru: 'Ayakta şişlik, ısı veya yara var mı?',
      secenekler: [
        { id: 'evet', label: 'Evet, şiş veya yara var' },
        { id: 'hayir', label: 'Hayır, dışarıdan normal' },
        { id: 'emin-degil', label: 'Bakmadım / emin değilim' },
      ],
      atlaAnahtar: ['şiş', 'yara', 'ısı', 'yay', 'kabuk'],
    },
  ],
  kuzu: [
    {
      id: 'kuzu-yas',
      soru: 'Kuzu kaç saat/gün?',
      secenekler: [
        { id: '24saat', label: '24 saatten küçük' },
        { id: '1-3gun', label: '1–3 günlük' },
        { id: 'buyuk', label: 'Daha büyük kuzu' },
      ],
      atlaAnahtar: ['saat', 'günlük', 'yeni doğ', 'doğum'],
    },
    {
      id: 'kuzu-gobek',
      soru: 'Göbek bölgesi nasıl?',
      secenekler: [
        { id: 'normal', label: 'Kuru, normal' },
        { id: 'sis', label: 'Şiş veya ıslak' },
        { id: 'koku', label: 'Kötü koku var' },
      ],
      atlaAnahtar: ['göbek', 'naval', 'koku'],
    },
    {
      id: 'kuzu-emme',
      soru: 'Anne sütü emiyor mu, yoksa hiç emmiyor mu?',
      secenekler: [
        { id: 'az', label: 'Az emiyor' },
        { id: 'hic', label: 'Hiç emmiyor' },
        { id: 'biberon', label: 'Sadece biberonla alıyor' },
      ],
      atlaAnahtar: ['emmiyor', 'emiyor', 'biberon', 'süt'],
    },
  ],
  solunum: [
    {
      id: 'solunum-nefes',
      soru: 'Nefes alış nasıl?',
      secenekler: [
        { id: 'hizli', label: 'Hızlı / zor nefes' },
        { id: 'oksuruk', label: 'Öksürük var' },
        { id: 'hafif', label: 'Hafif burun/göz akıntısı' },
      ],
      atlaAnahtar: ['nefes', 'öksür', 'akıntı'],
    },
    {
      id: 'solunum-ates',
      soru: 'Ateş veya iştahsızlık birlikte mi?',
      secenekler: [
        { id: 'evet', label: 'Evet, iştahsız / halsiz' },
        { id: 'hayir', label: 'Hayır, yem yiyor' },
        { id: 'bilinmiyor', label: 'Ölçmedim' },
      ],
      atlaAnahtar: ['ateş', 'iştahsız', 'halsiz'],
    },
  ],
  istahsiz: [
    {
      id: 'istah-sure',
      soru: 'Ne kadar süredir yem yemiyor?',
      secenekler: [
        { id: 'bugun', label: 'Bugün fark ettim' },
        { id: '1-2gun', label: '1–2 gündür' },
        { id: '3gun+', label: '3 günden uzun' },
      ],
      atlaAnahtar: ['bugün', 'gündür', 'hafta'],
    },
    {
      id: 'istah-kilo',
      soru: 'Belirgin kilo kaybı veya zayıflama var mı?',
      secenekler: [
        { id: 'evet', label: 'Evet, zayıfladı' },
        { id: 'hayir', label: 'Hayır, kilo aynı' },
        { id: 'bilinmiyor', label: 'Tartmadım' },
      ],
      atlaAnahtar: ['kilo', 'zayıf', 'zayıflad'],
    },
  ],
  genel: [
    {
      id: 'genel-sikayet',
      soru: 'En çok hangi belirti dikkatinizi çekti?',
      secenekler: [
        { id: 'yem', label: 'Yem yememe / iştahsızlık' },
        { id: 'topallama', label: 'Topallama / ayak' },
        { id: 'diski', label: 'Dışkı / ishal' },
        { id: 'solunum', label: 'Solunum / öksürük' },
        { id: 'halsiz', label: 'Genel halsizlik' },
      ],
    },
    {
      id: 'genel-yayilim',
      soru: 'Durum sadece bir hayvanda mı?',
      secenekler: [
        { id: 'tek', label: 'Evet, sadece bir hayvan' },
        { id: 'birkac', label: 'Birkaç hayvan' },
        { id: 'suru', label: 'Sürü genelinde' },
      ],
    },
  ],
};

const TEMA_ANAHTAR: { tema: VetTema; keywords: string[] }[] = [
  { tema: 'ishal', keywords: ['ishal', 'sulu dışkı', 'loose stool', 'dışkı'] },
  { tema: 'topallama', keywords: ['topallama', 'aksama', 'lame', 'ayak'] },
  { tema: 'kuzu', keywords: ['kuzu', 'emmeme', 'kolostrum', 'doğum'] },
  { tema: 'solunum', keywords: ['öksürük', 'nefes', 'solunum', 'cough', 'burun akıntı', 'göz akıntı'] },
  { tema: 'istahsiz', keywords: ['iştahsız', 'yem yemiyor', 'zayıf', 'kilo kaybı'] },
];

const FOTO_TEMA: Partial<Record<FotoTur, VetTema>> = {
  diski: 'ishal',
  ayak: 'topallama',
  agiz: 'kuzu',
  yara: 'genel',
  genel: 'genel',
};

function metindeVar(metin: string, anahtarlar?: string[]): boolean {
  if (!anahtarlar?.length) return false;
  return anahtarlar.some((k) => metin.includes(k));
}

const GENEL_CEVAP_TEMA: Record<string, VetTema> = {
  yem: 'istahsiz',
  topallama: 'topallama',
  diski: 'ishal',
  solunum: 'solunum',
  halsiz: 'genel',
};

/** Semptom + fotoğraftan ana tema */
export function tespitTema(
  symptoms: string,
  fotoTurleri: FotoTur[] = [],
  cevaplar: VetCevaplar = {}
): VetTema {
  const n = symptoms.toLowerCase().trim();
  for (const { tema, keywords } of TEMA_ANAHTAR) {
    if (keywords.some((k) => n.includes(k))) return tema;
  }
  for (const tur of fotoTurleri) {
    const t = FOTO_TEMA[tur];
    if (t) return t;
  }
  const genelCevap = cevaplar['genel-sikayet'];
  if (genelCevap && GENEL_CEVAP_TEMA[genelCevap]) {
    return GENEL_CEVAP_TEMA[genelCevap];
  }
  return 'genel';
}

function soruAtlanir(soru: SoruSablon, metin: string, cevaplar: VetCevaplar): boolean {
  if (cevaplar[soru.id]) return true;
  return metindeVar(metin, soru.atlaAnahtar);
}

/** Eksik bilgi için netleştirme soruları (en fazla 3) */
export function netlestirmeSorulari(input: {
  symptoms: string;
  fotoTurleri?: FotoTur[];
  cevaplar?: VetCevaplar;
}): VetSoru[] {
  const metin = input.symptoms.toLowerCase().trim();
  const cevaplar = input.cevaplar ?? {};
  const tema = tespitTema(metin, input.fotoTurleri, cevaplar);

  const banka = SORU_BANKASI[tema];
  const bekleyen = banka.filter((s) => !soruAtlanir(s, metin, cevaplar));

  if (metin.length < 8 && !input.fotoTurleri?.length && tema === 'genel') {
    return bekleyen.slice(0, 2);
  }

  return bekleyen.slice(0, 3);
}

/** Cevapları semptom metnine ekler — vet paketi ve analiz için */
export function baglamMetniOlustur(symptoms: string, cevaplar: VetCevaplar): string {
  const satirlar = [symptoms.trim()];
  const tema = tespitTema(symptoms.toLowerCase(), [], cevaplar);
  const tumSorular = [...SORU_BANKASI[tema], ...SORU_BANKASI.genel];

  for (const [soruId, secenekId] of Object.entries(cevaplar)) {
    const soru = tumSorular.find((s) => s.id === soruId);
    const secenek = soru?.secenekler.find((s) => s.id === secenekId);
    if (soru && secenek) {
      satirlar.push(`${soru.soru} → ${secenek.label}`);
    }
  }
  return satirlar.filter(Boolean).join('\n');
}

export function netlestirmeTamamlandi(input: {
  symptoms: string;
  fotoTurleri?: FotoTur[];
  cevaplar?: VetCevaplar;
}): boolean {
  return netlestirmeSorulari(input).length === 0;
}
