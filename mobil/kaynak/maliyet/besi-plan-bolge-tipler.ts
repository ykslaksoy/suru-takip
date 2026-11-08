/** t362u — işletme ili/bölge taslak; ırk ve kökenden bağımsız. */

import type { PiyasaSatisKaynak } from './besi-plan-piyasa-kaynak';

/** UKON haftalık tablosundaki 7 makro bölge — il değil, kesimhane ortalaması */
export type UkonMakroBolge =
  | 'ege'
  | 'marmara'
  | 'akdeniz'
  | 'ic_anadolu'
  | 'dogu_anadolu'
  | 'guneydogu'
  | 'karadeniz';

export const UKON_MAKRO_ETIKET: Record<UkonMakroBolge, string> = {
  ege: 'UKON — Ege (karkas)',
  marmara: 'UKON — Marmara (karkas)',
  akdeniz: 'UKON — Akdeniz (karkas)',
  ic_anadolu: 'UKON — İç Anadolu (karkas)',
  dogu_anadolu: 'UKON — Doğu Anadolu (karkas)',
  guneydogu: 'UKON — Güneydoğu (karkas)',
  karadeniz: 'UKON — Karadeniz (karkas)',
};

export function ukonKaynakFromMakro(b: UkonMakroBolge): PiyasaSatisKaynak {
  const m: Record<UkonMakroBolge, PiyasaSatisKaynak> = {
    ege: 'ukon_ege',
    marmara: 'ukon_marmara',
    akdeniz: 'ukon_akdeniz',
    ic_anadolu: 'ukon_ic_anadolu',
    dogu_anadolu: 'ukon_dogu_anadolu',
    guneydogu: 'ukon_guneydogu',
    karadeniz: 'ukon_karadeniz',
  };
  return m[b];
}

export type IsletmeBolgeTaslak = {
  /** Kullanıcı il/ilçe — resmi borsa zorunlu değil */
  ilEtiket: string;
  /** UKON karkas karşılaştırması için öneri; otomatik satış kaynağı değiştirmez */
  ukonMakroOneri: UkonMakroBolge | null;
  /** Plan satış fiyat kaynağı (ırktan ayrı) */
  satisKaynak: PiyasaSatisKaynak;
  /**
   * `kullanici_senaryo` veya `kullanici_bolge_fiyat` için ₺/kg;
   * boş = hesaplanmaz (0 sayılmaz).
   */
  kullaniciSatisKg: number | null;
};

export function varsayilanBolgeTaslak(): IsletmeBolgeTaslak {
  return {
    ilEtiket: '',
    ukonMakroOneri: null,
    satisKaynak: 'edirne_tobb',
    kullaniciSatisKg: null,
  };
}

/** İl adına göre yalnızca UI önerisi — sessiz varsayılan değiştirme yok */
export function ilIcinOneriler(il: string): { ukon: UkonMakroBolge | null; not: string[] } {
  const t = il
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ı/g, 'i');
  const not: string[] = [];
  if (!t) return { ukon: null, not: ['İl girilince UKON/borsa önerisi gösterilir — otomatik seçilmez.'] };

  const ege = ['balikesir', 'izmir', 'manisa', 'aydin', 'denizli', 'mugla', 'afyon', 'kutahya', 'usak'];
  const marmara = ['istanbul', 'tekirdag', 'edirne', 'kirklareli', 'bursa', 'kocaeli', 'sakarya', 'yalova', 'canakkale'];
  const akdeniz = ['antalya', 'adana', 'mersin', 'hatay', 'isparta', 'burdur', 'kahramanmaras', 'osmaniye'];
  const ic = ['ankara', 'konya', 'kayseri', 'eskisehir', 'sivas', 'yozgat', 'nigde', 'aksaray', 'kirikkale'];
  const dogu = ['erzurum', 'van', 'agri', 'kars', 'erzincan', 'malatya', 'elazig', 'bingol', 'mus'];
  const guneydogu = ['gaziantep', 'sanliurfa', 'diyarbakir', 'mardin', 'batman', 'siirt', 'sirnak', 'kilis', 'adiyaman'];
  const kara = ['samsun', 'trabzon', 'ordu', 'giresun', 'rize', 'artvin', 'kastamonu', 'sinop', 'amasya', 'tokat', 'zonguldak'];

  let ukon: UkonMakroBolge | null = null;
  if (ege.some((x) => t.includes(x))) ukon = 'ege';
  else if (marmara.some((x) => t.includes(x))) ukon = 'marmara';
  else if (akdeniz.some((x) => t.includes(x))) ukon = 'akdeniz';
  else if (ic.some((x) => t.includes(x))) ukon = 'ic_anadolu';
  else if (dogu.some((x) => t.includes(x))) ukon = 'dogu_anadolu';
  else if (guneydogu.some((x) => t.includes(x))) ukon = 'guneydogu';
  else if (kara.some((x) => t.includes(x))) ukon = 'karadeniz';

  if (ukon) not.push(`Öneri: ${UKON_MAKRO_ETIKET[ukon]} — il≠borsa; canlı/kg ile karıştırmayın.`);
  if (t.includes('balikesir')) {
    not.push('Balıkesir canlı: son gömülü Ağu 2026 bülteni — Kasım günlük TOBB yok.');
    not.push('Balıkesir ≠ Edirne; başka il fiyatı yerine geçirilmez.');
  }
  if (t.includes('gaziantep')) not.push('TOBB Gaziantep ot kuzusu — Edirne ile aynı değil.');
  if (!ukon) not.push('Bu il için UKON makro eşleşmesi yok — karkas için ukon_ortalama veya kullanıcı fiyatı.');

  return { ukon, not };
}
