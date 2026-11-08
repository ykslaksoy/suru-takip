/** t355u — normalize piyasa referansı; otomatik TOBB parse yok, gömülü + önbellek. */

export type PiyasaKategori = 'canli_kg' | 'karkas_kg' | 'bas_adet';
export type PiyasaBolge = 'edirne_tobb' | 'ukon' | 'balikesir' | 'kullanici';
export type PiyasaKayitDurum = 'gömülü' | 'önbellek' | 'bayat' | 'hata' | 'arastirma_bekleniyor' | 'manuel';

export type PiyasaFiyatKaydi = {
  id: string;
  kategori: PiyasaKategori;
  bolge: PiyasaBolge;
  etiket: string;
  /** Tek fiyat veya aralık ortası */
  deger: number | null;
  min: number | null;
  max: number | null;
  birim: 'TL/kg' | 'TL/bas';
  /** Kaynaktaki işlem/gün tarihi */
  islemTarihi: string | null;
  /** Uygulamaya alındığı gün (ISO) */
  alinmaTarihi: string;
  kaynakAd: string;
  kaynakUrl: string | null;
  durum: PiyasaKayitDurum;
  gelecekGarantiYok: true;
  not?: string;
};

export type PiyasaDepoDurum = {
  sonYenileme: string | null;
  yenilemeSonuc: 'manuel_only' | 'gömülü_ok' | 'önbellek_ok' | 'bayat' | 'hata' | null;
  uyari: string[];
};

const GOMULU: PiyasaFiyatKaydi[] = [
  {
    id: 'tobb-edirne-kasaplik-kuzu',
    kategori: 'canli_kg',
    bolge: 'edirne_tobb',
    etiket: 'Kasaplık kuzu (canlı)',
    deger: 397.38,
    min: 374.8,
    max: 414,
    birim: 'TL/kg',
    islemTarihi: '2026-11-02',
    alinmaTarihi: '2026-11-08',
    kaynakAd: 'TOBB Edirne borsa',
    kaynakUrl: 'http://borsa.tobb.org.tr/fiyat_urun3.php?alt_kod=108&ana_kod=13',
    durum: 'gömülü',
    gelecekGarantiYok: true,
    not: 'Kasaplık kuzu ortalama; Balıkesir değil',
  },
  {
    id: 'ukon-karkas-yagsiz-kuzu',
    kategori: 'karkas_kg',
    bolge: 'ukon',
    etiket: 'Yağsız kuzu karkası',
    deger: 615,
    min: 555,
    max: 700,
    birim: 'TL/kg',
    islemTarihi: '2026-11-05',
    alinmaTarihi: '2026-11-08',
    kaynakAd: 'UKON',
    kaynakUrl: 'https://www.ukon.org.tr/fiyatlar',
    durum: 'gömülü',
    gelecekGarantiYok: true,
    not: 'Bölgesel aralık 555–700',
  },
  {
    id: 'balikesir-kuzu-canli-kg-agustos2026',
    kategori: 'canli_kg',
    bolge: 'balikesir',
    etiket: 'KUZU CANLI KG (borsa bülteni)',
    deger: 351.052,
    min: 333.11,
    max: 400.01,
    birim: 'TL/kg',
    islemTarihi: '2026-08-31',
    alinmaTarihi: '2026-11-08',
    kaynakAd: 'Balıkesir TB Ağustos 2026 bülteni (HMS satırı)',
    kaynakUrl: 'https://www.balikesirborsa.org.tr/panel/upload/bultenler/8-agustos.pdf',
    durum: 'gömülü',
    gelecekGarantiYok: true,
    not: '8 Kas günlük TOBB çekimi yok — en yakın resmi aylık bülten Ağustos 2026',
  },
  {
    id: 'balikesir-kuzu-kemikli-eylul2026',
    kategori: 'karkas_kg',
    bolge: 'balikesir',
    etiket: 'KUZU ETİ (KEMİKLİ) kg',
    deger: 717.37,
    min: 559.18,
    max: 940,
    birim: 'TL/kg',
    islemTarihi: '2026-09-30',
    alinmaTarihi: '2026-11-08',
    kaynakAd: 'Balıkesir TB Eylül 2026 bülteni (HMS)',
    kaynakUrl: 'https://www.balikesirborsa.org.tr/panel/upload/bultenler/9-eylul.pdf',
    durum: 'gömülü',
    gelecekGarantiYok: true,
    not: 'Kemikli et kg — UKON yağsız karkas ile aynı kategori değil',
  },
];

const KEY = 'sy_besi_piyasa_kayit_v1';

/** Otomatik TOBB/HTML parse yok */
export const PIYASA_YENILEME_SONUC: PiyasaDepoDurum['yenilemeSonuc'] = 'manuel_only';

export function gomuluPiyasaKayitlari(): PiyasaFiyatKaydi[] {
  return GOMULU.map((k) => ({ ...k }));
}

export function piyasaKayitOku(): { kayitlar: PiyasaFiyatKaydi[]; depo: PiyasaDepoDurum } {
  if (typeof localStorage === 'undefined') {
    return {
      kayitlar: gomuluPiyasaKayitlari(),
      depo: { sonYenileme: null, yenilemeSonuc: 'gömülü_ok', uyari: ['Önbellek yok — gömülü referans'] },
    };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return {
        kayitlar: gomuluPiyasaKayitlari(),
        depo: { sonYenileme: null, yenilemeSonuc: 'gömülü_ok', uyari: [] },
      };
    }
    const p = JSON.parse(raw) as { kayitlar?: PiyasaFiyatKaydi[]; depo?: PiyasaDepoDurum };
    const merged = birlestirGomulu(p.kayitlar ?? []);
    return {
      kayitlar: merged,
      depo: p.depo ?? { sonYenileme: null, yenilemeSonuc: 'önbellek_ok', uyari: [] },
    };
  } catch {
    return {
      kayitlar: gomuluPiyasaKayitlari(),
      depo: { sonYenileme: null, yenilemeSonuc: 'hata', uyari: ['Önbellek okunamadı — gömülüye dönüldü'] },
    };
  }
}

function birlestirGomulu(ozel: PiyasaFiyatKaydi[]): PiyasaFiyatKaydi[] {
  const byId = new Map<string, PiyasaFiyatKaydi>();
  for (const g of gomuluPiyasaKayitlari()) byId.set(g.id, g);
  for (const o of ozel) {
    const mevcut = byId.get(o.id);
    if (!mevcut) {
      byId.set(o.id, o);
      continue;
    }
    /** Geçmiş gömülü işlem tarihi silinmez — yalnızca manuel yeni sürüm eklenir */
    if (o.durum === 'manuel' || o.alinmaTarihi > mevcut.alinmaTarihi) byId.set(o.id, { ...mevcut, ...o });
  }
  return [...byId.values()];
}

/** Güvenli otomatik TOBB çekimi yok — yalnızca gömülü tabloyu tarihler. */
export async function piyasaReferansYenile(): Promise<{ kayitlar: PiyasaFiyatKaydi[]; depo: PiyasaDepoDurum }> {
  const now = new Date().toISOString().slice(0, 10);
  const depo: PiyasaDepoDurum = {
    sonYenileme: now,
    yenilemeSonuc: 'manuel_only',
    uyari: [
      'Canlı borsa parse edilmiyor — gömülü/önbellek veya manuel içe aktarma kullanın.',
      '0 fiyata düşülmez; Balıkesir doğrulanmadan null kalır.',
    ],
  };
  const kayitlar = gomuluPiyasaKayitlari();
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify({ kayitlar, depo }));
  }
  return { kayitlar, depo };
}

export function piyasaManuelIceAktar(yeni: PiyasaFiyatKaydi): { kayitlar: PiyasaFiyatKaydi[]; depo: PiyasaDepoDurum } {
  const { kayitlar } = piyasaKayitOku();
  const z = { ...yeni, durum: 'manuel' as const };
  const next = birlestirGomulu([...kayitlar.filter((k) => k.id !== z.id), z]);
  const depo: PiyasaDepoDurum = {
    sonYenileme: z.alinmaTarihi,
    yenilemeSonuc: 'önbellek_ok',
    uyari: ['Manuel içe aktarma — URL ve tarihi kontrol edin'],
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify({ kayitlar: next, depo }));
  }
  return { kayitlar: next, depo };
}

export function piyasaKaydiBul(id: string): PiyasaFiyatKaydi | undefined {
  return piyasaKayitOku().kayitlar.find((k) => k.id === id);
}
