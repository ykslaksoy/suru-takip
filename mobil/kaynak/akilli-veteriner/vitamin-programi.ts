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
   * null = yem karışımı / adet / ilacın kutusuna bak
   */
  mlHayvan: number | null;
  /** mlHayvan null iken veya ek açıklama */
  dozNotu?: string;
  /** Ne zaman kullanılır */
  neZaman: string;
  /** Stok eşleşmesi */
  stokAnahtarlar: string[];
  /**
   * Uygulama yeri — çoban dili: boyun deri altı, kas içi, ağızdan.
   */
  uygulamaYeri?: string;
  /** false → görevde yalnızca planlı (acil/sırada değil) */
  oncelikli?: boolean;
};

/** Görev listesinde acil/sırada sayılır mı (varsayılan: evet) */
export function vitaminGorevOncelikliMi(programId: string): boolean {
  const v = VITAMIN_PROGRAMI.find((x) => x.id === programId);
  return v?.oncelikli !== false;
}

/** Ekranda "Her kuzuya 2 ml" / "pakete göre" */
export function vitaminDozEtiketi(v: VitaminKalemi): string {
  if (v.mlHayvan != null) {
    const ml = String(v.mlHayvan).replace('.', ',');
    return `Her kuzuya ${ml} ml`;
  }
  return v.dozNotu ?? 'ilacın kutusuna bak';
}

/** Doz · (kaçıncı doz) · yer — çoban dili */
export function vitaminMlDozYerEtiketi(
  v: VitaminKalemi,
  opts?: { dozNo?: number; toplamDoz?: number },
): string {
  const parts = [vitaminDozEtiketi(v)];
  const dozNo = opts?.dozNo;
  const toplamDoz = opts?.toplamDoz;
  if (dozNo != null && toplamDoz != null && toplamDoz > 1) {
    parts.push(`${dozNo}. doz (${toplamDoz}’den)`);
  }
  if (v.uygulamaYeri) parts.push(v.uygulamaYeri);
  return parts.join(' · ');
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
    dozNotu: 'Her kuzuya 1–2 ml',
    neZaman: 'Kış, kapalı besi, gebe / emziren, zayıf hayvan',
    stokAnahtarlar: ['a-d3-e', 'ad3e', 'vitamin a', 'a d3 e'],
    uygulamaYeri: 'kas içi · boyun / omuz',
  },
  {
    id: 'b-kompleks',
    ad: 'B kompleks',
    detay: 'İştah · stres · toparlanma',
    uygulama: 'igne',
    mlHayvan: 2,
    dozNotu: 'Her kuzuya 1–2 ml',
    neZaman: 'İştahsızlık, stres, hastalık sonrası, nakil',
    stokAnahtarlar: ['b kompleks', 'b vitamin', 'vitamin b'],
    uygulamaYeri: 'kas içi · boyun / omuz',
  },
  {
    id: 'selen-e',
    ad: 'Selenyum-E',
    detay: 'Kas · beyaz kas · kilo alımı',
    uygulama: 'igne',
    mlHayvan: 1,
    dozNotu: 'Her kuzuya ~1 ml · fazla kaçırma',
    neZaman: 'Kapalı besi, eksiklik bölgesi, zayıf kuzu, kas / büyüme desteği',
    stokAnahtarlar: ['selen', 'selenyum', 'e vitamin'],
    uygulamaYeri: 'boyun deri altı',
  },
  {
    id: 'e-vitamin',
    ad: 'E vitamini',
    detay: 'Antioksidan · bağışıklık',
    uygulama: 'igne',
    mlHayvan: 2,
    neZaman: 'Stres, üreme dönemi, eksiklik şüphesi',
    stokAnahtarlar: ['e vitamin', 'tokoferol'],
    uygulamaYeri: 'kas içi',
  },
  {
    id: 'c-vitamin',
    ad: 'C vitamini',
    detay: 'Destek · stres',
    uygulama: 'igne',
    mlHayvan: 2,
    neZaman: 'Ağır stres, toparlanma (vet önerisiyle)',
    stokAnahtarlar: ['c vitamin', 'askorbik'],
    uygulamaYeri: 'kas içi',
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
    uygulamaYeri: 'deri altı · yavaş',
  },
  {
    id: 'glukoz',
    ad: 'Glukoz',
    detay: 'Enerji · zayıf kuzu',
    uygulama: 'oral',
    mlHayvan: 50,
    dozNotu: 'Ağızdan; iğne formu vet ile',
    neZaman: 'Zayıf / emmeyen kuzu, enerji düşüklüğü',
    stokAnahtarlar: ['glukoz', 'dekstroz'],
    uygulamaYeri: 'ağızdan',
  },
  {
    id: 'elektrolit',
    ad: 'Elektrolit',
    detay: 'Sıvı · ishal desteği',
    uygulama: 'oral',
    mlHayvan: 500,
    dozNotu: 'Paketi suya karıştır',
    neZaman: 'İshal, sıvı kaybı, sıcak stres',
    stokAnahtarlar: ['elektrolit', 'ishal destek', 'diyare'],
    uygulamaYeri: 'ağızdan',
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
    uygulamaYeri: 'ağızdan · biberon',
  },
  {
    id: 'probiyotik',
    ad: 'Probiyotik',
    detay: 'Rumen / sindirim',
    uygulama: 'oral',
    mlHayvan: null,
    dozNotu: 'pakete göre',
    neZaman: 'İshal sonrası, yem değişimi, antibiyotik sonrası',
    stokAnahtarlar: ['probiyotik', 'maya', 'rumen'],
    uygulamaYeri: 'ağızdan / yeme',
  },
  {
    id: 'premiks',
    ad: 'Premiks',
    detay: 'Rasyona vitamin-mineral',
    uygulama: 'yem',
    mlHayvan: null,
    dozNotu: 'yeme karışım',
    neZaman: 'Sürekli rasyon; özellikle kapalı besi',
    stokAnahtarlar: ['premiks', 'vitamin-mineral'],
    uygulamaYeri: 'yeme karışım',
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
    uygulamaYeri: 'padoka serbest yalama',
  },
];
