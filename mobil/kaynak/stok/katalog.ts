import type { StockType } from '@/kaynak/cekirdek/tipler';

export type StokKatalogKalemi = {
  id: string;
  ad: string;
  type: StockType;
  birim: string;
  minMiktar: number;
  aciklama: string;
};

function k(
  id: string,
  ad: string,
  type: StockType,
  birim: string,
  minMiktar: number,
  aciklama: string
): StokKatalogKalemi {
  return { id, ad, type, birim, minMiktar, aciklama };
}

/** Yemler — koyun/kuzu besisinde sık kullanılanlar */
export const YEM_KATALOGU: StokKatalogKalemi[] = [
  k('arpa-kirmasi', 'Arpa kırması', 'feed', 'kg', 200, 'Enerji yemi'),
  k('arpa-tam', 'Arpa (tam tane)', 'feed', 'kg', 150, 'Kesif yem'),
  k('bugday-kirmasi', 'Buğday kırması', 'feed', 'kg', 150, 'Enerji'),
  k('misir-kirmasi', 'Mısır kırması', 'feed', 'kg', 150, 'Enerji'),
  k('yulaf', 'Yulaf', 'feed', 'kg', 100, 'Lif + enerji'),
  k('kepek-bugday', 'Buğday kepeği', 'feed', 'kg', 80, 'Lif'),
  k('kepek-pirinc', 'Pirinç kepeği', 'feed', 'kg', 50, 'Yan ürün'),
  k('soya-kuspesi', 'Soya küspesi', 'feed', 'kg', 50, 'Protein'),
  k('aycicek-kuspesi', 'Ayçiçek küspesi', 'feed', 'kg', 50, 'Protein'),
  k('pamuk-kuspesi', 'Pamuk tohumu küspesi', 'feed', 'kg', 40, 'Protein — dikkatli'),
  k('yonca-kuru', 'Yonca kuru ot', 'feed', 'kg', 100, 'Kaba yem / protein'),
  k('yonca-pellet', 'Yonca peleti', 'feed', 'kg', 80, 'Kolay depolama'),
  k('fiğ', 'Fiğ', 'feed', 'kg', 40, 'Baklagil kaba yem'),
  k('saman-bugday', 'Buğday samanı', 'feed', 'kg', 200, 'Kaba yem'),
  k('saman-arpa', 'Arpa samanı', 'feed', 'kg', 150, 'Kaba yem'),
  k('silaj-misir', 'Mısır silajı', 'feed', 'kg', 300, 'Sulu kaba yem'),
  k('silaj-yonca', 'Yonca silajı', 'feed', 'kg', 200, 'Sulu kaba yem'),
  k('seker-pancari-posasi', 'Şeker pancarı posası', 'feed', 'kg', 100, 'Enerji yan ürün'),
  k('melas-yem', 'Melaslı yem karışımı', 'feed', 'kg', 50, 'İştah açıcı'),
  k('fabrika-kuzu', 'Fabrika kuzu yemi', 'feed', 'kg', 100, 'Hazır rasyon'),
  k('fabrika-koyun', 'Fabrika koyun yemi', 'feed', 'kg', 100, 'Hazır rasyon'),
  k('sut-toz', 'Süt tozu / ikame', 'feed', 'kg', 10, 'Erken kuzu'),
];

/** Takviye gıdalar */
export const TAKVIYE_KATALOGU: StokKatalogKalemi[] = [
  k('mineral-yalama', 'Mineral yalama taşı', 'supplement', 'adet', 2, 'Serbest yalama'),
  k('tuz', 'Hayvan tuzu', 'supplement', 'kg', 10, 'Serbest / rasyon'),
  k('tuz-iyotlu', 'İyotlu tuz', 'supplement', 'kg', 10, 'İyot takviyesi'),
  k('premiks', 'Vitamin-mineral premiks', 'supplement', 'kg', 5, 'Yeme karışım'),
  k('melas', 'Melas', 'supplement', 'kg', 20, 'Enerji / iştah'),
  k('selen-e', 'Selenyum + E vitamini', 'supplement', 'ml', 100, 'Eksiklik bölgelerinde'),
  k('probiyotik', 'Probiyotik / rumen mayası', 'supplement', 'kg', 2, 'Sindirim'),
  k('soda', 'Sodyum bikarbonat (soda)', 'supplement', 'kg', 5, 'Asidoz tamponu'),
  k('kirec', 'Kalsiyum / kireç taşı', 'supplement', 'kg', 10, 'Kemik / süt'),
  k('fosfor', 'Fosfor kaynağı (DCP)', 'supplement', 'kg', 5, 'Mineral'),
  k('magnezyum', 'Magnezyum oksit', 'supplement', 'kg', 3, 'Çayır tetanisi'),
  k('cinko', 'Çinko sülfat', 'supplement', 'kg', 2, 'Deri / tırnak'),
  k('bakir', 'Bakır sülfat', 'supplement', 'kg', 1, 'Dikkatli doz'),
  k('kobalt', 'Kobalt takviyesi', 'supplement', 'g', 50, 'B12 desteği'),
  k('vitamin-ad3e', 'Vitamin A-D3-E', 'supplement', 'ml', 200, 'Enjeksiyon / oral'),
  k('vitamin-b', 'B kompleks vitamin', 'supplement', 'ml', 100, 'İştah / stres'),
  k('omega', 'Bitkisel yağ / yağ asidi', 'supplement', 'kg', 10, 'Enerji yoğun'),
  k('mayasarma', 'Maya / fermantasyon ürünü', 'supplement', 'kg', 3, 'Rumen sağlığı'),
];

/** İlaçlar — yaygın kullanım (reçete / vet önerisiyle) */
export const ILAC_KATALOGU: StokKatalogKalemi[] = [
  k('albendazol', 'Albendazol', 'medicine', 'flakon', 5, 'İç parazit'),
  k('ivermectin', 'İvermektin', 'medicine', 'ml', 100, 'İç-dış parazit'),
  k('doramectin', 'Doramektin', 'medicine', 'ml', 50, 'Parazit'),
  k('levamizol', 'Levamizol', 'medicine', 'ml', 50, 'İç parazit'),
  k('oksiklozanid', 'Oksiklozanid', 'medicine', 'ml', 50, 'Karaciğer kelebeği'),
  k('triklabendazol', 'Triklabendazol', 'medicine', 'ml', 50, 'Kelebek'),
  k('oksiteirasiklin', 'Oksitetrasiklin', 'medicine', 'ml', 50, 'Antibiyotik'),
  k('penisilin', 'Penisilin', 'medicine', 'flakon', 10, 'Antibiyotik'),
  k('enrofloksasin', 'Enrofloksasin', 'medicine', 'ml', 50, 'Antibiyotik'),
  k('florfenikol', 'Florfenikol', 'medicine', 'ml', 50, 'Solunum'),
  k('meloksikam', 'Meloksikam', 'medicine', 'ml', 30, 'Ağrı / ateş'),
  k('fluniksin', 'Fluniksin meglumin', 'medicine', 'ml', 30, 'Antiinflamatuar'),
  k('deksametazon', 'Deksametazon', 'medicine', 'ml', 20, 'Kortikosteroid'),
  k('oksitosin', 'Oksitosin', 'medicine', 'ml', 20, 'Doğum'),
  k('kalsiyum-boroglukonat', 'Kalsiyum boroglukonat', 'medicine', 'flakon', 5, 'Süt humması'),
  k('glukoz', 'Glukoz solüsyonu', 'medicine', 'flakon', 5, 'Enerji / destek'),
  k('yara-spreyi', 'Yara spreyi / antiseptik', 'medicine', 'adet', 3, 'Yara bakımı'),
  k('goz-merhemi', 'Göz merhemi', 'medicine', 'tüp', 3, 'Göz enfeksiyonu'),
  k('ayak-banyosu', 'Ayak banyosu solüsyonu', 'medicine', 'lt', 5, 'Ayak çürüğü'),
  k('diyare', 'İshal destek (elektrolit)', 'medicine', 'paket', 10, 'Sıvı-elektrolit'),
];

/** Aşılar — ASI_PROGRAMI ile uyumlu; doz hayvan başına sabit ml */
export const ASI_KATALOGU: StokKatalogKalemi[] = [
  k('karma', 'Karma aşı (klostridiyal + pastörella)', 'vaccine', 'doz', 20, 'Sabit 2 ml'),
  k('clostridial', 'Clostridial aşı', 'vaccine', 'doz', 20, 'Sabit 2 ml'),
  k('enterotoksemi', 'Enterotoksemi aşısı', 'vaccine', 'doz', 10, 'Sabit 1 ml'),
  k('pasteurella', 'Pastörella aşısı', 'vaccine', 'doz', 10, 'Sabit 2 ml'),
  k('septisemi', 'Septisemi aşısı', 'vaccine', 'doz', 10, 'Sabit 2 ml'),
  k('ektima', 'Ektima (ORF) aşısı', 'vaccine', 'doz', 10, 'Çizik (etiket)'),
  k('tetanos', 'Tetanoz toksoidi', 'vaccine', 'doz', 10, 'Sabit 1 ml'),
  k('ppr', 'PPR (koyun-keçi vebası)', 'vaccine', 'doz', 10, 'Sabit 1 ml'),
  k('cicek', 'Çiçek aşısı', 'vaccine', 'doz', 10, 'Sabit 0,5 ml'),
  k('sap', 'Şap aşısı', 'vaccine', 'doz', 10, 'Sabit 1 ml'),
  k('brusella', 'Brusella aşısı', 'vaccine', 'doz', 10, 'Sabit 1 ml'),
  k('sarbon', 'Şarbon aşısı', 'vaccine', 'doz', 10, 'Sabit 1 ml'),
  k('agalaksi', 'Agalaksi (süt kesen) aşısı', 'vaccine', 'doz', 10, 'Sabit 1 ml'),
  k('topallik', 'Topallık / ayak aşısı', 'vaccine', 'doz', 10, 'Sabit 2 ml'),
  k('parazit', 'Parazit programı', 'vaccine', 'doz', 10, "kg'ye göre ml"),
];

export const STOK_KATALOGU: StokKatalogKalemi[] = [
  ...YEM_KATALOGU,
  ...TAKVIYE_KATALOGU,
  ...ILAC_KATALOGU,
  ...ASI_KATALOGU,
];

export function katalogByType(type?: StockType | 'all'): StokKatalogKalemi[] {
  if (!type || type === 'all') return STOK_KATALOGU;
  return STOK_KATALOGU.filter((k) => k.type === type);
}

export function katalogAdNormalize(ad: string): string {
  return ad
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .trim();
}

export function katalogEsles(ad: string): StokKatalogKalemi | undefined {
  const n = katalogAdNormalize(ad);
  return STOK_KATALOGU.find(
    (k) => katalogAdNormalize(k.ad) === n || katalogAdNormalize(k.ad).includes(n) || n.includes(katalogAdNormalize(k.ad))
  );
}
