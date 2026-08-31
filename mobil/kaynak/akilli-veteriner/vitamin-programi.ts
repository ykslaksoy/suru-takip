/**
 * Vitamin / destek listesi — açıklama önde, ürün adı parantezde küçük.
 */

export type VitaminUygulama = 'igne' | 'oral' | 'yem';

export type VitaminKalemi = {
  id: string;
  /** İğne / ürün adı — parantez içinde küçük */
  ad: string;
  /** Açıklama — ne işe yarar (büyük gösterim) */
  detay: string;
  uygulama: VitaminUygulama;
  /**
   * Hayvan başına sabit ml (iğne / oral).
   * null = yem karışımı / adet / etikete bak
   */
  mlHayvan: number | null;
  /** mlHayvan null iken veya ek açıklama */
  dozNotu?: string;
  /** Ne zaman kullanılır */
  neZaman: string;
  /** Stok eşleşmesi */
  stokAnahtarlar: string[];
  /** false → görevde yalnızca planlı (acil/sırada değil) */
  oncelikli?: boolean;
};

/** Görev listesinde acil/sırada sayılır mı (varsayılan: evet) */
export function vitaminGorevOncelikliMi(programId: string): boolean {
  const v = VITAMIN_PROGRAMI.find((x) => x.id === programId);
  return v?.oncelikli !== false;
}

/** Ekranda "sabit 2 ml" / "yeme karışım" */
export function vitaminDozEtiketi(v: VitaminKalemi): string {
  if (v.mlHayvan != null) {
    const ml = String(v.mlHayvan).replace('.', ',');
    return `sabit ${ml} ml`;
  }
  return v.dozNotu ?? 'etikete bak';
}

export function vitaminTipEtiket(u: VitaminUygulama): string {
  if (u === 'igne') return 'iğne';
  if (u === 'oral') return 'ağızdan';
  return 'yeme';
}

/**
 * Sık kullanılan vitamin / mineral / destekler.
 * ml = hayvan başına tipik uygulama (kuzu / küçük koyun referansı).
 */
export const VITAMIN_PROGRAMI: VitaminKalemi[] = [
  {
    id: 'ad3e',
    ad: 'A-D3-E',
    detay: 'Göz · kemik · üreme',
    uygulama: 'igne',
    mlHayvan: 2,
    dozNotu: 'Kuzu 1–2 ml · koyun 2–5 ml (etiket)',
    neZaman: 'Kış, kapalı besi, gebe / emziren, zayıf hayvan',
    stokAnahtarlar: ['a-d3-e', 'ad3e', 'vitamin a', 'a d3 e'],
  },
  {
    id: 'b-kompleks',
    ad: 'B kompleks',
    detay: 'İştah · stres · toparlanma',
    uygulama: 'igne',
    mlHayvan: 2,
    dozNotu: 'Kuzu 1–2 ml · koyun 3–5 ml',
    neZaman: 'İştahsızlık, stres, hastalık sonrası, nakil',
    stokAnahtarlar: ['b kompleks', 'b vitamin', 'vitamin b'],
  },
  {
    id: 'selen-e',
    ad: 'Selenyum + E',
    detay: 'Kas · beyaz kas hastalığı',
    uygulama: 'igne',
    mlHayvan: 1,
    dozNotu: 'Ürüne göre kg hesabı olabilir — etikete bak',
    neZaman: 'Eksiklik bölgesi, zayıf kuzu, kas titremesi şüphesi',
    stokAnahtarlar: ['selen', 'selenyum', 'e vitamin'],
  },
  {
    id: 'e-vitamin',
    ad: 'E vitamini',
    detay: 'Antioksidan · bağışıklık',
    uygulama: 'igne',
    mlHayvan: 2,
    neZaman: 'Stres, üreme dönemi, eksiklik şüphesi',
    stokAnahtarlar: ['e vitamin', 'tokoferol'],
  },
  {
    id: 'c-vitamin',
    ad: 'C vitamini',
    detay: 'Destek · stres',
    uygulama: 'igne',
    mlHayvan: 2,
    neZaman: 'Ağır stres, toparlanma (vet önerisiyle)',
    stokAnahtarlar: ['c vitamin', 'askorbik'],
  },
  {
    id: 'kalsiyum',
    ad: 'Kalsiyum',
    detay: 'Boroglukonat · süt humması',
    uygulama: 'igne',
    mlHayvan: 50,
    dozNotu: 'Yetişkin koyun — vet talimatı şart',
    neZaman: 'Doğum sonrası düşme, süt humması şüphesi',
    stokAnahtarlar: ['kalsiyum', 'boroglukonat'],
  },
  {
    id: 'glukoz',
    ad: 'Glukoz',
    detay: 'Enerji · zayıf kuzu',
    uygulama: 'oral',
    mlHayvan: 50,
    dozNotu: 'Kuzu ağızdan; iğne formu vet ile',
    neZaman: 'Zayıf / emmeyen kuzu, enerji düşüklüğü',
    stokAnahtarlar: ['glukoz', 'dekstroz'],
  },
  {
    id: 'elektrolit',
    ad: 'Elektrolit',
    detay: 'Sıvı · ishal desteği',
    uygulama: 'oral',
    mlHayvan: 500,
    dozNotu: 'Paketli ürün: etiketteki suya karıştır',
    neZaman: 'İshal, sıvı kaybı, sıcak stres',
    stokAnahtarlar: ['elektrolit', 'ishal destek', 'diyare'],
  },
  {
    id: 'kolostrum',
    ad: 'Kolostrum',
    detay: 'İlk süt · bağışıklık',
    uygulama: 'oral',
    mlHayvan: 250,
    dozNotu: 'Doğumdan sonra 2 saat içinde',
    neZaman: 'Yeni doğan kuzu — emmezse biberon',
    stokAnahtarlar: ['kolostrum', 'süt toz', 'ikame'],
  },
  {
    id: 'probiyotik',
    ad: 'Probiyotik',
    detay: 'Rumen / sindirim',
    uygulama: 'oral',
    mlHayvan: null,
    dozNotu: 'Pakete göre — genelde yeme / suya',
    neZaman: 'İshal sonrası, yem değişimi, antibiyotik sonrası',
    stokAnahtarlar: ['probiyotik', 'maya', 'rumen'],
  },
  {
    id: 'premiks',
    ad: 'Vitamin-mineral premiks',
    detay: 'Günlük yem takviyesi',
    uygulama: 'yem',
    mlHayvan: null,
    dozNotu: 'Yeme karışım — kg yem başına etiket',
    neZaman: 'Sürekli rasyon; özellikle kapalı besi',
    stokAnahtarlar: ['premiks', 'vitamin-mineral'],
  },
  {
    id: 'mineral-yalama',
    ad: 'Mineral yalama',
    detay: 'Serbest yalama taşı',
    uygulama: 'yem',
    mlHayvan: null,
    dozNotu: 'Padoka bırak — adet',
    neZaman: 'Sürekli erişim; eksiklik bölgelerinde',
    stokAnahtarlar: ['yalama', 'mineral taş', 'tuz'],
  },
];
