import type { VetSuggestion } from '@/kaynak/cekirdek/tipler';

const RULES: { keywords: string[]; suggestion: VetSuggestion }[] = [
  {
    keywords: ['ishal', 'sulu dışkı', 'loose stool'],
    suggestion: {
      conditions: ['Parazitoz', 'Bakteriyel enterit', 'Beslenme değişikliği'],
      advice: 'Sürüyü ayırın, temiz su verin. Dışkı rengi ve süresini kaydedin. 24 saat içinde düzelmezse veteriner çağırın.',
      urgency: 'medium',
      seeVet: true,
    },
  },
  {
    keywords: ['öksürük', 'nefes', 'solunum', 'cough'],
    suggestion: {
      conditions: ['Pastörellosis', 'Paraziter akciğer', 'Toz/alergi'],
      advice: 'Hasta hayvanları ayırın, havalandırmayı artırın. Solunum hızı ve ateş varsa acil veteriner.',
      urgency: 'high',
      seeVet: true,
    },
  },
  {
    keywords: ['topallama', 'aksama', 'ayak', 'lame'],
    suggestion: {
      conditions: ['Pododermatit (yay)', 'Travma', 'Eklem enfeksiyonu'],
      advice: 'Ayağı kontrol edin, ılık su banyosu yapın. Topallık 2 günden uzun sürerse veteriner muayenesi gerekir.',
      urgency: 'medium',
      seeVet: true,
    },
  },
  {
    keywords: ['düşük', 'abort', 'kuzu ölü', 'gebe'],
    suggestion: {
      conditions: ['Enfeksiyöz abort', 'Beslenme yetersizliği', 'Stres'],
      advice: 'Düşük yapan hayvanı ayırın, numune alınması için veterineri arayın. Sürü aşı programını gözden geçirin.',
      urgency: 'high',
      seeVet: true,
    },
  },
  {
    keywords: ['iştahsız', 'yem yemiyor', 'zayıf', 'kilo kaybı'],
    suggestion: {
      conditions: ['Parazit yükü', 'Diş/ağız problemi', 'Kronik hastalık'],
      advice: 'Son tartımı kontrol edin, parazit programını değerlendirin. Hızlı kilo kaybında veteriner muayenesi şart.',
      urgency: 'medium',
      seeVet: true,
    },
  },
  {
    keywords: ['burun akıntı', 'göz akıntı', 'ateş'],
    suggestion: {
      conditions: ['Solunum yolu enfeksiyonu', 'Contagious ecthyma'],
      advice: 'Hasta hayvanları izole edin. Ateş ve iştahsızlık birlikteyse acil veteriner müdahalesi gerekir.',
      urgency: 'high',
      seeVet: true,
    },
  },
  {
    keywords: ['kuzu', 'süt', 'emmeme'],
    suggestion: {
      conditions: ['Kolostrum yetersizliği', 'Navel enfeksiyonu', 'Zayıf kuzu'],
      advice: 'Kuzuya 2 saat içinde kolostrum verin (250 ml). Emmezse biberon veya veteriner desteği alın.',
      urgency: 'high',
      seeVet: true,
    },
  },
];

export function analyzeSymptoms(input: string): VetSuggestion {
  const normalized = input.toLowerCase().trim();
  if (!normalized) {
    return {
      conditions: [],
      advice: 'Lütfen gözlemlediğiniz belirtileri yazın (ör: ishal, topallama, iştahsızlık).',
      urgency: 'low',
      seeVet: false,
    };
  }

  for (const rule of RULES) {
    if (rule.keywords.some((k) => normalized.includes(k))) {
      return rule.suggestion;
    }
  }

  return {
    conditions: ['Belirsiz — daha fazla gözlem gerekli'],
    advice: 'Belirtileri 24 saat takip edin. Kilo kaybı, iştahsızlık veya sürüye yayılma varsa veteriner hekime danışın. Bu uygulama teşhis koymaz, yalnızca bilgilendirme sağlar.',
    urgency: 'low',
    seeVet: normalized.length > 20,
  };
}

export const VET_DISCLAIMER =
  'Bu bilgiler yalnızca genel bilgilendirme amaçlıdır; teşhis ve tedavi yerine geçmez. Acil durumlarda mutlaka lisanslı bir veteriner hekime başvurun.';
