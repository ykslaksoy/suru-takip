import { kaliciGetItem, kaliciSetItem, kaliciRemoveItem } from '@/kaynak/cekirdek/web-kalici-depo';
import type { Animal, AnimalRationPlan } from '@/kaynak/cekirdek/tipler';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { calculateRation, type RationPhase } from '@/kaynak/rasyon/hesapla';
import { ageInMonths } from '@/kaynak/kilo/kuzu-derece';

const KEY = 'sy_animal_ration_plans';

async function readAll(): Promise<AnimalRationPlan[]> {
  const raw = await kaliciGetItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeAll(plans: AnimalRationPlan[]): Promise<void> {
  await kaliciSetItem(KEY, JSON.stringify(plans));
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
    dailyGivenKg: dailyFeedKg,
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
  const p = (await readAll()).find((x) => x.animalId === animalId);
  if (!p) return null;
  if (p.dailyGivenKg == null || p.dailyGivenKg === undefined) {
    return { ...p, dailyGivenKg: p.dailyFeedKg };
  }
  return p;
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

export async function setDailyGivenKg(animalId: string, dailyGivenKg: number): Promise<AnimalRationPlan | null> {
  const plans = await readAll();
  const idx = plans.findIndex((p) => p.animalId === animalId);
  if (idx < 0) return null;
  plans[idx] = { ...plans[idx], dailyGivenKg, updatedAt: new Date().toISOString() };
  await writeAll(plans);
  return plans[idx];
}

/** Padok hayvanlarına aynı günlük verilen yemi uygula (rasyon ekranından). */
export async function applyDailyGivenToPaddock(
  paddock: string,
  dailyGivenKg: number
): Promise<number> {
  const list = await getAnimals();
  const inPadok = list.filter((a) => a.paddock.trim() === paddock.trim());
  let n = 0;
  for (const a of inPadok) {
    const existing = await getAnimalRationPlan(a.id);
    if (existing) {
      await setDailyGivenKg(a.id, dailyGivenKg);
      n++;
    }
  }
  return n;
}

export async function clearAllRationPlans(): Promise<void> {
  await kaliciRemoveItem(KEY);
}
