import type { VetSuggestion } from '@/kaynak/cekirdek/tipler';
import { fotografAnalizi, type FotoTur } from './fotograf';
import {
  baglamMetniOlustur,
  netlestirmeSorulari,
  type VetAnalizSonuc,
  type VetCevaplar,
} from './netlestirme';
import { eksikFotoIstekleri, zorunluFotoEksik } from './foto-istek';
import type { VakaFotografi } from './fotograf';
import { olusturTeshis } from './teshis';

export type { VetAnalizSonuc, VetCevaplar, VetSoru, VetSoruSecenek } from './netlestirme';
export { baglamMetniOlustur, netlestirmeSorulari, tespitTema } from './netlestirme';

const RULES: { keywords: string[]; suggestion: Omit<VetSuggestion, 'fotoGozlemleri'> & { tedaviOnerileri: string[] } }[] = [
  {
    keywords: ['ishal', 'sulu dışkı', 'loose stool'],
    suggestion: {
      conditions: ['Parazitoz', 'Bakteriyel enterit', 'Beslenme değişikliği'],
      advice: 'Sürüyü ayırın, temiz su verin. Dışkı rengi ve süresini kaydedin. 24 saat içinde düzelmezse veteriner çağırın.',
      tedaviOnerileri: [
        'Bol temiz su — kesif yem geçici azaltın',
        'Elektrolit (vet önerisiyle) düşünün',
        'Dışkı numunesi alın (vet için)',
      ],
      urgency: 'medium',
      seeVet: true,
    },
  },
  {
    keywords: ['öksürük', 'nefes', 'solunum', 'cough'],
    suggestion: {
      conditions: ['Pastörellosis', 'Paraziter akciğer', 'Toz/alergi'],
      advice: 'Hasta hayvanları ayırın, havalandırmayı artırın. Solunum hızı ve ateş varsa acil veteriner.',
      tedaviOnerileri: [
        'Hasta hayvanları ayırın',
        'Ahır havalandırmasını artırın',
        'Solunum hızını saatte bir sayın',
      ],
      urgency: 'high',
      seeVet: true,
    },
  },
  {
    keywords: ['topallama', 'aksama', 'ayak', 'lame'],
    suggestion: {
      conditions: ['Pododermatit (yay)', 'Travma', 'Eklem enfeksiyonu'],
      advice: 'Ayağı kontrol edin, ılık su banyosu yapın. Topallık 2 günden uzun sürerse veteriner muayenesi gerekir.',
      tedaviOnerileri: [
        'Ayak banyosu (ılık su)',
        'Taşlı/zemin sert alandan uzak tutun',
        'Fotoğraf ile yara/yay durumunu kaydedin',
      ],
      urgency: 'medium',
      seeVet: true,
    },
  },
  {
    keywords: ['düşük', 'abort', 'kuzu ölü', 'gebe'],
    suggestion: {
      conditions: ['Enfeksiyöz abort', 'Beslenme yetersizliği', 'Stres'],
      advice: 'Düşük yapan hayvanı ayırın, numune alınması için veterineri arayın. Sürü aşı programını gözden geçirin.',
      tedaviOnerileri: ['Hayvanı ayırın', 'Veteriner numune alımı', 'Sürü aşı takvimini kontrol edin'],
      urgency: 'high',
      seeVet: true,
    },
  },
  {
    keywords: ['iştahsız', 'yem yemiyor', 'zayıf', 'kilo kaybı'],
    suggestion: {
      conditions: ['Parazit yükü', 'Diş/ağız problemi', 'Kronik hastalık'],
      advice: 'Son tartımı kontrol edin, parazit programını değerlendirin. Hızlı kilo kaybında veteriner muayenesi şart.',
      tedaviOnerileri: [
        'Son tartımı kaydedin',
        'Parazit programını gözden geçirin',
        'Yem kalitesi ve su erişimini kontrol edin',
      ],
      urgency: 'medium',
      seeVet: true,
    },
  },
  {
    keywords: ['burun akıntı', 'göz akıntı', 'ateş'],
    suggestion: {
      conditions: ['Solunum yolu enfeksiyonu', 'Bulaşıcı ekthima (Orf)'],
      advice: 'Hasta hayvanları izole edin. Ateş ve iştahsızlık birlikteyse acil veteriner müdahalesi gerekir.',
      tedaviOnerileri: ['İzolasyon', 'Ateş takibi', 'Veteriner muayenesi'],
      urgency: 'high',
      seeVet: true,
    },
  },
  {
    keywords: ['kuzu', 'süt', 'emmeme'],
    suggestion: {
      conditions: ['Kolostrum yetersizliği', 'Navel enfeksiyonu', 'Zayıf kuzu'],
      advice: 'Kuzuya 2 saat içinde kolostrum verin (250 ml). Emmezse biberon veya veteriner desteği alın.',
      tedaviOnerileri: [
        '2 saat içinde kolostrum (250 ml)',
        'Göbek bölgesini kontrol edin (enfeksiyon?)',
        'Zayıf kuzuyu ayırıp ısıtın',
      ],
      urgency: 'high',
      seeVet: true,
    },
  },
];

const URGENCY_RANK: Record<VetSuggestion['urgency'], number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function bosSonuc(mesaj: string): VetSuggestion {
  return {
    conditions: [],
    advice: mesaj,
    tedaviOnerileri: [],
    fotoGozlemleri: [],
    urgency: 'low',
    seeVet: false,
  };
}

function birlestirUrgency(a: VetSuggestion['urgency'], b: VetSuggestion['urgency']): VetSuggestion['urgency'] {
  return URGENCY_RANK[a] >= URGENCY_RANK[b] ? a : b;
}

function benzersiz(list: string[]): string[] {
  return [...new Set(list.filter(Boolean))];
}

/** Semptom metni analizi */
export function analyzeSymptoms(input: string): VetSuggestion {
  const normalized = input.toLowerCase().trim();
  if (!normalized) {
    return bosSonuc('Lütfen gözlemlediğiniz belirtileri yazın (ör: ishal, topallama, iştahsızlık).');
  }

  for (const rule of RULES) {
    if (rule.keywords.some((k) => normalized.includes(k))) {
      return { ...rule.suggestion, fotoGozlemleri: [] };
    }
  }

  return {
    conditions: ['Belirsiz — daha fazla gözlem gerekli'],
    advice: 'Belirtileri 24 saat takip edin. Kilo kaybı, iştahsızlık veya sürüye yayılma varsa veteriner hekime danışın. Bu uygulama teşhis koymaz, yalnızca bilgilendirme sağlar.',
    tedaviOnerileri: ['Gözlem altında tutun', 'Su ve yem takibi', 'Fotoğraf ekleyerek tekrar analiz edin'],
    fotoGozlemleri: [],
    urgency: 'low',
    seeVet: normalized.length > 20,
  };
}

/** Cevaplara göre aciliyet ve öneriyi netleştir */
function cevaplaIyilestir(oneri: VetSuggestion, cevaplar: VetCevaplar): VetSuggestion {
  let { urgency, seeVet, tedaviOnerileri, advice, conditions } = oneri;
  const ekle = (t: string) => {
    if (!tedaviOnerileri.includes(t)) tedaviOnerileri = [...tedaviOnerileri, t];
  };

  if (cevaplar['ishal-kan'] === 'evet') {
    urgency = 'high';
    seeVet = true;
    ekle('Kanlı ishal — acil veteriner çağırın');
    advice = 'Kanlı veya siyah dışkı ciddi tablo olabilir. Hayvanı ayırın, su verin, veterineri hemen arayın.';
  }
  if (cevaplar['ishal-sure'] === '3gun+') {
    urgency = birlestirUrgency(urgency, 'high');
    seeVet = true;
    ekle('3 günden uzun ishal — dışkı numunesi için vet');
  }
  if (cevaplar['ishal-yayilim'] === 'suru') {
    urgency = 'high';
    seeVet = true;
    conditions = benzersiz([...conditions, 'Sürü salgını şüphesi']);
    advice = 'Sürü genelinde ishal bulaşıcı olabilir. Veterineri bilgilendirin, hasta hayvanları ayırın.';
  }

  if (cevaplar['topallama-sure'] === '2gun+') {
    seeVet = true;
    urgency = birlestirUrgency(urgency, 'medium');
    ekle('2 günden uzun topallık — ayak muayenesi için vet');
  }
  if (cevaplar['topallama-sis'] === 'evet') {
    urgency = birlestirUrgency(urgency, 'medium');
    ekle('Şiş/yara var — ayak fotoğrafı veterinere gönderin');
  }

  if (cevaplar['kuzu-yas'] === '24saat' && cevaplar['kuzu-emme'] === 'hic') {
    urgency = 'high';
    seeVet = true;
    advice = 'Yeni doğan kuzu emmiyorsa kolostrum acil. 2 saat içinde 250 ml kolostrum veya veteriner.';
    ekle('2 saat içinde kolostrum (250 ml) — emmezse vet');
  }
  if (cevaplar['kuzu-gobek'] === 'koku' || cevaplar['kuzu-gobek'] === 'sis') {
    urgency = 'high';
    seeVet = true;
    conditions = benzersiz([...conditions, 'Göbek enfeksiyonu (omphalitis)']);
    ekle('Göbek bölgesini temiz tutun, veteriner antibiyotik değerlendirmesi');
  }

  if (cevaplar['solunum-nefes'] === 'hizli' || cevaplar['solunum-ates'] === 'evet') {
    urgency = 'high';
    seeVet = true;
    ekle('Solunum sıkıntısı — acil veteriner');
  }

  if (cevaplar['istah-sure'] === '3gun+' || cevaplar['istah-kilo'] === 'evet') {
    seeVet = true;
    urgency = birlestirUrgency(urgency, 'medium');
    ekle('Uzun süreli iştahsızlık — muayene gerekir');
  }

  if (cevaplar['genel-sikayet']) {
    const etiket: Record<string, string> = {
      yem: 'iştahsızlık',
      topallama: 'topallama',
      diski: 'ishal',
      solunum: 'solunum sorunu',
      halsiz: 'halsizlik',
    };
    const ek = etiket[cevaplar['genel-sikayet']];
    if (ek && !conditions.some((c) => c.toLowerCase().includes(ek.slice(0, 4)))) {
      conditions = benzersiz([...conditions, `Bildirilen: ${ek}`]);
    }
  }

  return { ...oneri, urgency, seeVet, tedaviOnerileri, advice, conditions };
}

/** Semptom + fotoğraf türleri birleşik Akıllı Veteriner analizi */
export function analyzeVaka(input: {
  symptoms: string;
  fotoTurleri?: FotoTur[];
  cevaplar?: VetCevaplar;
}): VetSuggestion {
  const baglam = input.cevaplar
    ? baglamMetniOlustur(input.symptoms, input.cevaplar)
    : input.symptoms;
  const semptom = analyzeSymptoms(baglam);
  const turler = input.fotoTurleri ?? [];

  if (turler.length === 0) {
    return input.cevaplar ? cevaplaIyilestir(semptom, input.cevaplar) : semptom;
  }

  let urgency = semptom.urgency;
  let seeVet = semptom.seeVet;
  const conditions = [...semptom.conditions];
  const tedaviOnerileri = [...semptom.tedaviOnerileri];
  const fotoGozlemleri: string[] = [];

  for (const tur of turler) {
    const fa = fotografAnalizi(tur);
    fotoGozlemleri.push(...fa.fotoGozlemleri);
    conditions.push(...(fa.conditions ?? []));
    tedaviOnerileri.push(...fa.tedaviOnerileri);
    urgency = birlestirUrgency(urgency, fa.urgency ?? 'low');
    if (fa.urgency === 'high') seeVet = true;
  }

  if (turler.length > 0 && semptom.conditions.length === 0) {
    seeVet = true;
  }

  const advice =
    turler.length > 0
      ? `${semptom.advice} Fotoğraf gözlemleri analize eklendi — kesin teşhis için veteriner muayenesi gerekir.`
      : semptom.advice;

  const temel: VetSuggestion = {
    conditions: benzersiz(conditions),
    advice,
    tedaviOnerileri: benzersiz(tedaviOnerileri),
    fotoGozlemleri: benzersiz(fotoGozlemleri),
    urgency,
    seeVet: seeVet || urgency !== 'low',
  };

  return input.cevaplar ? cevaplaIyilestir(temel, input.cevaplar) : temel;
}

/**
 * Tam akış: bilgi yetersizse netleştirme soruları,
 * cevaplar tamamlanınca tedavi önerisi.
 */
export function analyzeVakaTam(input: {
  symptoms: string;
  fotoTurleri?: FotoTur[];
  fotograflar?: VakaFotografi[];
  cevaplar?: VetCevaplar;
}): VetAnalizSonuc {
  const cevaplar = input.cevaplar ?? {};
  const baglamMetni = baglamMetniOlustur(input.symptoms, cevaplar);
  const fotograflar = input.fotograflar ?? [];
  const sorular = netlestirmeSorulari({
    symptoms: input.symptoms,
    fotoTurleri: input.fotoTurleri ?? fotograflar.map((f) => f.tur),
    cevaplar,
  });

  if (sorular.length > 0) {
    return {
      oneri: null,
      teshis: null,
      sorular,
      fotoIstekleri: [],
      netlestirmeGerekli: true,
      fotoBekleniyor: false,
      hazir: false,
      baglamMetni,
    };
  }

  const fotoIstekleri = eksikFotoIstekleri({
    symptoms: input.symptoms,
    fotograflar,
    cevaplar,
  });

  if (fotoIstekleri.length > 0 && zorunluFotoEksik(fotoIstekleri)) {
    return {
      oneri: null,
      teshis: null,
      sorular: [],
      fotoIstekleri,
      netlestirmeGerekli: false,
      fotoBekleniyor: true,
      hazir: false,
      baglamMetni,
    };
  }

  const oneri = analyzeVaka({
    symptoms: input.symptoms,
    fotoTurleri: input.fotoTurleri ?? fotograflar.map((f) => f.tur),
    cevaplar,
  });

  const teshis = olusturTeshis({ symptoms: input.symptoms, cevaplar, oneri });

  return {
    oneri,
    teshis,
    sorular: [],
    fotoIstekleri: fotoIstekleri.filter((i) => i.zorunlu),
    netlestirmeGerekli: false,
    fotoBekleniyor: fotoIstekleri.some((i) => i.zorunlu),
    hazir: true,
    baglamMetni,
  };
}

export const VET_DISCLAIMER =
  'Bu bilgiler yalnızca genel bilgilendirme amaçlıdır; teşhis ve tedavi yerine geçmez. Acil durumlarda mutlaka lisanslı bir veteriner hekime başvurun.';
