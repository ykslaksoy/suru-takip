/**
 * Mod 1 — Hızlı / kapalı kuzu besi aşı · vitamin · hap planı.
 * Giriş koruma + yem dönüşümü desteği; damızlık / süt programından ayrı.
 *
 * Öncelik: iç-dış parazit → karma → selenyum → tartım → 21 gün karma rapel.
 * Karma = klostridiyal + pastörella → ayrı çelertme (enterotoksemi) gerekmez.
 * Tartım: 1–2. gün alım (T1) + 15 günde bir kontrol.
 */

import { ASI_PROGRAMI, asiDozEtiketi, asiKategori } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI, vitaminDozEtiketi } from '@/kaynak/akilli-veteriner/vitamin-programi';
import {
  TARTIM_15_PROGRAM_ID,
  TARTIM_GIRIS_PROGRAM_ID,
  type ModTakviyeKalemi,
  type TakviyeTip,
} from '@/kaynak/akilli-veteriner/mod-takviye';

/** Plan kimliği — şablon değişince seed yeniler */
export const HIZLI_BESI_PLAN_SURUM = 'v10';

/** @deprecated — karma klostridiyal kapsar; hızlı beside kullanılmıyor */
export const ENTEROTOKSEMI_RAPEL_PROGRAM_ID = 'enterotoksemi-rapel';

/** 21. gün karma rapel — ayrı plan kalemi */
export const KARMA_RAPEL_PROGRAM_ID = 'karma-rapel';

/** Rapel kalemleri → ana aşı programı */
export const RAPEL_ANA_PROGRAM: Record<string, string> = {
  [KARMA_RAPEL_PROGRAM_ID]: 'karma',
};

export function rapelMi(programId: string): boolean {
  return programId in RAPEL_ANA_PROGRAM;
}

export function rapelAnaProgramId(programId: string): string | null {
  return RAPEL_ANA_PROGRAM[programId] ?? null;
}

/**
 * Girişte yapılan / yapılacak koruma (Padok B/C seed’de yapıldı sayılır).
 * Karma = klostridiyal + pastörella (çelertme dahil) — ayrı enterotoksemi yok.
 */
export const HIZLI_BESI_GIRIS_ASI_PARAZIT = [
  'karma',
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
 * 0 = giriş · 1–2 = alım tartımı · 7 = selenyum · 15 = kontrol tartım · 21 = karma rapel
 */
export const HIZLI_BESI_TAKVIM: {
  tip: 'asi' | 'parazit' | 'vitamin' | 'tartim';
  programId: string;
  gun: number;
  not: string;
}[] = [
  { tip: 'parazit', programId: 'ivermektin', gun: 0, not: 'İç-dış parazit iğne — önce' },
  { tip: 'parazit', programId: 'albendazol', gun: 0, not: 'İç parazit hapı · 1 hap / 10 kg' },
  {
    tip: 'asi',
    programId: 'karma',
    gun: 0,
    not: 'Klostridiyal + pastörella (çelertme dahil · 1. doz)',
  },
  { tip: 'vitamin', programId: 'ad3e', gun: 0, not: 'Kapalı besi A-D3-E' },
  { tip: 'vitamin', programId: 'b-kompleks', gun: 0, not: 'İştah · stres' },
  { tip: 'vitamin', programId: 'probiyotik', gun: 0, not: 'Rumen / yem değişimi' },
  { tip: 'vitamin', programId: 'premiks', gun: 0, not: 'Rasyona vitamin-mineral premiks' },
  { tip: 'tartim', programId: TARTIM_GIRIS_PROGRAM_ID, gun: 1, not: 'Alım tartımı (T1) · 1–2. gün' },
  { tip: 'vitamin', programId: 'selen-e', gun: 7, not: 'Kas · beyaz kas riski' },
  { tip: 'tartim', programId: TARTIM_15_PROGRAM_ID, gun: 15, not: 'Kontrol tartımı — sağlık sonrası' },
  { tip: 'asi', programId: KARMA_RAPEL_PROGRAM_ID, gun: 21, not: 'Karma rapel (2. doz · 21 gün)' },
];

/** Görev listesi sırası — düşük = önce (tartım / rapel en sonda) */
export function takviyeGorevOncelikSira(tip: TakviyeTip, programId: string): number {
  if (programId === TARTIM_GIRIS_PROGRAM_ID) return 20;
  if (tip === 'tartim') return 100;
  if (programId === KARMA_RAPEL_PROGRAM_ID) return 94;
  const sira: Record<string, number> = {
    ivermektin: 1,
    albendazol: 2,
    karma: 3,
    'selen-e': 5,
    ad3e: 10,
    'b-kompleks': 11,
    probiyotik: 12,
    premiks: 13,
  };
  return sira[programId] ?? 50;
}

function kalemOlustur(
  tip: ModTakviyeKalemi['tip'],
  programId: string,
): ModTakviyeKalemi | null {
  if (programId === KARMA_RAPEL_PROGRAM_ID) {
    const p = ASI_PROGRAMI.find((x) => x.id === 'karma');
    if (!p) return null;
    return {
      tip: 'asi',
      programId: KARMA_RAPEL_PROGRAM_ID,
      ad: 'Klostridiyal + pastörella pekiştirme',
      detay: 'Karma aşı 2. doz',
      mlEtiket: asiDozEtiketi(p),
    };
  }
  if (programId === TARTIM_GIRIS_PROGRAM_ID || (tip === 'tartim' && programId === TARTIM_GIRIS_PROGRAM_ID)) {
    return {
      tip: 'tartim',
      programId: TARTIM_GIRIS_PROGRAM_ID,
      ad: 'Alım tartımı',
      detay: 'T1 · 1–2. gün',
      mlEtiket: '1–2. gün',
    };
  }
  if (tip === 'tartim' || programId === TARTIM_15_PROGRAM_ID) {
    return {
      tip: 'tartim',
      programId: TARTIM_15_PROGRAM_ID,
      ad: '15 günde bir tartım',
      detay: 'Kontrol tartımı',
      mlEtiket: '15 gün',
    };
  }
  if (tip === 'vitamin') {
    const v = VITAMIN_PROGRAMI.find((x) => x.id === programId);
    if (!v) return null;
    return {
      tip: 'vitamin',
      programId: v.id,
      ad: v.detay,
      detay: v.ad,
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
 * Mod 1 şablonu — parazit → karma → alım tartım → selenyum → 15g tartım → karma rapel.
 */
export function hizliBesiTakviyeSablonu(): ModTakviyeKalemi[] {
  const seen = new Set<string>();
  const out: ModTakviyeKalemi[] = [];

  const sira: { tip: ModTakviyeKalemi['tip']; id: string }[] = [
    { tip: 'parazit', id: 'ivermektin' },
    { tip: 'parazit', id: 'albendazol' },
    { tip: 'asi', id: 'karma' },
    { tip: 'vitamin', id: 'ad3e' },
    { tip: 'vitamin', id: 'b-kompleks' },
    { tip: 'vitamin', id: 'probiyotik' },
    { tip: 'vitamin', id: 'premiks' },
    { tip: 'tartim', id: TARTIM_GIRIS_PROGRAM_ID },
    { tip: 'vitamin', id: 'selen-e' },
    { tip: 'tartim', id: TARTIM_15_PROGRAM_ID },
    { tip: 'asi', id: KARMA_RAPEL_PROGRAM_ID },
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

/** Padok A (yeni alım): HIZLI_BESI_TAKVIM’den plan günü */
export function hizliBesiPlanGun(tip: string, programId: string): number {
  const satir = HIZLI_BESI_TAKVIM.find((e) => e.programId === programId);
  if (satir) return satir.gun;
  if (programId === TARTIM_GIRIS_PROGRAM_ID) return 1;
  if (tip === 'tartim') return 15;
  if (programId === 'selen-e') return 7;
  return 0;
}

export const HIZLI_BESI_PLAN_BASLIK =
  'Hızlı besi — parazit · karma · alım tartım · selenyum · 15g tartım · 21g karma rapel';
