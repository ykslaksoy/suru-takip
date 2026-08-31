/**
 * Mod 1 — Hızlı / kapalı kuzu besi aşı · vitamin · hap planı.
 * Giriş koruma + yem dönüşümü desteği; damızlık / süt programından ayrı.
 */

import { ASI_PROGRAMI, asiDozEtiketi, asiKategori } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI, vitaminDozEtiketi } from '@/kaynak/akilli-veteriner/vitamin-programi';
import {
  TARTIM_15_PROGRAM_ID,
  type ModTakviyeKalemi,
} from '@/kaynak/akilli-veteriner/mod-takviye';

/** Plan kimliği — şablon değişince seed yeniler */
export const HIZLI_BESI_PLAN_SURUM = 'v2';

/**
 * Girişte yapılan / yapılacak koruma (Padok B/C seed’de yapıldı sayılır).
 * Karma = klostridiyal + pastörella; ayrı pasteurella/clostridial yok.
 */
export const HIZLI_BESI_GIRIS_ASI_PARAZIT = [
  'karma',
  'enterotoksemi',
  'albendazol',
  'ivermektin',
] as const;

/** Girişte verilen vitamin / destek (B/C seed’de yapıldı) */
export const HIZLI_BESI_GIRIS_VITAMIN = [
  'ad3e',
  'b-kompleks',
  'probiyotik',
  'premiks',
] as const;

/**
 * Takvim: girişten sonra kaçıncı gün planlanır.
 * 0 = giriş / karantina günü · 15 = ara tartım · 21 = pekiştirme
 */
export const HIZLI_BESI_TAKVIM: {
  tip: 'asi' | 'parazit' | 'vitamin' | 'tartim';
  programId: string;
  gun: number;
  not: string;
}[] = [
  // —— Giriş (gün 0): hap + aşı + vitamin ——
  { tip: 'parazit', programId: 'albendazol', gun: 0, not: 'İç parazit hapı · 1 hap / 10 kg' },
  { tip: 'parazit', programId: 'ivermektin', gun: 0, not: 'İç-dış parazit iğne' },
  { tip: 'asi', programId: 'enterotoksemi', gun: 0, not: 'Çelertme — yoğun yem öncesi şart' },
  { tip: 'asi', programId: 'karma', gun: 0, not: 'Klostridiyal + pastörella' },
  { tip: 'vitamin', programId: 'ad3e', gun: 0, not: 'Kapalı besi A-D3-E' },
  { tip: 'vitamin', programId: 'b-kompleks', gun: 0, not: 'İştah · stres' },
  { tip: 'vitamin', programId: 'probiyotik', gun: 0, not: 'Rumen / yem değişimi' },
  { tip: 'vitamin', programId: 'premiks', gun: 0, not: 'Rasyona vitamin-mineral premiks' },
  // —— 7. gün ——
  { tip: 'vitamin', programId: 'selen-e', gun: 7, not: 'Kas · beyaz kas riski' },
  // —— 15. gün ——
  { tip: 'tartim', programId: TARTIM_15_PROGRAM_ID, gun: 15, not: 'Kontrol tartımı' },
  // —— 21. gün: pekiştirme ——
  { tip: 'asi', programId: 'enterotoksemi', gun: 21, not: 'Çelertme pekiştirme (2. doz)' },
];

function kalemOlustur(
  tip: ModTakviyeKalemi['tip'],
  programId: string,
): ModTakviyeKalemi | null {
  if (tip === 'tartim') {
    return {
      tip: 'tartim',
      programId: TARTIM_15_PROGRAM_ID,
      ad: '15 günde bir tartım',
      detay: 'Hızlı besi kontrol tartımı',
      mlEtiket: '15 gün',
    };
  }
  if (tip === 'vitamin') {
    const v = VITAMIN_PROGRAMI.find((x) => x.id === programId);
    if (!v) return null;
    return {
      tip: 'vitamin',
      programId: v.id,
      ad: v.ad,
      detay: v.detay,
      mlEtiket: vitaminDozEtiketi(v),
    };
  }
  const p = ASI_PROGRAMI.find((x) => x.id === programId);
  if (!p) return null;
  const kat = asiKategori(p);
  return {
    tip: kat === 'parazit' ? 'parazit' : 'asi',
    programId: p.id,
    ad: p.koruma,
    detay: p.ad,
    mlEtiket: asiDozEtiketi(p),
  };
}

/**
 * Mod 1 şablonu — her program bir kez (enterotoksemi tek kalem; 2. doz planlananAt ile).
 * Sıra: tartım · aşı · hap · vitamin.
 */
export function hizliBesiTakviyeSablonu(): ModTakviyeKalemi[] {
  const seen = new Set<string>();
  const out: ModTakviyeKalemi[] = [];

  // Sabit sıra: tartım → giriş aşı/hap → vitamin
  const sira: { tip: ModTakviyeKalemi['tip']; id: string }[] = [
    { tip: 'tartim', id: TARTIM_15_PROGRAM_ID },
    { tip: 'asi', id: 'enterotoksemi' },
    { tip: 'asi', id: 'karma' },
    { tip: 'parazit', id: 'albendazol' },
    { tip: 'parazit', id: 'ivermektin' },
    { tip: 'vitamin', id: 'ad3e' },
    { tip: 'vitamin', id: 'b-kompleks' },
    { tip: 'vitamin', id: 'selen-e' },
    { tip: 'vitamin', id: 'probiyotik' },
    { tip: 'vitamin', id: 'premiks' },
  ];

  for (const s of sira) {
    const key = `${s.tip}:${s.id}`;
    if (seen.has(key)) continue;
    const k = kalemOlustur(s.tip, s.id);
    if (!k) continue;
    seen.add(key);
    out.push(k);
  }
  return out;
}

/** Padok A (yeni alım): kalem için plan günü — pekiştirme enterotoksemi 21g */
export function hizliBesiPlanGun(tip: string, programId: string): number {
  if (tip === 'tartim') return 15;
  if (programId === 'selen-e') return 7;
  // İlk dozlar girişte; Padok A’da 21g karantina sonrası uygulanır (seed)
  return 21;
}

export const HIZLI_BESI_PLAN_BASLIK =
  'Hızlı besi — aşı · hap · vitamin (giriş + 21g pekiştirme)';
