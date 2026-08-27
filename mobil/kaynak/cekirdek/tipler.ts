export type AnimalSex = 'female' | 'male';
export type AnimalStatus = 'healthy' | 'sick' | 'pregnant' | 'lactating' | 'dry' | 'sold' | 'dead';
export type StockType = 'feed' | 'vaccine' | 'medicine';
export type SubscriptionTier = 'free' | 'farmer' | 'professional' | 'enterprise';
export type SyncStatus = 'synced' | 'pending' | 'error';
export type RationPhase = 'maintenance' | 'pregnant' | 'lactating' | 'lamb_fattening' | 'dry';

export interface Animal {
  id: string;
  earTag: string;
  turkvetNo: string;
  name: string;
  breed: string;
  sex: AnimalSex;
  birthDate: string;
  paddock: string;
  status: AnimalStatus;
  motherId: string | null;
  gehisId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface WeightRecord {
  id: string;
  animalId: string;
  weightKg: number;
  recordedAt: string;
  notes: string;
}

export interface HealthRecord {
  id: string;
  animalId: string;
  recordType: 'illness' | 'treatment' | 'vaccine' | 'checkup';
  symptoms: string;
  diagnosis: string;
  treatment: string;
  medicine: string;
  withdrawalDays: number;
  vetName: string;
  recordedAt: string;
  notes: string;
}

export interface StockItem {
  id: string;
  name: string;
  type: StockType;
  quantity: number;
  unit: string;
  minQuantity: number;
  expiryDate: string | null;
  notes: string;
}

export interface StockMovement {
  id: string;
  stockId: string;
  movementType: 'in' | 'out';
  quantity: number;
  recordedAt: string;
  notes: string;
}

/** Hayvan bazlı günlük rasyon — son tartımdan otomatik güncellenir. */
export interface AnimalRationPlan {
  animalId: string;
  liveWeightKg: number;
  phase: RationPhase;
  forageQuality: 'low' | 'medium' | 'high';
  /** Hesaplanan ihtiyaç (kg/hayvan/gün) */
  dailyFeedKg: number;
  /** Günlük verilen yem (kg/hayvan/gün) — FCR için esas alınır */
  dailyGivenKg: number;
  updatedAt: string;
}

/** Yem stok sayımı — son envanter kaydı */
export interface YemSayim {
  id: string;
  stockId: string;
  quantityKg: number;
  recordedAt: string;
  note: string;
}

export interface BetaFeedback {
  id: string;
  farmName: string;
  region: string;
  phone: string;
  rating: number;
  category: string;
  message: string;
  createdAt: string;
}

export interface BetaSignup {
  id: string;
  name: string;
  phone: string;
  region: string;
  flockSize: number;
  createdAt: string;
}

export interface EducationLesson {
  id: string;
  title: string;
  duration: string;
  category: string;
  summary: string;
  content: string;
  tips: string[];
}

export interface VetSuggestion {
  conditions: string[];
  advice: string;
  urgency: 'low' | 'medium' | 'high';
  seeVet: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, number> = {
  free: 30,
  farmer: 200,
  professional: 1000,
  enterprise: 999999,
};

export const SUBSCRIPTION_PRICES: Record<SubscriptionTier, { monthly: number; yearly: number; label: string }> = {
  free: { monthly: 0, yearly: 0, label: 'Ücretsiz' },
  farmer: { monthly: 149, yearly: 1490, label: 'Çiftçi' },
  professional: { monthly: 349, yearly: 3490, label: 'Profesyonel' },
  enterprise: { monthly: 0, yearly: 0, label: 'Kurumsal' },
};

export const ANIMAL_STATUS_LABELS: Record<AnimalStatus, string> = {
  healthy: 'Sağlıklı',
  sick: 'Hasta',
  pregnant: 'Gebe',
  lactating: 'Sağmal',
  dry: 'Kuru',
  sold: 'Satıldı',
  dead: 'Öldü',
};

export const STOCK_TYPE_LABELS: Record<StockType, string> = {
  feed: 'Yem',
  vaccine: 'Aşı',
  medicine: 'İlaç',
};
