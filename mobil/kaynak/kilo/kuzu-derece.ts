/**
 * Kuzu gelişim derecelendirmesi (geçici skala — sonra netleştirilir).
 *
 * ÖNEMLİ: Derece, kuzunun **kaçıncı ayında** olduğuna göre yorumlanır.
 * Aynı ADG, farklı yaş bandında farklı derece olabilir.
 *
 * Bilimsel taban: yaş bandı + ADG + opsiyonel BCS/FCR/hedef.
 * Marka dili: Zayıf → Fit → Sportmen → Kaslı → Süper Kuzu
 */

export type KuzuGradeId = 'zayif' | 'fit' | 'sportmen' | 'kasli' | 'super_kuzu' | 'bilinmiyor';

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
  zayif: {
    id: 'zayif',
    level: 1,
    label: 'Zayıf',
    emoji: '😟🐑',
    color: '#c1121f',
    short: 'Gelişim zayıf / risk',
    hint: 'Bu ay için beklenenin altında — padok, yem, sağlık kontrol.',
  },
  fit: {
    id: 'fit',
    level: 2,
    label: 'Fit',
    emoji: '🌱🐑',
    color: '#e09f3e',
    short: 'Form tutuyor',
    hint: 'Bu aya göre yolunda — düzenli tartım sürdür.',
  },
  sportmen: {
    id: 'sportmen',
    level: 3,
    label: 'Sportmen',
    emoji: '💪🐑',
    color: '#2d6a4f',
    short: 'Formda (yaşına göre)',
    hint: 'Bu ay için iyi tempo. Yem dönüşüm oranını da izle.',
  },
  kasli: {
    id: 'kasli',
    level: 4,
    label: 'Kaslı',
    emoji: '🥇🐑',
    color: '#1b4332',
    short: 'Kas durumu güçlü (yaşına göre)',
    hint: 'Yaş bandının üstünde, kas yapısı iyi — Süper Kuzu eşiğine yakın.',
  },

  super_kuzu: {
    id: 'super_kuzu',
    level: 5,
    label: 'Süper Kuzu',
    emoji: '🏆🐑',
    color: '#b8860b',
    short: 'En üst verim',
    hint: 'Yaşına göre zirve + hedef/yem dönüşüm oranı — tebrikler!',
  },
};

/** Yaş bandı (ay) — besi kuzusu için geçici beklenti ADG (g/gün) */
export interface AgeBand {
  minMonth: number;
  maxMonth: number;
  label: string;
  /** Bu bandda Zayıf / Fit / Sportmen / Kaslı eşikleri (ADG g/gün) */
  thresholds: {
    zayifBelow: number;
    fitBelow: number;
    sportmenBelow: number;
    /** sportmenBelow ve üzeri → Kaslı adayı; Süper Kuzu ek şart */
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
    thresholds: { zayifBelow: 100, fitBelow: 160, sportmenBelow: 220 },
  },
  {
    minMonth: 2,
    maxMonth: 3.5,
    label: '2–3,5 ay (alım / karantina dönemi)',
    thresholds: { zayifBelow: 120, fitBelow: 180, sportmenBelow: 250 },
  },
  {
    minMonth: 3.5,
    maxMonth: 5,
    label: '3,5–5 ay (aktif besi)',
    thresholds: { zayifBelow: 140, fitBelow: 200, sportmenBelow: 270 },
  },
  {
    minMonth: 5,
    maxMonth: 7,
    label: '5–7 ay (bitiş / satışa yakın)',
    // İleri ayda ADG genelde yavaşlar — eşikler biraz düşer
    thresholds: { zayifBelow: 100, fitBelow: 160, sportmenBelow: 220 },
  },
  {
    minMonth: 7,
    maxMonth: 24,
    label: '7+ ay',
    thresholds: { zayifBelow: 80, fitBelow: 130, sportmenBelow: 180 },
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
  if (adgGrams < t.zayifBelow) id = 'zayif';
  else if (adgGrams < t.fitBelow) id = 'fit';
  else if (adgGrams < t.sportmenBelow) id = 'sportmen';
  else id = 'kasli';

  if (bcs != null) {
    if (bcs <= 1.5) id = 'zayif';
    else if (bcs <= 2 && id !== 'zayif') id = 'fit';
    else if (bcs >= 4.5 && (id === 'sportmen' || id === 'kasli')) id = 'sportmen';
  }

  if (isSick && id !== 'zayif') {
    id = id === 'fit' ? 'zayif' : 'fit';
  }

  const fcrOk = fcr == null || (fcr > 0 && fcr <= 4.5);
  // Süper Kuzu: yaş bandında Kaslı seviyesinde ADG + hedef + FCR
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
