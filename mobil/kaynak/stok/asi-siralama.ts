import type { StokListeSatiri } from './kullanim';
import { ASI_KATALOGU } from './katalog';

/** Resmi / destek programı — görünür sıralamada en sonda (tıbbi öncelik değil). */
export const DEVLET_PROGRAM_ASI_ID = new Set(['ppr', 'cicek', 'sap', 'brusella', 'sarbon']);

const KATALOG_SIRA = new Map<string, number>();
for (const k of ASI_KATALOGU) {
  KATALOG_SIRA.set(k.id, KATALOG_SIRA.size);
}

export function devletProgramAsiMi(satir: Pick<StokListeSatiri, 'type' | 'katalogId' | 'aciklama'>): boolean {
  if (satir.type !== 'vaccine') return false;
  if (satir.katalogId && DEVLET_PROGRAM_ASI_ID.has(satir.katalogId)) return true;
  const a = satir.aciklama.toLocaleLowerCase('tr-TR');
  return a.includes('devlet') || a.includes('vetbis');
}

/** Gerçek eldeki miktar — 0 kayıt «stokta var» sayılmaz (sıralama / gösterim). */
export function stoktaMiktarVar(satir: Pick<StokListeSatiri, 'item'>): boolean {
  const q = satir.item?.quantity ?? 0;
  return q > 0;
}

export function katalogSiraIndeksi(katalogId: string | null): number {
  if (!katalogId) return 50_000;
  const i = KATALOG_SIRA.get(katalogId);
  return i ?? 40_000;
}

/**
 * Görünür liste sırası: çift sayım yok — yalnız sıralama.
 * Aşı: çiftlik (devlet dışı) → kullanım skoru → katalog → ad; devlet grubu sonda (kullanım yüksek olsa bile).
 * Diğer tipler: kullanım → katalog → ad; «stok kaydı var» tek başına üste itmez.
 */
export function karsilastirStokSatirlari(a: StokListeSatiri, b: StokListeSatiri): number {
  if (a.type === 'vaccine' && b.type === 'vaccine') {
    const da = devletProgramAsiMi(a) ? 1 : 0;
    const db = devletProgramAsiMi(b) ? 1 : 0;
    if (da !== db) return da - db;
  }

  if (b.kullanim !== a.kullanim) return b.kullanim - a.kullanim;

  if (stoktaMiktarVar(a) !== stoktaMiktarVar(b)) {
    return stoktaMiktarVar(a) ? -1 : 1;
  }

  const ka = katalogSiraIndeksi(a.katalogId);
  const kb = katalogSiraIndeksi(b.katalogId);
  if (ka !== kb) return ka - kb;

  const ad = a.ad.localeCompare(b.ad, 'tr');
  if (ad !== 0) return ad;
  return a.key.localeCompare(b.key, 'tr');
}

export function siralaStokListeSatirlari(satirlar: StokListeSatiri[]): StokListeSatiri[] {
  return [...satirlar].sort(karsilastirStokSatirlari);
}

/** Arama sonrası da aynı sıra korunur (filtre ayrı, sıra deterministik). */
export function filtreleStokSatirlari(satirlar: StokListeSatiri[], arama: string): StokListeSatiri[] {
  const q = arama.trim().toLocaleLowerCase('tr-TR');
  if (!q) return satirlar;
  return satirlar.filter(
    (s) => s.ad.toLocaleLowerCase('tr-TR').includes(q) || s.aciklama.toLocaleLowerCase('tr-TR').includes(q),
  );
}
