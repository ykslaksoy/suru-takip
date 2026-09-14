/**
 * Toplu kabul — «şuradan geldi» kaynakları + tekrar kullanılabilir listeler.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_CAMBAZ = 'sy_kabul_cambazlar_v1';
const KEY_CIFTLIK = 'sy_kabul_ciftlikler_v1';
const KEY_OZEL = 'sy_kabul_ozel_durumlar_v1';

export type KabulKaynakId = 'cambaz' | 'ciftlik' | 'pazar' | 'agilda_dogum' | 'ozel';

export type KabulKaynakSecenek = {
  id: KabulKaynakId;
  label: string;
  /** Seçilince istenen detay */
  detay?: 'cambaz' | 'ciftlik' | 'km' | 'ozel';
  ipucu?: string;
};

/** Sabit sıra: Cambaz → Çiftlik → Pazar → Ağılda doğum; özel durumlar «Ekle» ile */
export const KABUL_KAYNAK_SECENEKLER: KabulKaynakSecenek[] = [
  {
    id: 'cambaz',
    label: 'Cambaz',
    detay: 'cambaz',
    ipucu: 'Kimden alındı?',
  },
  {
    id: 'ciftlik',
    label: 'Çiftlik',
    detay: 'ciftlik',
    ipucu: 'Hangi çiftlik?',
  },
  {
    id: 'pazar',
    label: 'Pazar',
    detay: 'km',
    ipucu: 'Kaç km’den alındı?',
  },
  {
    id: 'agilda_dogum',
    label: 'Ağılda doğum',
  },
];

export type KabulKaynakDetay = {
  kaynak: KabulKaynakId;
  /** Cambaz adı / çiftlik adı / özel durum etiketi */
  deger?: string;
  /** Pazar: km */
  km?: number;
  /** Özel durum listesindeki etiket (ozel) */
  ozelEtiket?: string;
};

async function listeOku(key: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as string[];
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string' && x.trim()) : [];
  } catch {
    return [];
  }
}

async function listeYaz(key: string, list: string[]): Promise<void> {
  const temiz = [...new Set(list.map((x) => x.trim()).filter(Boolean))];
  await AsyncStorage.setItem(key, JSON.stringify(temiz.slice(0, 40)));
}

export async function getCambazListesi(): Promise<string[]> {
  return listeOku(KEY_CAMBAZ);
}

export async function addCambaz(ad: string): Promise<string[]> {
  const a = ad.trim();
  if (!a) return getCambazListesi();
  const list = await getCambazListesi();
  const next = [a, ...list.filter((x) => x.toLocaleLowerCase('tr-TR') !== a.toLocaleLowerCase('tr-TR'))];
  await listeYaz(KEY_CAMBAZ, next);
  return next;
}

export async function getCiftlikListesi(): Promise<string[]> {
  return listeOku(KEY_CIFTLIK);
}

export async function addCiftlik(ad: string): Promise<string[]> {
  const a = ad.trim();
  if (!a) return getCiftlikListesi();
  const list = await getCiftlikListesi();
  const next = [a, ...list.filter((x) => x.toLocaleLowerCase('tr-TR') !== a.toLocaleLowerCase('tr-TR'))];
  await listeYaz(KEY_CIFTLIK, next);
  return next;
}

export async function getOzelDurumListesi(): Promise<string[]> {
  return listeOku(KEY_OZEL);
}

export async function addOzelDurum(etiket: string): Promise<string[]> {
  const a = etiket.trim();
  if (!a) return getOzelDurumListesi();
  const list = await getOzelDurumListesi();
  const next = [a, ...list.filter((x) => x.toLocaleLowerCase('tr-TR') !== a.toLocaleLowerCase('tr-TR'))];
  await listeYaz(KEY_OZEL, next);
  return next;
}

/** Hayvan notes satırı — yapılandırılmış kaynak */
export function kaynakOzetMetni(d: KabulKaynakDetay): string {
  switch (d.kaynak) {
    case 'cambaz':
      return d.deger?.trim() ? `Kaynak: Cambaz — ${d.deger.trim()}` : 'Kaynak: Cambaz';
    case 'ciftlik':
      return d.deger?.trim() ? `Kaynak: Çiftlik — ${d.deger.trim()}` : 'Kaynak: Çiftlik';
    case 'pazar':
      return d.km != null && Number.isFinite(d.km)
        ? `Kaynak: Pazar — ${d.km} km’den alındı`
        : 'Kaynak: Pazar';
    case 'agilda_dogum':
      return 'Kaynak: Ağılda doğum';
    case 'ozel':
      return d.ozelEtiket?.trim()
        ? `Kaynak: ${d.ozelEtiket.trim()}`
        : d.deger?.trim()
          ? `Kaynak: ${d.deger.trim()}`
          : 'Kaynak: Özel';
    default:
      return 'Kaynak: —';
  }
}

export function kaynakUiEtiket(d: KabulKaynakDetay): string {
  switch (d.kaynak) {
    case 'cambaz':
      return d.deger?.trim() ? `Cambaz · ${d.deger.trim()}` : 'Cambaz';
    case 'ciftlik':
      return d.deger?.trim() ? `Çiftlik · ${d.deger.trim()}` : 'Çiftlik';
    case 'pazar':
      return d.km != null && Number.isFinite(d.km) ? `Pazar · ${d.km} km` : 'Pazar';
    case 'agilda_dogum':
      return 'Ağılda doğum';
    case 'ozel':
      return d.ozelEtiket?.trim() || d.deger?.trim() || 'Özel';
    default:
      return '—';
  }
}

/** Devam etmeden önce detay zorunlu mu / eksik mi */
export function kaynakDetayEksik(d: KabulKaynakDetay): string | null {
  if (d.kaynak === 'cambaz' && !d.deger?.trim()) return 'Cambaz adını yazın veya listeden seçin';
  if (d.kaynak === 'ciftlik' && !d.deger?.trim()) return 'Çiftlik adını yazın veya listeden seçin';
  if (d.kaynak === 'pazar') {
    if (d.km == null || !Number.isFinite(d.km) || d.km < 0) return 'Kaç km’den alındığını yazın';
  }
  if (d.kaynak === 'ozel' && !d.ozelEtiket?.trim() && !d.deger?.trim()) {
    return 'Durum adı yazın veya listeden seçin';
  }
  return null;
}
