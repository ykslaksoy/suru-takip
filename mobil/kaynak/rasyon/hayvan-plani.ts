import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Animal, AnimalRationPlan } from '@/kaynak/cekirdek/tipler';
import { calculateRation, type RationPhase } from '@/kaynak/rasyon/hesapla';
import { ageInMonths } from '@/kaynak/kilo/kuzu-derece';

const KEY = 'sy_animal_ration_plans';

async function readAll(): Promise<AnimalRationPlan[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeAll(plans: AnimalRationPlan[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(plans));
}

/** Hayvan durumuna göre rasyon dönemi. */
export function inferRationPhase(animal: Animal): RationPhase {
  if (animal.status === 'pregnant') return 'pregnant';
  if (animal.status === 'lactating') return 'lactating';
  if (animal.status === 'dry') return 'dry';
  const age = ageInMonths(animal.birthDate);
  if (age != null && age <= 12) return 'lamb_fattening';
  return 'maintenance';
}

/** Belirli canlı ağırlık için günlük yem (kg/hayvan/gün). */
export function dailyFeedForAnimal(
  animal: Animal,
  liveWeightKg: number,
  forageQuality: AnimalRationPlan['forageQuality'] = 'medium'
): number {
  const phase = inferRationPhase(animal);
  return calculateRation({ liveWeightKg, count: 1, phase, forageQuality }).dailyFeedKg;
}

/** Tartım sonrası günlük rasyon planını kaydet / güncelle. */
export async function upsertRationPlanFromWeight(
  animal: Animal,
  weightKg: number,
  forageQuality: AnimalRationPlan['forageQuality'] = 'medium'
): Promise<AnimalRationPlan> {
  const phase = inferRationPhase(animal);
  const dailyFeedKg = dailyFeedForAnimal(animal, weightKg, forageQuality);
  const plan: AnimalRationPlan = {
    animalId: animal.id,
    liveWeightKg: weightKg,
    phase,
    forageQuality,
    dailyFeedKg,
    updatedAt: new Date().toISOString(),
  };
  const plans = await readAll();
  const idx = plans.findIndex((p) => p.animalId === animal.id);
  if (idx >= 0) plans[idx] = plan;
  else plans.push(plan);
  await writeAll(plans);
  return plan;
}

export async function getAnimalRationPlan(animalId: string): Promise<AnimalRationPlan | null> {
  return (await readAll()).find((p) => p.animalId === animalId) ?? null;
}

/** Plan yoksa son tartımdan oluştur. */
export async function ensureRationPlan(
  animal: Animal,
  latestWeightKg: number | null
): Promise<AnimalRationPlan | null> {
  if (latestWeightKg == null || latestWeightKg <= 0) return null;
  const existing = await getAnimalRationPlan(animal.id);
  if (existing && existing.liveWeightKg === latestWeightKg) return existing;
  return upsertRationPlanFromWeight(animal, latestWeightKg);
}

export async function clearAllRationPlans(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
