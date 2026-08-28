import { v4 as uuidv4 } from 'uuid';
import {
  getAnimal,
  getAnimals,
  getHealthRecords,
  getWeightRecords,
} from '@/kaynak/cekirdek/veritabani';

export type VakaPaketi = {
  id: string;
  createdAt: string;
  symptoms: string;
  animal: {
    id: string;
    earTag: string;
    turkvetNo: string;
    breed: string;
    species: string;
    status: string;
    paddock: string;
  } | null;
  healthHistory: {
    recordType: string;
    diagnosis: string;
    treatment: string;
    medicine: string;
    recordedAt: string;
  }[];
  weights: { weightKg: number; recordedAt: string }[];
  not: string;
};

export async function olusturVakaPaketi(
  kupeArama: string,
  symptoms: string
): Promise<VakaPaketi | null> {
  const term = kupeArama.trim().toLowerCase();
  if (!term) return null;
  const animals = await getAnimals({ search: kupeArama.trim() });
  const animal =
    animals.find((a) => a.earTag.toLowerCase() === term) ??
    animals.find((a) => a.turkvetNo.toLowerCase().includes(term)) ??
    animals[0] ??
    null;

  const health = animal
    ? (await getHealthRecords(animal.id)).slice(0, 8).map((h) => ({
        recordType: h.recordType,
        diagnosis: h.diagnosis,
        treatment: h.treatment,
        medicine: h.medicine,
        recordedAt: h.recordedAt,
      }))
    : [];

  const weights = animal
    ? (await getWeightRecords(animal.id)).slice(0, 5).map((w) => ({
        weightKg: w.weightKg,
        recordedAt: w.recordedAt,
      }))
    : [];

  return {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    symptoms: symptoms.trim(),
    animal: animal
      ? {
          id: animal.id,
          earTag: animal.earTag,
          turkvetNo: animal.turkvetNo,
          breed: animal.breed,
          species: animal.species ?? 'sheep',
          status: animal.status,
          paddock: animal.paddock,
        }
      : null,
    healthHistory: health,
    weights,
    not: 'Bu paket yerel oluşturuldu; gerçek vet gönderimi sunucu köprüsü ile açılacak.',
  };
}

export async function olusturVakaPaketiHayvanId(
  animalId: string,
  symptoms: string
): Promise<VakaPaketi | null> {
  const animal = await getAnimal(animalId);
  if (!animal) return null;
  return olusturVakaPaketi(animal.earTag, symptoms);
}
