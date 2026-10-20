/** Kuzu fotoğraf galerisi — saf yardımcılar */
export type FotoEtiket = 'genel' | 'saglik' | 'tartim' | 'dogum' | 'kupe';

export type FotoKaydi = {
  id: string;
  animalId: string;
  /** Çekim / ekleme zamanı (ISO) */
  tarih: string;
  etiket: FotoEtiket;
  not?: string;
  en: number;
  boy: number;
  bayt: number;
  /** Geri dönüşüm kutusunda ise silinme zamanı */
  silindi?: string;
  /** native: dosya yolu; web: IndexedDB anahtarı = id */
  uri?: string;
};

export const FOTO_ETIKET: Record<FotoEtiket, string> = {
  genel: 'Genel',
  saglik: 'Sağlık / yara',
  tartim: 'Tartım / kondisyon',
  dogum: 'Doğum',
  kupe: 'Küpe / kimlik',
};

export const TAM_EN_COK = 1600;
export const KUCUK_EN_COK = 320;
export const HAYVAN_BASI_EN_COK = 60;
export const COP_GUN = 30;

/** Oranı koruyarak en uzun kenarı en çok `maks` piksele indirir (büyütmez) */
export function olcekle(en: number, boy: number, maks: number): { en: number; boy: number } {
  if (!(en > 0) || !(boy > 0)) return { en: 0, boy: 0 };
  const k = Math.min(1, maks / Math.max(en, boy));
  return { en: Math.max(1, Math.round(en * k)), boy: Math.max(1, Math.round(boy * k)) };
}

/** Görünen fotoğraflar: silinmemiş, yeni → eski */
export function gorunenler(l: FotoKaydi[], animalId?: string): FotoKaydi[] {
  return l
    .filter((f) => !f.silindi && (!animalId || f.animalId === animalId))
    .sort((a, b) => b.tarih.localeCompare(a.tarih) || b.id.localeCompare(a.id));
}

/** Kutuda 30 günü dolan (kalıcı silinecek) fotoğraflar */
export function suresiDolanlar(l: FotoKaydi[], simdi = Date.now()): FotoKaydi[] {
  return l.filter((f) => f.silindi && simdi - Date.parse(f.silindi) > COP_GUN * 86400000);
}

export function kapasiteHatasi(l: FotoKaydi[], animalId: string): string | null {
  return gorunenler(l, animalId).length >= HAYVAN_BASI_EN_COK ? `Bir kuzuya en çok ${HAYVAN_BASI_EN_COK} fotoğraf eklenir; eskileri sil.` : null;
}

export function boyutMetni(bayt: number): string {
  if (bayt < 1024) return `${bayt} B`;
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`;
  return `${(bayt / 1024 / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} MB`;
}

/** Gün başlıklı gruplar (galeri görünümü) */
export function gunlereBol(l: FotoKaydi[]): { gun: string; fotolar: FotoKaydi[] }[] {
  const m = new Map<string, FotoKaydi[]>();
  for (const f of l) {
    const g = f.tarih.slice(0, 10);
    m.set(g, [...(m.get(g) ?? []), f]);
  }
  return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([gun, fotolar]) => ({ gun, fotolar }));
}

/** Tam ekran gezinme: sınırda durur */
export function komsu(l: FotoKaydi[], id: string, yon: 1 | -1): FotoKaydi | null {
  const i = l.findIndex((f) => f.id === id);
  if (i < 0) return null;
  return l[i + yon] ?? null;
}
