/** Plan ırk etiketleri — resmi kaynak notu; ırka özel ADG yok. */

import type { BesiHedefIrkKodu } from './besi-plan-irk';

export type IrkPlanReferans = {
  aramaAlias?: string[];
  kaynak?: string;
  kaynakUrl?: string;
  beklemede?: boolean;
  beklemeNotu?: string;
};

export const IRK_PLAN_REFERANS: Record<BesiHedefIrkKodu, IrkPlanReferans> = {
  generic_kuzu: {},
  kivircik: { kaynak: 'TİGEM / ESK yerli ırk', kaynakUrl: 'https://www.tigem.gov.tr/Bilgi/Detay/Damizlik/Koyunculuk' },
  akkaraman: { kaynak: 'TİGEM / ESK yerli ırk', kaynakUrl: 'https://www.tigem.gov.tr/Bilgi/Detay/Damizlik/Koyunculuk' },
  ivesi: { kaynak: 'TİGEM / ESK yerli ırk', kaynakUrl: 'https://www.tigem.gov.tr/Bilgi/Detay/Damizlik/Koyunculuk' },
  merinos_capraz: {
    kaynak: 'Genel merinos melezi — Karacabey Merinosu ırkı değil',
    beklemeNotu: 'Hangi merinos hattı bilinmiyorsa Karacabey seçmeyin',
  },
  karacabey_merinos: {
    kaynak: 'ESK — Karacabey Merinosu (Kıvırcık × Alman et merinosu)',
    kaynakUrl: 'https://www.esk.gov.tr/tr/11111/Karacabey-Merinosu',
  },
  asaf: {
    aramaAlias: ['Assaf', 'ASF'],
    kaynak: 'ESK — Asaf (Ostfriesisch × İvesi)',
    kaynakUrl: 'https://www.esk.gov.tr/tr/11114/Asaf',
  },
  sakiz: { kaynak: 'TİGEM / ESK yerli ırk', kaynakUrl: 'https://www.tigem.gov.tr/Bilgi/Detay/Damizlik/Koyunculuk' },
  pirit_belirsiz: {
    beklemede: true,
    beklemeNotu:
      'Pırıt ≠ Pırlak — GEKA Denizli koyunculuk haritası ayrı genotip sayar; hangisi olduğunu netleştirin (not alanı).',
    kaynak: 'GEKA Denizli ili koyunculuk haritası 2015 (Pırıt / Pırlak ayrı)',
    kaynakUrl: 'https://geka.gov.tr/uploads/pages_v/denizli-ili-koyunculuk-haritasinin-olusturulmasi-projesi-sonuc-raporu-2015.pdf',
  },
  diger: {},
};

/** Besi / karma işletme için ileride eklenebilecek resmi/yerli adaylar — otomatik eklenmez */
export const ONERILEN_SONRAKI_IRKLAR: { ad: string; gerekce: string; kaynak?: string }[] = [
  { ad: 'Malya', gerekce: 'TİGEM et yönlü melez (Akkaraman × Alman et merinosu)', kaynak: 'TİGEM damızlık' },
  { ad: 'Dağlıç', gerekce: 'Yaygın yerli, besi planında köken netleştirme', kaynak: 'ESK yerli' },
  { ad: 'Çine çaparı', gerekce: 'Ege besi pazarında sık genotip/melez', kaynak: 'Yerel raporlar' },
  { ad: 'Acıpayam', gerekce: 'ESK/TİGEM kombine ırk', kaynak: 'TİGEM' },
];
