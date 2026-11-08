/**
 * Kullanıcı tablosundan gelen 8 senaryo adı — doğrulanmamış taslak.
 * Yem formülü / katkı etkisi uydurulmaz; rasyon motoruna bağlanmaz.
 */
export type BesiDiyetTaslak = {
  id: string;
  ad: string;
  dogrulandi: boolean;
  /** Tam faz reçetesi ve günlük alım girilmeden besleme aktive edilemez */
  eksikNot: string;
};

/** İsimler karşılaştırma etiketi; reçete verisi kullanıcıdan gelene kadar boş */
export const BESI_DIYET_TASLAKLARI: BesiDiyetTaslak[] = [
  { id: 'diyet-1', ad: 'Model 1 (taslak)', dogrulandi: false, eksikNot: 'Tam rasyon fazları girilmedi' },
  { id: 'diyet-2', ad: 'Model 2 (taslak)', dogrulandi: false, eksikNot: 'Tam rasyon fazları girilmedi' },
  { id: 'diyet-3', ad: 'Model 3 (taslak)', dogrulandi: false, eksikNot: 'Tam rasyon fazları girilmedi' },
  { id: 'diyet-4', ad: 'Model 4 (taslak)', dogrulandi: false, eksikNot: 'Tam rasyon fazları girilmedi' },
  { id: 'diyet-5', ad: 'Model 5 (taslak)', dogrulandi: false, eksikNot: 'Tam rasyon fazları girilmedi' },
  { id: 'diyet-6', ad: 'Model 6 (taslak)', dogrulandi: false, eksikNot: 'Tam rasyon fazları girilmedi' },
  { id: 'diyet-7', ad: 'Model 7 (taslak)', dogrulandi: false, eksikNot: 'Tam rasyon fazları girilmedi' },
  { id: 'diyet-8', ad: 'Model 8 (taslak)', dogrulandi: false, eksikNot: 'Tam rasyon fazları girilmedi' },
];

export function rasyonBeslemeAktifEdilebilirMi(taslak: BesiDiyetTaslak): { aktif: boolean; sebep: string } {
  if (!taslak.dogrulandi) {
    return {
      aktif: false,
      sebep: `${taslak.ad}: doğrulanmamış taslak — stok/rasyon tüketimi başlatılmaz.`,
    };
  }
  return { aktif: true, sebep: '' };
}

/** Aynı süre + aynı satış bazında karşılaştırma — yalnızca kullanıcı plan girdileri */
export function taslakDiyetKarsilastirmaUyarisi(hedefGun: number): string[] {
  return [
    `${hedefGun} gün karşılaştırması aynı besleme yöntemi varsayımıyla — farklı gün ağırlıkları kopyalanmaz.`,
    'Tablo gelir/yem rakamları doğrulanmış tahmin değil; burada otomatik doldurulmaz.',
    'Katkı maddeleri ek büyüme/karkas verimi üretmez (kanıt girilmedikçe).',
  ];
}
