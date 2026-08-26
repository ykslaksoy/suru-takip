/**
 * Kuzu gelişim derecelendirmesi (geçici skala — sonra netleştirilir).
 *
 * ÖNEMLİ: Derece, kuzunun **kaçıncı ayında** olduğuna göre yorumlanır.
 * Aynı ADG, 2. ayda “Sportmen”, 6. ayda “Gelişen” olabilir.
 *
 * Bilimsel taban: yaş bandı + ADG + opsiyonel BCS/FCR/hedef.
 * Marka dili: Sıska → Gelişen → Sportmen → Şampiyon → Süper Kuzu
 */

export type KuzuGradeId = 'siska' | 'gelisen' | 'sportmen' | 'sampiyon' | 'super_kuzu' | 'bilinmiyor';

export interface KuzuGrade {
  id: KuzuGradeId;
  level: number;
  label: string;
  emoji: string;
  color: string;
  short: string;
  hint: string;
}

export const KUZU_GRADES: Record<KuzuGradeId, KuzuGrade> = {
  bilinmiyor: {
    id: 'bilinmiyor',
    level: 0,
    label: 'Ölçülsün',
    emoji: '❔',
    color: '#8a9a8a',
    short: 'Henüz tartım yok',
    hint: 'İlk tartımı al; Akıllı Kuzu yaşa göre derecelendirsin.',
  },
  siska: {
    id: 'siska',
    level: 1,
    label: 'Sıska',
    emoji: '😟🐑',
    color: '#c1121f',
    short: 'Gelişim zayıf / risk',
    hint: 'Bu ay için beklenenin altında — padok, yem, sağlık kontrol.',
  },
  gelisen: {
    id: 'gelisen',
    level: 2,
    label: 'Gelişen',
    emoji: '🌱🐑',
    color: '#e09f3e',
    short: 'Toparlanıyor',
    hint: 'Bu aya göre yolunda — düzenli tartım sürdür.',
  },
  sportmen: {
    id: 'sportmen',
    level: 3,
    label: 'Sportmen',
    emoji: '💪🐑',
    color: '#2d6a4f',
    short: 'Formda (yaşına göre)',
    hint: 'Bu ay için iyi tempo. FCR’yi de izle.',
  },
  sampiyon: {
    id: 'sampiyon',
    level: 4,
    label: 'Şampiyon',
    emoji: '🥇🐑',
    color: '#1b4332',
    short: 'Üst seviye (yaşına göre)',
    hint: 'Yaş bandının üstünde — Süper Kuzu eşiğine yakın.',
  },
  super_kuzu: {
    id: 'super_kuzu',
    level: 5,
    label: 'Süper Kuzu',
    emoji: '🏆🐑',
    color: '#b8860b',
    short: 'En üst verim',
    hint: 'Yaşına göre zirve + hedef/FCR — tebrikler!',
  },
};

/** Yaş bandı (ay) — besi kuzusu için geçici beklenti ADG (g/gün) */
export interface AgeBand {
  minMonth: number;
  maxMonth: number;
  label: string;
  /** Bu bandda Sıska / Gelişen / Sportmen / Şampiyon eşikleri (ADG g/gün) */
  thresholds: {
    siskaBelow: number;
    gelisenBelow: number;
    sportmenBelow: number;
    /** sportmenBelow ve üzeri → Şampiyon adayı; Süper Kuzu ek şart */
  };
}

/**
 * Geçici yaş bantları (ırk/ırk tipi sonra ayrıştırılır).
 * Tipik: 2–3 ay alım → besi → ~5–7 ay çıkış.
 */
export const AGE_BANDS: AgeBand[] = [
  {
    minMonth: 0,
    maxMonth: 2,
    label: '0–2 ay (süt / erken)',
    thresholds: { siskaBelow: 100, gelisenBelow: 160, sportmenBelow: 220 },
  },
  {
    minMonth: 2,
    maxMonth: 3.5,
    label: '2–3,5 ay (alım / karantina dönemi)',
    thresholds: { siskaBelow: 120, gelisenBelow: 180, sportmenBelow: 250 },
  },
  {
    minMonth: 3.5,
    maxMonth: 5,
    label: '3,5–5 ay (aktif besi)',
    thresholds: { siskaBelow: 140, gelisenBelow: 200, sportmenBelow: 270 },
  },
  {
    minMonth: 5,
    maxMonth: 7,
    label: '5–7 ay (bitiş / satışa yakın)',
    // İleri ayda ADG genelde yavaşlar — eşikler biraz düşer
    thresholds: { siskaBelow: 100, gelisenBelow: 160, sportmenBelow: 220 },
  },
  {
    minMonth: 7,
    maxMonth: 24,
    label: '7+ ay',
    thresholds: { siskaBelow: 80, gelisenBelow: 130, sportmenBelow: 180 },
  },
];

export function ageInMonths(birthDate: string, at = new Date()): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  const ms = at.getTime() - b.getTime();
  if (ms < 0) return 0;
  return Math.round((ms / (1000 * 60 * 60 * 24 * 30.44)) * 10) / 10;
}

export function bandForAge(ageMonths: number | null): AgeBand {
  if (ageMonths == null) return AGE_BANDS[1]; // varsayılan: alım bandı
  for (const band of AGE_BANDS) {
    if (ageMonths >= band.minMonth && ageMonths < band.maxMonth) return band;
  }
  return AGE_BANDS[AGE_BANDS.length - 1];
}

export interface GradeInput {
  adgGrams: number | null;
  /** Doğum tarihi — yaş bandı için */
  birthDate?: string | null;
  /** Doğrudan ay (birthDate yoksa) */
  ageMonths?: number | null;
  fcr?: number | null;
  bcs?: number | null;
  targetReached?: boolean;
  isSick?: boolean;
}

export function gradeLamb(input: GradeInput): KuzuGrade {
  const { adgGrams, fcr, bcs, targetReached, isSick } = input;
  const age =
    input.ageMonths ??
    (input.birthDate ? ageInMonths(input.birthDate) : null);
  const band = bandForAge(age);
  const t = band.thresholds;

  if (adgGrams == null || Number.isNaN(adgGrams)) {
    const unknown = { ...KUZU_GRADES.bilinmiyor };
    unknown.hint = `${band.label} · ${unknown.hint}`;
    if (age != null) unknown.short = `${unknown.short} · ~${age} ay`;
    return unknown;
  }

  let id: KuzuGradeId;
  if (adgGrams < t.siskaBelow) id = 'siska';
  else if (adgGrams < t.gelisenBelow) id = 'gelisen';
  else if (adgGrams < t.sportmenBelow) id = 'sportmen';
  else id = 'sampiyon';

  if (bcs != null) {
    if (bcs <= 1.5) id = 'siska';
    else if (bcs <= 2 && id !== 'siska') id = 'gelisen';
    else if (bcs >= 4.5 && (id === 'sportmen' || id === 'sampiyon')) id = 'sportmen';
  }

  if (isSick && id !== 'siska') {
    id = id === 'gelisen' ? 'siska' : 'gelisen';
  }

  const fcrOk = fcr == null || (fcr > 0 && fcr <= 4.5);
  // Süper Kuzu: yaş bandında Şampiyon seviyesinde ADG + hedef + FCR
  if (adgGrams >= t.sportmenBelow && targetReached && fcrOk && !isSick && (bcs == null || bcs >= 2.5)) {
    id = 'super_kuzu';
  }

  const grade = { ...KUZU_GRADES[id] };
  // İpucuna yaş bandı ekle — aynı ADG farklı ayda farklı derece
  if (age != null) {
    grade.hint = `${band.label} · ${grade.hint}`;
    grade.short = `${grade.short} · ~${age} ay`;
  } else {
    grade.hint = `${band.label} · ${grade.hint}`;
  }
  return grade;
}

export function gradeFromAdg(
  adgGrams: number | null,
  opts?: Partial<GradeInput>
): KuzuGrade {
  return gradeLamb({ adgGrams, ...opts });
}
