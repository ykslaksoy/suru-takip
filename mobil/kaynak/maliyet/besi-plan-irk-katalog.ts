/**
 * t364u — plan hedef ırk kataloğu (SuperKuzu / besi planlama).
 * İrka özel ADG yok; kullanıcı pazarlama metni kaydedilmez.
 */

export type BesiIrkGrup = 'plan_ozel' | 'yerli' | 'gelistirilmis_melez' | 'yabanci';

export const BESI_IRK_GRUP_ETIKET: Record<BesiIrkGrup, string> = {
  plan_ozel: 'Plan — özel / belirsiz',
  yerli: 'Yerli / yerel genotip',
  gelistirilmis_melez: 'Geliştirilmiş / melez (TR programı)',
  yabanci: 'Yabancı ırk (ithal / damızlık)',
};

/** Katalogda görünen kodlar (pirit_belirsiz hariç) */
export type BesiHedefIrkKodKatalog =
  | 'generic_kuzu'
  | 'merinos_capraz'
  | 'diger'
  | 'akkaraman'
  | 'morkaraman'
  | 'kivircik'
  | 'ivesi'
  | 'sakiz'
  | 'karayaka'
  | 'daglic'
  | 'kangal_akkaraman'
  | 'gokceada_imroz'
  | 'herik'
  | 'norduz'
  | 'hemsin'
  | 'cine_capari'
  | 'karacabey_merinos'
  | 'orta_anadolu_merinos'
  | 'tahirova'
  | 'bafra_koyunu'
  | 'asaf'
  | 'anadolu_merinos'
  | 'pirlak'
  | 'menemen'
  | 'sonmez'
  | 'romanov'
  | 'suffolk'
  | 'charollais_sarole'
  | 'texel'
  | 'ile_de_france'
  | 'lacaune'
  | 'dogu_friz'
  | 'dorper'
  | 'merinoland';

/** Eski plan kayıtları — silinmez; okumada pirlak ile birleşir */
export type BesiHedefIrkKodu = BesiHedefIrkKodKatalog | 'pirit_belirsiz';

export const LEGACY_HEDEF_IRK_ESLEME: Record<'pirit_belirsiz', BesiHedefIrkKodKatalog> = {
  pirit_belirsiz: 'pirlak',
};

export type IrkKatalogSatiri = {
  kod: BesiHedefIrkKodKatalog;
  etiket: string;
  grup: BesiIrkGrup;
  aramaAlias?: string[];
  kaynak?: string;
  kaynakUrl?: string;
  beklemede?: boolean;
  beklemeNotu?: string;
};

const TIGEM = 'https://www.tigem.gov.tr/Bilgi/Detay/Damizlik/Koyunculuk';
const ESK_YERLI = 'https://www.esk.gov.tr/tr/11101/Etci-Koyun-Irklari';

export const BESI_IRK_KATALOG: IrkKatalogSatiri[] = [
  { kod: 'generic_kuzu', etiket: 'Genel kuzu (ırk belirsiz)', grup: 'plan_ozel' },
  {
    kod: 'merinos_capraz',
    etiket: 'Merinos melezi (genel)',
    grup: 'plan_ozel',
    kaynak: 'Bellisiz merinos hattı — Karacabey / OAM / Anadolu ayrı seçilir',
  },
  { kod: 'diger', etiket: 'Diğer (not)', grup: 'plan_ozel' },

  { kod: 'akkaraman', etiket: 'Akkaraman', grup: 'yerli', kaynak: 'ESK / TİGEM yerli', kaynakUrl: ESK_YERLI },
  {
    kod: 'morkaraman',
    etiket: 'Morkaraman',
    grup: 'yerli',
    kaynak: 'TİGEM — Akkaraman varyantı (morkaraman)',
    kaynakUrl: TIGEM,
  },
  { kod: 'kivircik', etiket: 'Kıvırcık', grup: 'yerli', kaynak: 'ESK / TİGEM', kaynakUrl: TIGEM },
  {
    kod: 'ivesi',
    etiket: 'İvesi',
    grup: 'yerli',
    aramaAlias: ['Anadolu İvesi', 'Ivesi'],
    kaynak: 'ESK / TİGEM',
    kaynakUrl: TIGEM,
  },
  { kod: 'sakiz', etiket: 'Sakız', grup: 'yerli', kaynak: 'ESK / TİGEM', kaynakUrl: TIGEM },
  { kod: 'karayaka', etiket: 'Karayaka', grup: 'yerli', kaynak: 'ESK yerli', kaynakUrl: ESK_YERLI },
  { kod: 'daglic', etiket: 'Dağlıç', grup: 'yerli', kaynak: 'ESK yerli', kaynakUrl: ESK_YERLI },
  {
    kod: 'kangal_akkaraman',
    etiket: 'Kangal Akkaramanı',
    grup: 'yerli',
    aramaAlias: ['Kangal tipi Akkaraman'],
    kaynak: 'TİGEM — Kangal tipi',
    kaynakUrl: TIGEM,
  },
  {
    kod: 'gokceada_imroz',
    etiket: 'Gökçeada (İmroz)',
    grup: 'yerli',
    aramaAlias: ['İmroz', 'Imroz', 'Gokceada'],
    kaynak: 'Yerel ada koyunu — ESK/TAGEM kayıtları',
  },
  { kod: 'herik', etiket: 'Herik', grup: 'yerli', kaynak: 'ESK yerli (Doğu)', kaynakUrl: ESK_YERLI },
  { kod: 'norduz', etiket: 'Norduz', grup: 'yerli', kaynak: 'ESK yerli (Doğu)', kaynakUrl: ESK_YERLI },
  { kod: 'hemsin', etiket: 'Hemşin', grup: 'yerli', aramaAlias: ['Hemsin'], kaynak: 'ESK yerli', kaynakUrl: ESK_YERLI },
  {
    kod: 'cine_capari',
    etiket: 'Çine çaparı',
    grup: 'yerli',
    aramaAlias: ['Çine Çaparı', 'Cine capari'],
    kaynak: 'Ege yerel genotip — TİGEM/ESK',
    kaynakUrl: TIGEM,
  },

  {
    kod: 'karacabey_merinos',
    etiket: 'Karacabey Merinosu',
    grup: 'gelistirilmis_melez',
    kaynak: 'ESK — Kıvırcık × Alman et merinosu',
    kaynakUrl: 'https://www.esk.gov.tr/tr/11111/Karacabey-Merinosu',
  },
  {
    kod: 'orta_anadolu_merinos',
    etiket: 'Orta Anadolu Merinosu (OAM)',
    grup: 'gelistirilmis_melez',
    aramaAlias: ['OAM', 'Orta Anadolu merinos'],
    kaynak: 'TİGEM — merinos hattı',
    kaynakUrl: TIGEM,
  },
  {
    kod: 'tahirova',
    etiket: 'Tahirova',
    grup: 'gelistirilmis_melez',
    aramaAlias: ['Türk Tahirova', 'Turktahirova'],
    kaynak: 'TİGEM — Karacabey işletmesi',
    kaynakUrl: TIGEM,
  },
  {
    kod: 'bafra_koyunu',
    etiket: 'Bafra koyunu',
    grup: 'gelistirilmis_melez',
    kaynak: 'TİGEM — Bafra hattı',
    kaynakUrl: TIGEM,
  },
  {
    kod: 'asaf',
    etiket: 'Asaf',
    grup: 'gelistirilmis_melez',
    aramaAlias: ['Assaf', 'ASF', 'Asaf ırkı'],
    kaynak: 'ESK — Ostfriesisch × İvesi (yerli köken değil; TR programı)',
    kaynakUrl: 'https://www.esk.gov.tr/tr/11114/Asaf',
  },
  {
    kod: 'anadolu_merinos',
    etiket: 'Anadolu Merinosu',
    grup: 'gelistirilmis_melez',
    kaynak: 'TİGEM merinos programı',
    kaynakUrl: TIGEM,
  },
  {
    kod: 'pirlak',
    etiket: 'Pırlak (Pırıt)',
    grup: 'gelistirilmis_melez',
    aramaAlias: ['Pırıt', 'Pirit', 'PIRLAK', 'PIRIT', 'pirlak pirit'],
    kaynak: 'Kullanıcı terimi birleşik — TÜBA/GEKA yerel genotip (Batı Anadolu)',
    kaynakUrl: 'http://terim.tuba.gov.tr/',
  },
  {
    kod: 'menemen',
    etiket: 'Menemen',
    grup: 'gelistirilmis_melez',
    kaynak: 'İzmir Menemen melezi hattı (TİGEM/ESK)',
    kaynakUrl: TIGEM,
  },
  {
    kod: 'sonmez',
    etiket: 'Sönmez',
    grup: 'gelistirilmis_melez',
    kaynak: 'TİGEM melez hattı',
    kaynakUrl: TIGEM,
  },

  {
    kod: 'romanov',
    etiket: 'Romanov',
    grup: 'yabanci',
    kaynak: 'Yabancı damızlık — ithal program',
  },
  { kod: 'suffolk', etiket: 'Suffolk', grup: 'yabanci', kaynak: 'Et yönlü yabancı ırk' },
  {
    kod: 'charollais_sarole',
    etiket: 'Charollais (Şarole)',
    grup: 'yabanci',
    aramaAlias: ['Şarole', 'Charollais', 'Sarole'],
  },
  { kod: 'texel', etiket: 'Texel', grup: 'yabanci' },
  {
    kod: 'ile_de_france',
    etiket: 'Île de France',
    grup: 'yabanci',
    aramaAlias: ['Ile de France', 'Ile de France'],
  },
  { kod: 'lacaune', etiket: 'Lacaune', grup: 'yabanci', kaynak: 'Süt yönlü — kuzu eti bağlamında damızlık' },
  {
    kod: 'dogu_friz',
    etiket: 'Doğu Friz (East Friesian)',
    grup: 'yabanci',
    aramaAlias: ['East Friesian', 'Ostfriesisch', 'Doğu Friz koyunu'],
    kaynak: 'Yabancı — Asaf atası Ostfriesisch ile aynı adda karışabilir',
  },
  { kod: 'dorper', etiket: 'Dorper', grup: 'yabanci', kaynak: 'Et yönlü yabancı' },
  {
    kod: 'merinoland',
    etiket: 'Merinoland (Landmerino)',
    grup: 'yabanci',
    aramaAlias: ['Landmerino', 'Merinoland'],
  },
];

const _ETIKET_KATALOG = Object.fromEntries(BESI_IRK_KATALOG.map((r) => [r.kod, r.etiket])) as Record<
  BesiHedefIrkKodKatalog,
  string
>;

export const HEDEF_IRK_ETIKET: Record<BesiHedefIrkKodu, string> = {
  ..._ETIKET_KATALOG,
  pirit_belirsiz: _ETIKET_KATALOG.pirlak,
};

export const IRK_KATALOG_BY_KOD: Record<BesiHedefIrkKodKatalog, IrkKatalogSatiri> = Object.fromEntries(
  BESI_IRK_KATALOG.map((r) => [r.kod, r]),
) as Record<BesiHedefIrkKodKatalog, IrkKatalogSatiri>;

export function normalizeHedefIrkKodu(kod: BesiHedefIrkKodu): BesiHedefIrkKodKatalog {
  if (kod === 'pirit_belirsiz') return LEGACY_HEDEF_IRK_ESLEME.pirit_belirsiz;
  return kod;
}

export function hedefIrkKatalogdaVar(kod: string): kod is BesiHedefIrkKodKatalog {
  return Object.prototype.hasOwnProperty.call(IRK_KATALOG_BY_KOD, kod);
}

export function isGecerliHedefIrkKodu(kod: string): kod is BesiHedefIrkKodu {
  return kod === 'pirit_belirsiz' || hedefIrkKatalogdaVar(kod);
}

/** Yeni seçimlerde kullanılacak kanonik kod (eski JSON’a dokunmaz) */
export function kanonikHedefIrkKayit(kod: BesiHedefIrkKodu): BesiHedefIrkKodu {
  return normalizeHedefIrkKodu(kod);
}

export function irkGrup(kod: BesiHedefIrkKodu): BesiIrkGrup {
  return IRK_KATALOG_BY_KOD[normalizeHedefIrkKodu(kod)]?.grup ?? 'plan_ozel';
}

/** Pazarda karışık grupta seçilebilir kodlar */
export const KARISIK_IZINLI_IRK: BesiHedefIrkKodKatalog[] = ['generic_kuzu', 'diger'];

export const KATALOG_BREED_SAYISI = BESI_IRK_KATALOG.length;

/** Arama metnini normalize et (Türkçe ı/i, küçük harf) */
export function irkAramaNormalize(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ı/g, 'i');
}

export function irkKatalogAra(
  sorgu: string,
  opts?: { karisikPazar?: boolean; grup?: BesiIrkGrup | null },
): IrkKatalogSatiri[] {
  const q = irkAramaNormalize(sorgu);
  let liste = BESI_IRK_KATALOG;
  if (opts?.karisikPazar) liste = liste.filter((r) => KARISIK_IZINLI_IRK.includes(r.kod));
  else if (opts?.grup) liste = liste.filter((r) => r.grup === opts.grup);
  if (!q) return liste;
  return liste.filter((r) => {
    const blob = irkAramaNormalize([r.etiket, r.kod, ...(r.aramaAlias ?? [])].join(' '));
    return blob.includes(q);
  });
}

export function irkAliasSayisi(): number {
  return BESI_IRK_KATALOG.reduce((n, r) => n + (r.aramaAlias?.length ?? 0), 0);
}
