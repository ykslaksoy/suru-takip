export type RationPhase = 'maintenance' | 'pregnant' | 'lactating' | 'lamb_fattening' | 'dry';

export interface RationInput {
  liveWeightKg: number;
  count: number;
  phase: RationPhase;
  forageQuality: 'low' | 'medium' | 'high';
}

export interface RationResult {
  dmRequirementKg: number;
  dailyFeedKg: number;
  totalDailyKg: number;
  proteinPercent: number;
  notes: string[];
}

const PHASE_MULTIPLIERS: Record<RationPhase, number> = {
  maintenance: 1.0,
  pregnant: 1.15,
  lactating: 1.45,
  lamb_fattening: 1.25,
  dry: 0.95,
};

const PHASE_LABELS: Record<RationPhase, string> = {
  maintenance: 'Bakım',
  pregnant: 'Gebe',
  lactating: 'Sağmal',
  lamb_fattening: 'Kuzu Besi',
  dry: 'Kuru dönem',
};

export function calculateRation(input: RationInput): RationResult {
  const baseDM = 0.035 * Math.pow(input.liveWeightKg, 0.75);
  const multiplier = PHASE_MULTIPLIERS[input.phase];
  const qualityFactor = input.forageQuality === 'low' ? 1.15 : input.forageQuality === 'high' ? 0.92 : 1.0;
  const dmRequirementKg = baseDM * multiplier * qualityFactor;
  const dailyFeedKg = dmRequirementKg / 0.88;
  const totalDailyKg = dailyFeedKg * input.count;

  const proteinPercent =
    input.phase === 'lactating' ? 14 : input.phase === 'lamb_fattening' ? 16 : input.phase === 'pregnant' ? 12 : 10;

  const notes: string[] = [
    `${PHASE_LABELS[input.phase]} dönemi için hesaplandı.`,
    'Kaba yem (silaj/kuru ot) ve kesif yem oranını 60:40 olarak planlayın.',
    'Su tüketimi yetersizse yem alımı düşer — temiz su kontrol edin.',
  ];

  if (input.forageQuality === 'low') {
    notes.push('Kaba yem kalitesi düşük — kesif yem oranını artırın.');
  }

  return {
    dmRequirementKg: Math.round(dmRequirementKg * 100) / 100,
    dailyFeedKg: Math.round(dailyFeedKg * 100) / 100,
    totalDailyKg: Math.round(totalDailyKg * 10) / 10,
    proteinPercent,
    notes,
  };
}

export { PHASE_LABELS };
