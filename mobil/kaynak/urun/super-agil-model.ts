/**
 * SüperAğıl — 10 rakip uygulamanın özellik birleşimi (ürün modeli)
 *
 * Skor: 0–10 (0 yok, 5 kısmi/pilot, 8 güçlü, 10 kategori lideri)
 * SüperAğıl skoru = rakipler arasından o özellikte en yüksek skor
 * Durum (SürüYön): var | kismi | yok
 */

export type OzellikDurum = 'var' | 'kismi' | 'yok';

export type RakipId =
  | 'sheepal'
  | 'akilli-suru'
  | 'roswise-ovinia'
  | 'suruplus'
  | 'benimsurum'
  | 'benim-ciftligim'
  | 'herdwatch'
  | 'my-sheep-manager'
  | 'sheeppro'
  | 'farmkeep';

export interface RakipUygulama {
  id: RakipId;
  ad: string;
  bolge: string;
  odak: string;
}

export interface OzellikSatiri {
  id: string;
  kategori: string;
  ozellik: string;
  aciklama: string;
  /** Rakip skorları 0–10 */
  rakipSkor: Record<RakipId, number>;
  /** SürüYön skoru 0–10 */
  suruyonSkor: number;
  suruyonDurum: OzellikDurum;
  suruyonNot: string;
}

export const RAKIPLER: RakipUygulama[] = [
  {
    id: 'sheepal',
    ad: 'Sheepal',
    bolge: 'TR / global',
    odak: 'Koyun; bulut, RFID, tartım/ayıırma, muhasebe, süt, pedigri',
  },
  {
    id: 'akilli-suru',
    ad: 'Akıllı Sürü',
    bolge: 'TR',
    odak: 'Küçükbaş; 15+ modül, RFID, vet portal, finans, verim',
  },
  {
    id: 'roswise-ovinia',
    ad: 'roswise Ovinia',
    bolge: 'TR',
    odak: 'Koyun-keçi; şecere, ultrason, padok, süt/yapağı, RFID donanım',
  },
  {
    id: 'suruplus',
    ad: 'SürüPlus',
    bolge: 'TR',
    odak: 'Ücretsiz; tam çevrimdışı, süt, aşı, doğum, yedekleme',
  },
  {
    id: 'benimsurum',
    ad: 'BenimSürüm',
    bolge: 'TR',
    odak: 'Web+mobil; süt, sağlık, üreme, raporlama (online)',
  },
  {
    id: 'benim-ciftligim',
    ad: 'Benim Çiftliğim',
    bolge: 'TR',
    odak: 'Freemium mobil; temel sürü, sınırlı offline/rapor',
  },
  {
    id: 'herdwatch',
    ad: 'Herdwatch',
    bolge: 'UK / IE / global',
    odak: 'Koyun+sığır; EID, uyumluluk, doğum, ADG, offline',
  },
  {
    id: 'my-sheep-manager',
    ad: 'My Sheep Manager',
    bolge: 'Global',
    odak: 'Mobil+web sürü kaydı, sağlık, üreme, temel rapor',
  },
  {
    id: 'sheeppro',
    ad: 'SheepPro',
    bolge: 'US / global',
    odak: 'Genetik (NSIP/LambPlan), el terminali, pedigri',
  },
  {
    id: 'farmkeep',
    ad: 'FarmKeep',
    bolge: 'Global',
    odak: 'Çok tür; süt, soy, sağlık, basit finans',
  },
];

/**
 * Özellik matrisi — skorlar kamuya açık özellik listeleri + ürün olgunluğuna
 * göre tahmini (0–10). SüperAğıl = satırdaki max rakip skoru.
 */
export const OZELLIK_MATRISI: OzellikSatiri[] = [
  {
    id: 'hayvan-kayit',
    kategori: 'Sürü',
    ozellik: 'Hayvan kimlik / küpe kaydı',
    aciklama: 'Küpe, RFID/EID, arama, hayvan kartı',
    rakipSkor: {
      sheepal: 9,
      'akilli-suru': 9,
      'roswise-ovinia': 9,
      suruplus: 8,
      benimsurum: 8,
      'benim-ciftligim': 6,
      herdwatch: 10,
      'my-sheep-manager': 7,
      sheeppro: 8,
      farmkeep: 7,
    },
    suruyonSkor: 8,
    suruyonDurum: 'var',
    suruyonNot: 'Küpe, TÜRKVET, GEKİS, sırt no, arama; RFID simülasyon',
  },
  {
    id: 'padok',
    kategori: 'Sürü',
    ozellik: 'Padok / grup yönetimi',
    aciklama: 'Padok oluşturma, kapasite, hareket, karantina',
    rakipSkor: {
      sheepal: 7,
      'akilli-suru': 9,
      'roswise-ovinia': 9,
      suruplus: 6,
      benimsurum: 7,
      'benim-ciftligim': 5,
      herdwatch: 8,
      'my-sheep-manager': 6,
      sheeppro: 5,
      farmkeep: 6,
    },
    suruyonSkor: 8,
    suruyonDurum: 'var',
    suruyonNot: 'Padok CRUD, karantina, filtre, doluluk',
  },
  {
    id: 'ureme-dogum',
    kategori: 'Üreme',
    ozellik: 'Üreme / doğum / kuzulatma',
    aciklama: 'Katım, gebelik, doğum kaydı, ana-yavru bağlama',
    rakipSkor: {
      sheepal: 9,
      'akilli-suru': 9,
      'roswise-ovinia': 10,
      suruplus: 8,
      benimsurum: 8,
      'benim-ciftligim': 6,
      herdwatch: 10,
      'my-sheep-manager': 8,
      sheeppro: 7,
      farmkeep: 7,
    },
    suruyonSkor: 4,
    suruyonDurum: 'kismi',
    suruyonNot: 'Mod2/3 checklist (pilot); tam doğum/katım modülü yok',
  },
  {
    id: 'pedigri',
    kategori: 'Üreme',
    ozellik: 'Şecere / pedigri / genetik',
    aciklama: 'Soy ağacı, damızlık seçimi, akrabalık',
    rakipSkor: {
      sheepal: 9,
      'akilli-suru': 8,
      'roswise-ovinia': 10,
      suruplus: 4,
      benimsurum: 5,
      'benim-ciftligim': 3,
      herdwatch: 6,
      'my-sheep-manager': 5,
      sheeppro: 10,
      farmkeep: 7,
    },
    suruyonSkor: 2,
    suruyonDurum: 'kismi',
    suruyonNot: 'Anne alanı var; soy ağacı / genetik rapor yok',
  },
  {
    id: 'tartim-adg',
    kategori: 'Performans',
    ozellik: 'Tartım + ADG',
    aciklama: 'Kilo kaydı, büyüme eğrisi, günlük artış',
    rakipSkor: {
      sheepal: 9,
      'akilli-suru': 7,
      'roswise-ovinia': 9,
      suruplus: 6,
      benimsurum: 6,
      'benim-ciftligim': 4,
      herdwatch: 10,
      'my-sheep-manager': 6,
      sheeppro: 7,
      farmkeep: 5,
    },
    suruyonSkor: 9,
    suruyonDurum: 'var',
    suruyonNot: 'T1, grafik, ADG, kuzu derecesi, seri tartım',
  },
  {
    id: 'fcr-maliyet',
    kategori: 'Performans',
    ozellik: 'FCR / yem dönüşümü / maliyet',
    aciklama: 'Yem→et hesabı, maliyet analizi',
    rakipSkor: {
      sheepal: 6,
      'akilli-suru': 6,
      'roswise-ovinia': 5,
      suruplus: 3,
      benimsurum: 4,
      'benim-ciftligim': 2,
      herdwatch: 5,
      'my-sheep-manager': 3,
      sheeppro: 4,
      farmkeep: 3,
    },
    suruyonSkor: 8,
    suruyonDurum: 'var',
    suruyonNot: 'FCR + öneri vs gerçek + yolculuk metrik raporu',
  },
  {
    id: 'saglik-asi',
    kategori: 'Sağlık',
    ozellik: 'Sağlık / aşı / ilaç / bekletme',
    aciklama: 'Kayıt, takvim, withdrawal, stok düşümü',
    rakipSkor: {
      sheepal: 9,
      'akilli-suru': 9,
      'roswise-ovinia': 8,
      suruplus: 8,
      benimsurum: 8,
      'benim-ciftligim': 6,
      herdwatch: 10,
      'my-sheep-manager': 7,
      sheeppro: 6,
      farmkeep: 7,
    },
    suruyonSkor: 8,
    suruyonDurum: 'var',
    suruyonNot: 'Sağlık kaydı, aşı takvimi, bekletme, bildirim',
  },
  {
    id: 'ultrason',
    kategori: 'Sağlık',
    ozellik: 'Ultrason / gebelik kontrolü',
    aciklama: 'Ultrason kayıt ve hatırlatma',
    rakipSkor: {
      sheepal: 4,
      'akilli-suru': 5,
      'roswise-ovinia': 10,
      suruplus: 2,
      benimsurum: 3,
      'benim-ciftligim': 1,
      herdwatch: 4,
      'my-sheep-manager': 2,
      sheeppro: 3,
      farmkeep: 2,
    },
    suruyonSkor: 0,
    suruyonDurum: 'yok',
    suruyonNot: 'Ultrason modülü yok',
  },
  {
    id: 'vet-portal',
    kategori: 'Sağlık',
    ozellik: 'Veteriner portal / vaka paylaşımı',
    aciklama: 'Vet erişimi, vaka paketi, uzak danışma',
    rakipSkor: {
      sheepal: 4,
      'akilli-suru': 9,
      'roswise-ovinia': 5,
      suruplus: 2,
      benimsurum: 3,
      'benim-ciftligim': 1,
      herdwatch: 5,
      'my-sheep-manager': 2,
      sheeppro: 2,
      farmkeep: 2,
    },
    suruyonSkor: 7,
    suruyonDurum: 'var',
    suruyonNot: 'Akıllı vet + vaka kutusu + iletişime gönder (pilot)',
  },
  {
    id: 'karar-destek-ai',
    kategori: 'Zeka',
    ozellik: 'Akıllı öneri / karar destek',
    aciklama: 'Günlük öncelik, uyarı, rasyon/sağlık önerisi',
    rakipSkor: {
      sheepal: 4,
      'akilli-suru': 5,
      'roswise-ovinia': 5,
      suruplus: 3,
      benimsurum: 3,
      'benim-ciftligim': 2,
      herdwatch: 7,
      'my-sheep-manager': 3,
      sheeppro: 4,
      farmkeep: 3,
    },
    suruyonSkor: 8,
    suruyonDurum: 'var',
    suruyonNot: 'Akıllı Kuzu kritik/aksiyon kartları + görevler',
  },
  {
    id: 'rasyon',
    kategori: 'Besleme',
    ozellik: 'Rasyon hesap / öneri',
    aciklama: 'Canlı ağırlığa göre yem planı',
    rakipSkor: {
      sheepal: 8,
      'akilli-suru': 8,
      'roswise-ovinia': 6,
      suruplus: 4,
      benimsurum: 5,
      'benim-ciftligim': 3,
      herdwatch: 5,
      'my-sheep-manager': 4,
      sheeppro: 3,
      farmkeep: 4,
    },
    suruyonSkor: 8,
    suruyonDurum: 'var',
    suruyonNot: 'Hesap, akıllı öneri, karşılaştırma tablosu',
  },
  {
    id: 'stok-envanter',
    kategori: 'Besleme',
    ozellik: 'Yem / ilaç stok envanteri',
    aciklama: 'Giriş-çıkış, minimum, SKT',
    rakipSkor: {
      sheepal: 7,
      'akilli-suru': 9,
      'roswise-ovinia': 8,
      suruplus: 5,
      benimsurum: 6,
      'benim-ciftligim': 4,
      herdwatch: 8,
      'my-sheep-manager': 5,
      sheeppro: 4,
      farmkeep: 5,
    },
    suruyonSkor: 8,
    suruyonDurum: 'var',
    suruyonNot: 'Katalog, hareket, sayım, düşük stok/SKT',
  },
  {
    id: 'sut-verim',
    kategori: 'Verim',
    ozellik: 'Süt verimi takibi',
    aciklama: 'Günlük sağım, laktasyon analizi',
    rakipSkor: {
      sheepal: 9,
      'akilli-suru': 9,
      'roswise-ovinia': 9,
      suruplus: 8,
      benimsurum: 8,
      'benim-ciftligim': 5,
      herdwatch: 4,
      'my-sheep-manager': 5,
      sheeppro: 2,
      farmkeep: 8,
    },
    suruyonSkor: 3,
    suruyonDurum: 'kismi',
    suruyonNot: 'Mod4 süt yolculuğu pilot checklist; günlük sağım kaydı yok',
  },
  {
    id: 'yapagi',
    kategori: 'Verim',
    ozellik: 'Yapağı / kırkım',
    aciklama: 'Kırkım ve yapağı üretimi',
    rakipSkor: {
      sheepal: 5,
      'akilli-suru': 4,
      'roswise-ovinia': 9,
      suruplus: 2,
      benimsurum: 3,
      'benim-ciftligim': 1,
      herdwatch: 3,
      'my-sheep-manager': 2,
      sheeppro: 2,
      farmkeep: 3,
    },
    suruyonSkor: 0,
    suruyonDurum: 'yok',
    suruyonNot: 'Yapağı modülü yok',
  },
  {
    id: 'muhasebe',
    kategori: 'Finans',
    ozellik: 'Muhasebe / gelir-gider',
    aciklama: 'Finans dashboard, kârlılık',
    rakipSkor: {
      sheepal: 9,
      'akilli-suru': 9,
      'roswise-ovinia': 5,
      suruplus: 4,
      benimsurum: 6,
      'benim-ciftligim': 3,
      herdwatch: 6,
      'my-sheep-manager': 4,
      sheeppro: 3,
      farmkeep: 6,
    },
    suruyonSkor: 2,
    suruyonDurum: 'kismi',
    suruyonNot: 'Besi maliyet ipucu var; tam muhasebe yok',
  },
  {
    id: 'raporlama',
    kategori: 'Rapor',
    ozellik: 'Gelişmiş PDF/Excel rapor',
    aciklama: 'Grafikli, logolu dışa aktarım',
    rakipSkor: {
      sheepal: 10,
      'akilli-suru': 8,
      'roswise-ovinia': 8,
      suruplus: 6,
      benimsurum: 7,
      'benim-ciftligim': 4,
      herdwatch: 8,
      'my-sheep-manager': 5,
      sheeppro: 7,
      farmkeep: 5,
    },
    suruyonSkor: 5,
    suruyonDurum: 'kismi',
    suruyonNot: 'CSV/JSON paylaşım; profesyonel PDF rapor yok',
  },
  {
    id: 'rfid-donanim',
    kategori: 'Donanım',
    ozellik: 'RFID / EID / otomatik tartım entegrasyonu',
    aciklama: 'El terminali, tartı, ayırıcı',
    rakipSkor: {
      sheepal: 10,
      'akilli-suru': 9,
      'roswise-ovinia': 10,
      suruplus: 2,
      benimsurum: 3,
      'benim-ciftligim': 1,
      herdwatch: 9,
      'my-sheep-manager': 3,
      sheeppro: 8,
      farmkeep: 2,
    },
    suruyonSkor: 3,
    suruyonDurum: 'kismi',
    suruyonNot: 'RFID/OCR simülasyon; canlı donanım yok',
  },
  {
    id: 'resmi-entegrasyon',
    kategori: 'Uyum',
    ozellik: 'Resmi sistem entegrasyonu (TÜRKVET / movement)',
    aciklama: 'Devlet bildirimi, uyumluluk',
    rakipSkor: {
      sheepal: 5,
      'akilli-suru': 6,
      'roswise-ovinia': 5,
      suruplus: 4,
      benimsurum: 5,
      'benim-ciftligim': 3,
      herdwatch: 10,
      'my-sheep-manager': 4,
      sheeppro: 5,
      farmkeep: 3,
    },
    suruyonSkor: 6,
    suruyonDurum: 'kismi',
    suruyonNot: 'TÜRKVET alan + JSON/CSV aktarım; canlı API yakında',
  },
  {
    id: 'offline',
    kategori: 'Altyapı',
    ozellik: 'Çevrimdışı çalışma',
    aciklama: 'İnternetsiz kayıt ve kullanım',
    rakipSkor: {
      sheepal: 3,
      'akilli-suru': 5,
      'roswise-ovinia': 4,
      suruplus: 10,
      benimsurum: 2,
      'benim-ciftligim': 6,
      herdwatch: 9,
      'my-sheep-manager': 5,
      sheeppro: 4,
      farmkeep: 5,
    },
    suruyonSkor: 9,
    suruyonDurum: 'var',
    suruyonNot: 'Yerel SQLite/web; senkron kuyruğu',
  },
  {
    id: 'bulut-cok-cihaz',
    kategori: 'Altyapı',
    ozellik: 'Bulut senkron / çok cihaz',
    aciklama: 'Çok kullanıcı, bulut yedek',
    rakipSkor: {
      sheepal: 9,
      'akilli-suru': 9,
      'roswise-ovinia': 9,
      suruplus: 5,
      benimsurum: 9,
      'benim-ciftligim': 4,
      herdwatch: 9,
      'my-sheep-manager': 7,
      sheeppro: 6,
      farmkeep: 7,
    },
    suruyonSkor: 3,
    suruyonDurum: 'kismi',
    suruyonNot: 'JSON yedek var; bulut API kapalı, çok kullanıcı yok',
  },
  {
    id: 'ses-seri',
    kategori: 'Saha',
    ozellik: 'Sesli komut / seri ahır modu',
    aciklama: 'Eller serbest tartım-aşı-stok',
    rakipSkor: {
      sheepal: 2,
      'akilli-suru': 2,
      'roswise-ovinia': 2,
      suruplus: 1,
      benimsurum: 1,
      'benim-ciftligim': 1,
      herdwatch: 3,
      'my-sheep-manager': 1,
      sheeppro: 2,
      farmkeep: 1,
    },
    suruyonSkor: 9,
    suruyonDurum: 'var',
    suruyonNot: 'Sesli komut + seri tartım/aşılama (farklılaştırıcı)',
  },
  {
    id: 'is-akisi-mod',
    kategori: 'Saha',
    ozellik: 'Ürün modu / yolculuk iş akışı',
    aciklama: 'Besi/damızlık/süt adım adım rehber',
    rakipSkor: {
      sheepal: 4,
      'akilli-suru': 5,
      'roswise-ovinia': 4,
      suruplus: 3,
      benimsurum: 3,
      'benim-ciftligim': 2,
      herdwatch: 5,
      'my-sheep-manager': 3,
      sheeppro: 4,
      farmkeep: 3,
    },
    suruyonSkor: 9,
    suruyonDurum: 'var',
    suruyonNot: '4 mod; Mod1 tam, diğerleri pilot — güçlü fark',
  },
  {
    id: 'gorev-hatirlatma',
    kategori: 'Saha',
    ozellik: 'Görev / hatırlatma / Bugün',
    aciklama: 'Günlük iş listesi ve bildirim',
    rakipSkor: {
      sheepal: 7,
      'akilli-suru': 8,
      'roswise-ovinia': 7,
      suruplus: 6,
      benimsurum: 5,
      'benim-ciftligim': 4,
      herdwatch: 8,
      'my-sheep-manager': 5,
      sheeppro: 4,
      farmkeep: 5,
    },
    suruyonSkor: 8,
    suruyonDurum: 'var',
    suruyonNot: 'Bugün kartı, görevler, aşı bildirimi',
  },
  {
    id: 'cok-kullanici',
    kategori: 'Altyapı',
    ozellik: 'Çok kullanıcı / rol',
    aciklama: 'Çiftçi, çoban, vet rolleri',
    rakipSkor: {
      sheepal: 7,
      'akilli-suru': 9,
      'roswise-ovinia': 7,
      suruplus: 3,
      benimsurum: 6,
      'benim-ciftligim': 2,
      herdwatch: 8,
      'my-sheep-manager': 4,
      sheeppro: 5,
      farmkeep: 4,
    },
    suruyonSkor: 0,
    suruyonDurum: 'yok',
    suruyonNot: 'Tek cihaz yerel profil; rol yok',
  },
  {
    id: 'mobil-ux',
    kategori: 'Ürün',
    ozellik: 'Mobil-first Türkçe UX',
    aciklama: 'Telefon odaklı, TR dil, ahır kullanımı',
    rakipSkor: {
      sheepal: 7,
      'akilli-suru': 8,
      'roswise-ovinia': 7,
      suruplus: 8,
      benimsurum: 7,
      'benim-ciftligim': 7,
      herdwatch: 9,
      'my-sheep-manager': 7,
      sheeppro: 6,
      farmkeep: 7,
    },
    suruyonSkor: 8,
    suruyonDurum: 'var',
    suruyonNot: 'Expo mobil/web, TR arayüz, kestirmeler',
  },
];

export function superAgilSkor(satir: OzellikSatiri): number {
  return Math.max(...Object.values(satir.rakipSkor));
}

export function superAgilLider(satir: OzellikSatiri): RakipId {
  let best: RakipId = RAKIPLER[0].id;
  let max = -1;
  for (const r of RAKIPLER) {
    const s = satir.rakipSkor[r.id];
    if (s > max) {
      max = s;
      best = r.id;
    }
  }
  return best;
}

export function toplamSkor(
  sec: (s: OzellikSatiri) => number
): { toplam: number; ortalama: number; maxToplam: number } {
  const n = OZELLIK_MATRISI.length;
  const maxToplam = n * 10;
  const toplam = OZELLIK_MATRISI.reduce((a, s) => a + sec(s), 0);
  return { toplam, ortalama: Math.round((toplam / n) * 10) / 10, maxToplam };
}

export const SUPER_AGIL_URUN = {
  ad: 'SüperAğıl',
  tanim:
    '10 rakip küçükbaş/sürü uygulamasının özellik birleşimi: her özellikte pazardaki en yüksek olgunluk skoru.',
  vizyon:
    'Tek platformda: RFID+tartım donanım, şecere/üreme, süt-yapağı, muhasebe, resmi uyum, güçlü offline, saha ses/seri ve akıllı karar destek.',
  kaynakRakipler: RAKIPLER.map((r) => r.ad),
} as const;
