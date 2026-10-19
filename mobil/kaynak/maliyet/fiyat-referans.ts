/**
 * Referans birim fiyat tablosu (tahmini fiyat kaynağı).
 *
 * Kural: Fiyatlar UYDURULMAZ. Her satır gerçek bir kaynaktan (borsa bülteni, Bakanlık döner sermaye listesi,
 * yem fabrikası / çiftlik market ilanı) alınmıştır; kaynak URL'si ve alınma tarihi yanındadır.
 * Kaynak bulunamayan kalemde fiyat = null → "fiyat eksik" listesine düşer, ekranda uyarı kalır.
 *
 * Şimdilik uygulamaya gömülü; ileride `getFiyatReferans()` uzak bir uç noktadan (ör. /api/fiyat-referans)
 * aynı şemayla (FiyatReferansTablosu) çekilebilir.
 */

export type ReferansFiyat = {
  /** Stok katalog id'si (kaynak/stok/katalog.ts) ya da serbest anahtar */
  id: string;
  ad: string;
  /** Fiyatın birimi (kg, doz, ml, adet …) — stok kalemi birimiyle uyumlu olmalı */
  birim: string;
  /** TL / birim; bulunamadıysa null */
  fiyat: number | null;
  /** Kaynak kısa adı (ekranda gösterilir) */
  kaynakAd: string | null;
  kaynakUrl: string | null;
  /** Kaynaktaki verinin tarihi (YYYY-AA-GG) */
  veriTarihi: string | null;
  /** Kısa açıklama: hangi kalem/ortalama alındı */
  not?: string;
  /** Stok adı eşleşmesi için ek kelimeler */
  anahtarlar?: string[];
};

export type FiyatReferansTablosu = {
  surum: string;
  /** Kaynakların toplandığı gün */
  alinmaTarihi: string;
  kalemler: ReferansFiyat[];
};

const ALINMA = '2026-10-19';

const BAKANLIK_DS =
  'https://www.tarimorman.gov.tr/DHDB/Duyuru/233/Doner-Sermaye-Isletmeleri-2026-Yili-Birim-Fiyat-Listeleri';
const BAKANLIK_AD = 'Tarım ve Orman Bak. 2026 döner sermaye (KDV hariç)';
const USK = 'https://ulusalsutkonseyi.org.tr/yemlerin-ortalama-fiyatlari/';
const USK_AD = 'Ulusal Süt Konseyi Eylül 2026 ort.';
const POLATLI = 'https://polatlicepte.com/tarim-borsasi/gunluk-fiyat-listesi';
const POLATLI_AD = 'Polatlı Ticaret Borsası';
const ADANA_GUN = 'https://adanatb.org.tr/wp-content/uploads/2026/10/14.10.2026.pdf';
const ADANA_GUN_AD = 'Adana Ticaret Borsası';

function r(
  id: string,
  ad: string,
  birim: string,
  fiyat: number | null,
  kaynakAd: string | null,
  kaynakUrl: string | null,
  veriTarihi: string | null,
  not?: string,
  anahtarlar?: string[],
): ReferansFiyat {
  return { id, ad, birim, fiyat, kaynakAd, kaynakUrl, veriTarihi, not, anahtarlar };
}

const yok = (id: string, ad: string, birim: string, anahtarlar?: string[]) =>
  r(id, ad, birim, null, null, null, null, 'Güvenilir güncel fiyat bulunamadı', anahtarlar);

export const FIYAT_REFERANS_TABLOSU: FiyatReferansTablosu = {
  surum: '2026-10-19',
  alinmaTarihi: ALINMA,
  kalemler: [
    // ── Yemler (kg) ──────────────────────────────────────────────
    r('arpa-tam', 'Arpa (tam tane)', 'kg', 15.03, POLATLI_AD, POLATLI, '2026-10-16', 'Arpa ağırlıklı ortalama 15.029 ₺/ton'),
    r('arpa-kirmasi', 'Arpa kırması', 'kg', 15.03, POLATLI_AD, POLATLI, '2026-10-16', 'Tane arpa borsa ortalaması (kırma işçiliği hariç)', ['arpa']),
    r('bugday-kirmasi', 'Buğday kırması', 'kg', 15.0, 'Bandırma Ticaret Borsası (TOBB)', 'http://borsa.tobb.org.tr/fiyat_borsa.php?borsakod=5BA20', '2026-10-05', 'Buğday yemlik kırmızı'),
    r('misir-kirmasi', 'Mısır kırması', 'kg', 15.36, ADANA_GUN_AD, ADANA_GUN, '2026-10-14', 'Tane mısır, tacir ortalaması', ['mısır', 'misir']),
    r('yulaf', 'Yulaf', 'kg', 16.76, POLATLI_AD, POLATLI, '2026-10-16', 'Yulaf (2. grup) ortalama'),
    r('kepek-bugday', 'Buğday kepeği', 'kg', 14.07, ADANA_GUN_AD, ADANA_GUN, '2026-10-14', 'Buğday kepeği ortalama', ['kepek']),
    yok('kepek-pirinc', 'Pirinç kepeği', 'kg'),
    r('soya-kuspesi', 'Soya küspesi', 'kg', 21.98, 'Adana Ticaret Borsası (Eylül aylık)', 'https://adanatb.org.tr/wp-content/uploads/2026/10/Eylul-2026-1.pdf', '2026-09-30', 'Aylık en az 20,36 – en çok 23,60 ₺/kg; orta değer', ['soya']),
    r('aycicek-kuspesi', 'Ayçiçek küspesi', 'kg', 12.79, ADANA_GUN_AD, ADANA_GUN, '2026-10-14', 'Ayçiçek küspesi ortalama', ['ayçiçek', 'aycicek']),
    yok('pamuk-kuspesi', 'Pamuk tohumu küspesi', 'kg'),
    r('yonca-kuru', 'Yonca kuru ot', 'kg', 12.91, USK_AD, USK, '2026-09-30', 'Yonca kuru otu Türkiye ortalaması', ['yonca']),
    yok('yonca-pellet', 'Yonca peleti', 'kg'),
    yok('fiğ', 'Fiğ', 'kg'),
    r('saman-bugday', 'Buğday samanı', 'kg', 4.38, USK_AD, USK, '2026-09-30', 'Saman Türkiye ortalaması', ['saman', 'kaba yem']),
    r('saman-arpa', 'Arpa samanı', 'kg', 4.38, USK_AD, USK, '2026-09-30', 'Saman Türkiye ortalaması (tür ayrımı yok)'),
    r('silaj-misir', 'Mısır silajı', 'kg', 4.9, USK_AD, USK, '2026-09-30', 'Mısır silajı Türkiye ortalaması', ['silaj']),
    yok('silaj-yonca', 'Yonca silajı', 'kg'),
    yok('seker-pancari-posasi', 'Şeker pancarı posası', 'kg'),
    yok('melas-yem', 'Melaslı yem karışımı', 'kg'),
    r('fabrika-kuzu', 'Fabrika kuzu yemi', 'kg', 18.76, 'Tarım Kredi fiyat listesi (Ağustos 2026)', 'https://www.tarimdanhaber.com/tarim-krediden-hayvancilik-yapan-ciftciye-yem-zammi-butun-liste-degisti', '2026-08-31', 'Kuzu büyütme yemi 938 ₺ / 50 kg', ['kuzu yemi', 'kuzu büyütme']),
    r('besi-yemi', 'Besi yemi', 'kg', 19.11, 'TZOB Eylül 2026 ort.', 'https://www.devletdestekli.com/tarim-kredi-yem-fiyatlari-2026-guncel-liste-50-kg-cuval/', '2026-09-30', 'Besi yemi 19.110 ₺/ton (TZOB girdi fiyatları)', ['besi yemi', 'besi', 'toklu']),
    r('fabrika-koyun', 'Fabrika koyun yemi', 'kg', 20.0, 'yemmarketim.com (Çöğenler)', 'https://yemmarketim.com/4-kuecuekbas-hayvan-yemleri', '2026-10-19', 'Koyun süt yemi 1.000 ₺ / 50 kg', ['koyun yemi']),
    yok('sut-toz', 'Süt tozu / ikame', 'kg'),

    // ── Takviyeler ───────────────────────────────────────────────
    r('mineral-yalama', 'Mineral yalama taşı', 'adet', 1500, 'idealciftlik.com (IdealBlock 25 kg)', 'https://www.idealciftlik.com/idealblock-yalama-kovasi', '2026-10-19', '25 kg mineral yalama kovası', ['yalama']),
    yok('tuz', 'Hayvan tuzu', 'kg'),
    r('selen-e', 'Selenyum + E vitamini', 'ml', 5.85, 'afsarogluciftlik.com (Vetaselenium AD3E 100 ml)', 'https://afsarogluciftlik.com/urun/vetaselenium-ad3e-koyun-keci-ve-buzagi-icin-vitamin-ve-selenyum-destegi-100-ml', '2026-10-19', '584,50 ₺ / 100 ml', ['selenyum', 'selen']),
    r('vitamin-ad3e', 'Vitamin A-D3-E', 'ml', 5.85, 'afsarogluciftlik.com (Vetaselenium AD3E 100 ml)', 'https://afsarogluciftlik.com/urun/vetaselenium-ad3e-koyun-keci-ve-buzagi-icin-vitamin-ve-selenyum-destegi-100-ml', '2026-10-19', '584,50 ₺ / 100 ml (selenyumlu AD3E)', ['ad3e']),

    // ── Aşılar (doz) ─────────────────────────────────────────────
    r('karma', 'Karma aşı', 'doz', 15, 'hayvansitesi.com (2026 piyasa)', 'https://www.hayvansitesi.com/kucukbas-hayvanlar/koyunlarda-9lu-karma-asi-ne-zaman-yapilir/', '2026-07-01', '9’lu karma: doz başı 10–20 ₺; orta değer', ['karma', '9lu', 'heptavac']),
    r('clostridial', 'Klostridiyal (Clostridial)', 'doz', 15, 'hayvansitesi.com (2026 piyasa)', 'https://www.hayvansitesi.com/kucukbas-hayvanlar/koyunlarda-9lu-karma-asi-ne-zaman-yapilir/', '2026-07-01', 'Klostridiyal karma aşı: doz başı 10–20 ₺; orta değer', ['clostridial', 'klostridiyal', 'klostridial']),
    r('ppr', 'Veba (PPR)', 'doz', 2.73, BAKANLIK_AD, BAKANLIK_DS, '2026-06-10', 'Pest-S Etvac PPR, koyun-keçi dozu', ['veba', 'ppr']),
    r('cicek', 'Çiçek', 'doz', 6.36, BAKANLIK_AD, BAKANLIK_DS, '2026-06-10', 'Penpox-M kuzu-oğlak dozu 0,5 ml (koyun dozu 12,73 ₺)', ['çiçek', 'cicek', 'penpox']),
    r('sap', 'Şap', 'doz', 7.73, BAKANLIK_AD, BAKANLIK_DS, '2026-06-10', 'TURVAC-OİL trivalan, koyun-keçi dozu', ['şap', 'sap']),
    r('brusella', 'Brusella', 'doz', 10.91, BAKANLIK_AD, BAKANLIK_DS, '2026-06-10', 'Brupen-M konjonktival, koyun-keçi dozu', ['brusella', 'brucella']),
    r('sarbon', 'Şarbon', 'doz', 3.64, BAKANLIK_AD, BAKANLIK_DS, '2026-06-10', 'ANT ETVAC, koyun dozu 0,5 ml', ['şarbon', 'sarbon', 'anthrax']),
    yok('pasteurella', 'Solunum (Pastörella)', 'doz', ['pastörella', 'pasteurella']),
    yok('enterotoksemi', 'Enterotoksemi (Çelertme)', 'doz', ['enterotoksemi', 'çelertme']),
    yok('septisemi', 'Septisemi', 'doz'),
    yok('ektima', 'Ektima (ORF)', 'doz'),
    yok('tetanos', 'Tetanoz', 'doz'),
    yok('agalaksi', 'Süt kesen (Agalaksi)', 'doz'),
    yok('topallik', 'Topallık (Ayak)', 'doz'),

    // ── İlaçlar (reçeteli; açık fiyat ilanı bulunamadı) ───────────
    yok('ivermectin', 'İvermektin', 'ml', ['ivermektin', 'ivermectin', 'ivomec']),
    yok('albendazol', 'Albendazol hap', 'adet', ['albendazol']),
    yok('doramectin', 'Doramektin', 'ml'),
    yok('levamizol', 'Levamizol', 'ml'),
    yok('oksiklozanid', 'Oksiklozanid', 'ml'),
    yok('triklabendazol', 'Triklabendazol', 'ml'),
    yok('oksiteirasiklin', 'Oksitetrasiklin', 'ml'),
    yok('penisilin', 'Penisilin', 'flakon'),

    // ── Ekipman (doğrulanmış fiyat yok) ───────────────────────────
    yok('asi-tabancasi', 'Otomatik aşı tabancası', 'adet', ['tabanca']),
    yok('tabanca-igne-ucu', 'Tabanca iğne ucu', 'adet', ['iğne ucu', 'igne ucu']),
    yok('siringa', 'Şırınga (tek kullanımlık)', 'adet', ['şırınga', 'siringa', 'enjektör']),
  ],
};

/** Canlı kuzu alış fiyatı referansı (parti alış fiyatı yoksa tahmin için) */
export const CANLI_KUZU_KG: ReferansFiyat = r(
  'canli-kuzu',
  'Canlı kuzu',
  'kg',
  350,
  'Keşan Ticaret Borsası',
  'https://www.kesantb.org.tr/',
  '2026-10-12',
  'Kuzu canlı 320–380 ₺/kg; orta değer',
);

export const FIYAT_REFERANS: ReferansFiyat[] = FIYAT_REFERANS_TABLOSU.kalemler;

/** Kaynağı bulunamayan kalemler — admin paneli yokken buradan izlenir */
export const FIYAT_EKSIK: { id: string; ad: string; birim: string }[] = FIYAT_REFERANS.filter((k) => k.fiyat == null).map(
  (k) => ({ id: k.id, ad: k.ad, birim: k.birim }),
);

/** İleride uzaktan çekilecek; şimdilik gömülü tablo döner. */
export async function getFiyatReferans(): Promise<FiyatReferansTablosu> {
  return FIYAT_REFERANS_TABLOSU;
}

/** "16.10.2026" */
export function referansTarihMetni(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
