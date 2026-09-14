/**
 * N aşamalı profesyonellik modeli — varsayılan paket 5; 10 ince paket aynı üst ağaçtan.
 * Sabit "yalnızca 5" yok: UI `getAsamaPaketi(n)` ile beslenir.
 */

export type AsamaPaketBoyutu = 5 | 10;

export type AsamaEtiket = 'tarim-bakanligi' | 'saha' | 'karar' | 'isletme';

export type AsamaEylem = {
  id: string;
  baslik: string;
  aciklama: string;
  /** Görev href hedefi */
  href: string;
  /** Gün ofseti: onaydan kaç gün sonra (0 = bugün) */
  gunOfset: number;
  etiket?: AsamaEtiket;
};

export type AsamaAvantaj = {
  id: string;
  metin: string;
  /** Kısa getiri cümlesi — abartısız saha dili */
  getiri: string;
};

export type ProfesyonellikAsama = {
  id: string;
  /** 1..N görünen sıra */
  sira: number;
  baslik: string;
  ozet: string;
  /** 5’li paketteki üst aşama id (10’da dolu) */
  ustAsamaId: string;
  eylemler: AsamaEylem[];
  avantajlar: AsamaAvantaj[];
};

/** Beş ana aşama — ürün varsayılanı */
export const ASAMA_5: ProfesyonellikAsama[] = [
  {
    id: 'a1-temel-kayit',
    sira: 1,
    baslik: 'Temel kayıt',
    ozet: 'Hayvanlar listede; küpe veya numara bilinir.',
    ustAsamaId: 'a1-temel-kayit',
    eylemler: [
      {
        id: 'e1-suru-giris',
        baslik: 'Sürüye hayvan gir',
        aciklama: 'Mevcut kuzuları / koyunları telefona kaydet.',
        href: '/hayvan/ekle',
        gunOfset: 0,
        etiket: 'saha',
      },
      {
        id: 'e1-padok',
        baslik: 'Padok ayır',
        aciklama: 'Gözlem ve diğer padokları ayırt et.',
        href: '/(tabs)/suru',
        gunOfset: 1,
        etiket: 'saha',
      },
    ],
    avantajlar: [
      {
        id: 'v1-kayip',
        metin: 'Kayıp / karışan hayvan azalır',
        getiri: 'Satış ve aşıda doğru hayvana ulaşırsın.',
      },
      {
        id: 'v1-takip',
        metin: 'Yaş ve giriş tarihi netleşir',
        getiri: 'Bak / sat zamanı daha az tahmin olur.',
      },
    ],
  },
  {
    id: 'a2-saglik',
    sira: 2,
    baslik: 'Sağlık düzeni',
    ozet: 'Gözlem + aşı takvimi; resmi işler Tarım Bakanlığı etiketli.',
    ustAsamaId: 'a2-saglik',
    eylemler: [
      {
        id: 'e2-gozlem',
        baslik: 'Gelişte gözlem günleri',
        aciklama: 'Yeni gelenleri ayrı tut; günlük kontrol.',
        href: '/(tabs)/saglik',
        gunOfset: 0,
        etiket: 'saha',
      },
      {
        id: 'e2-tarim-asi',
        baslik: 'Tarım Bakanlığı aşı programı',
        aciklama: 'Zorunlu / resmi aşıları takvime bağla.',
        href: '/(tabs)/saglik',
        gunOfset: 0,
        etiket: 'tarim-bakanligi',
      },
    ],
    avantajlar: [
      {
        id: 'v2-risk',
        metin: 'Hastalık yayılma riski düşer',
        getiri: 'Toplu ölüm ve tedavi masrafı azalır.',
      },
      {
        id: 'v2-resmi',
        metin: 'Resmi aşılar kaçmaz',
        getiri: 'Kontrol ve satışta güven artar.',
      },
    ],
  },
  {
    id: 'a3-besi',
    sira: 3,
    baslik: 'Besi disiplini',
    ozet: 'Düzenli tartım, rasyon ve yem stoku.',
    ustAsamaId: 'a3-besi',
    eylemler: [
      {
        id: 'e3-tartim',
        baslik: 'Düzenli tartım rutini',
        aciklama: 'Haftalık veya dönemsel tartımı planla.',
        href: '/seri-giris',
        gunOfset: 0,
        etiket: 'saha',
      },
      {
        id: 'e3-rasyon',
        baslik: 'Rasyon + stok kontrolü',
        aciklama: 'Günlük yem planı ve düşük stok uyarısı.',
        href: '/(tabs)/rasyon',
        gunOfset: 1,
        etiket: 'saha',
      },
    ],
    avantajlar: [
      {
        id: 'v3-yem',
        metin: 'Gereksiz yem günü azalır',
        getiri: 'Zayıf gelişimi erken görüp rasyonu düzeltirsin.',
      },
      {
        id: 'v3-stok',
        metin: 'Yem bitmesi sürprize kalmaz',
        getiri: 'Acil pahalı alım azalır.',
      },
    ],
  },
  {
    id: 'a4-olcum',
    sira: 4,
    baslik: 'Ölçüp karar',
    ozet: 'ADG ve süreye göre bak veya sat.',
    ustAsamaId: 'a4-olcum',
    eylemler: [
      {
        id: 'e4-adg',
        baslik: 'Gelişim / ADG bak',
        aciklama: 'Tartımlardan gelişimi oku; zayıf grubu ayır.',
        href: '/(tabs)/akilli-kuzu',
        gunOfset: 0,
        etiket: 'karar',
      },
      {
        id: 'e4-satis',
        baslik: 'Satış veya ek süre kararı',
        aciklama: 'Tipik ~3 ay besi; zayıfsa +1 ay seçeneğini değerlendir.',
        href: '/(tabs)/yolculuk',
        gunOfset: 2,
        etiket: 'karar',
      },
    ],
    avantajlar: [
      {
        id: 'v4-zaman',
        metin: 'Erken / geç satış azalır',
        getiri: 'Kilo ve fiyat dengesini daha net yakalarsın.',
      },
      {
        id: 'v4-maliyet',
        metin: 'Boşa yemlenen günler kısalır',
        getiri: 'Marj korunur.',
      },
    ],
  },
  {
    id: 'a5-isletme',
    sira: 5,
    baslik: 'İşletme yönetimi',
    ozet: 'İş planı, görev takibi, dönem özeti.',
    ustAsamaId: 'a5-isletme',
    eylemler: [
      {
        id: 'e5-is-plani',
        baslik: 'Haftalık iş planı',
        aciklama: 'Kırkım, tartım, alım/satım tarihlerini planla.',
        href: '/gorevler',
        gunOfset: 0,
        etiket: 'isletme',
      },
      {
        id: 'e5-ozet',
        baslik: 'Dönem özeti',
        aciklama: 'Dönem bitince ne iyi gitti / ne düzeltilir.',
        href: '/(tabs)/akilli-kuzu',
        gunOfset: 7,
        etiket: 'isletme',
      },
    ],
    avantajlar: [
      {
        id: 'v5-duzen',
        metin: 'İşler unutulmaz',
        getiri: 'Çoban ve sahip aynı listeden yürür.',
      },
      {
        id: 'v5-ogrenme',
        metin: 'Sonraki parti daha bilinçli başlar',
        getiri: 'Aynı hatayı tekrar etme ihtimali düşer.',
      },
    ],
  },
];

/** On aşama — 5’in alt adımları (ince paket) */
export const ASAMA_10: ProfesyonellikAsama[] = [
  {
    id: 'a10-1-kayit',
    sira: 1,
    baslik: 'Küpe / numara kaydı',
    ozet: 'Her hayvan tanımlı.',
    ustAsamaId: 'a1-temel-kayit',
    eylemler: [ASAMA_5[0].eylemler[0]],
    avantajlar: [ASAMA_5[0].avantajlar[0]],
  },
  {
    id: 'a10-2-padok',
    sira: 2,
    baslik: 'Padok / gözlem ayrımı',
    ozet: 'Gruplar karışmaz.',
    ustAsamaId: 'a1-temel-kayit',
    eylemler: [ASAMA_5[0].eylemler[1]],
    avantajlar: [ASAMA_5[0].avantajlar[1]],
  },
  {
    id: 'a10-3-gozlem',
    sira: 3,
    baslik: 'Gelişte gözlem',
    ozet: 'İlk günler ayrı takip.',
    ustAsamaId: 'a2-saglik',
    eylemler: [ASAMA_5[1].eylemler[0]],
    avantajlar: [ASAMA_5[1].avantajlar[0]],
  },
  {
    id: 'a10-4-tarim',
    sira: 4,
    baslik: 'Tarım Bakanlığı aşıları',
    ozet: 'Resmi program takvimde.',
    ustAsamaId: 'a2-saglik',
    eylemler: [ASAMA_5[1].eylemler[1]],
    avantajlar: [ASAMA_5[1].avantajlar[1]],
  },
  {
    id: 'a10-5-tartim',
    sira: 5,
    baslik: 'Düzenli tartım',
    ozet: 'Kilo rutini oturur.',
    ustAsamaId: 'a3-besi',
    eylemler: [ASAMA_5[2].eylemler[0]],
    avantajlar: [ASAMA_5[2].avantajlar[0]],
  },
  {
    id: 'a10-6-rasyon',
    sira: 6,
    baslik: 'Rasyon + yem stoku',
    ozet: 'Yem planı ve stok birlikte.',
    ustAsamaId: 'a3-besi',
    eylemler: [ASAMA_5[2].eylemler[1]],
    avantajlar: [ASAMA_5[2].avantajlar[1]],
  },
  {
    id: 'a10-7-adg',
    sira: 7,
    baslik: 'ADG / gelişim okuma',
    ozet: 'Sayıyla bakarsın.',
    ustAsamaId: 'a4-olcum',
    eylemler: [ASAMA_5[3].eylemler[0]],
    avantajlar: [ASAMA_5[3].avantajlar[0]],
  },
  {
    id: 'a10-8-satis',
    sira: 8,
    baslik: 'Satış / ek süre kararı',
    ozet: '~3 ay + gerekirse +1 ay.',
    ustAsamaId: 'a4-olcum',
    eylemler: [ASAMA_5[3].eylemler[1]],
    avantajlar: [ASAMA_5[3].avantajlar[1]],
  },
  {
    id: 'a10-9-plan',
    sira: 9,
    baslik: 'İş planı + görevler',
    ozet: 'Haftalık iş listesi.',
    ustAsamaId: 'a5-isletme',
    eylemler: [ASAMA_5[4].eylemler[0]],
    avantajlar: [ASAMA_5[4].avantajlar[0]],
  },
  {
    id: 'a10-10-rapor',
    sira: 10,
    baslik: 'Dönem raporu',
    ozet: 'Öğrenip bir sonraki partiye taşı.',
    ustAsamaId: 'a5-isletme',
    eylemler: [ASAMA_5[4].eylemler[1]],
    avantajlar: [ASAMA_5[4].avantajlar[1]],
  },
];

export const VARSAYILAN_PAKET: AsamaPaketBoyutu = 5;

export function getAsamaPaketi(boyut: AsamaPaketBoyutu = VARSAYILAN_PAKET): ProfesyonellikAsama[] {
  return boyut === 10 ? ASAMA_10 : ASAMA_5;
}

export function asamaBul(
  id: string,
  boyut: AsamaPaketBoyutu = VARSAYILAN_PAKET
): ProfesyonellikAsama | undefined {
  return getAsamaPaketi(boyut).find((a) => a.id === id);
}

export function sonrakiAsama(
  mevcutId: string | null,
  boyut: AsamaPaketBoyutu = VARSAYILAN_PAKET
): ProfesyonellikAsama | null {
  const liste = getAsamaPaketi(boyut);
  if (!mevcutId) return liste[0] ?? null;
  const idx = liste.findIndex((a) => a.id === mevcutId);
  if (idx < 0) return liste[0] ?? null;
  return liste[idx + 1] ?? null;
}

export function etiketMetin(etiket?: AsamaEtiket): string | null {
  if (etiket === 'tarim-bakanligi') return 'Tarım Bakanlığı';
  return null;
}
