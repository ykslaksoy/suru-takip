export type AnimalSex = 'female' | 'male';
export type AnimalSpecies = 'sheep' | 'goat';
export type AnimalStatus = 'healthy' | 'sick' | 'pregnant' | 'lactating' | 'dry' | 'sold' | 'dead';
export type StockType = 'feed' | 'vaccine' | 'medicine' | 'supplement';
export type {
  PaketAdet,
  PaketTanim,
  SubscriptionTier,
} from '@/kaynak/abonelik/paketler';
export {
  PAKET_ADETLER,
  PAKET_LISTESI,
  SUBSCRIPTION_LIMITS,
  SUBSCRIPTION_PRICES,
  VARSAYILAN_PAKET,
} from '@/kaynak/abonelik/paketler';
export type SyncStatus = 'synced' | 'pending' | 'error';
export type RationPhase = 'maintenance' | 'pregnant' | 'lactating' | 'lamb_fattening' | 'dry';

/** Ürün modu — hangi işletme hattına kayıtlı (mod1–mod4) */
export type AnimalModId = 'mod1' | 'mod2' | 'mod3' | 'mod4';

export interface Animal {
  id: string;
  earTag: string;
  turkvetNo: string;
  name: string;
  breed: string;
  species: AnimalSpecies;
  sex: AnimalSex;
  birthDate: string;
  paddock: string;
  status: AnimalStatus;
  motherId: string | null;
  /** GEKİS / Aref elektronik kimlik (RFID) */
  gehisId: string | null;
  /** Sırt boya / padok numarası — küpe ve Aref ile eşleşir */
  sirtNo: string | null;
  /** Kayıt sırasında seçilen ürün modu */
  modId: AnimalModId | null;
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
  /** Önerilen ilk müdahale / tedavi adımları (bilgilendirme) */
  tedaviOnerileri: string[];
  /** Fotoğraftan çıkarılan gözlemler */
  fotoGozlemleri: string[];
  urgency: 'low' | 'medium' | 'high';
  seeVet: boolean;
}

export const ANIMAL_STATUS_LABELS: Record<AnimalStatus, string> = {
  healthy: 'Sağlıklı',
  sick: 'Hasta',
  pregnant: 'Gebe',
  // Sürü kartı sağlık rozeti (Hasta ile çift); süt rasyon fazı ayrı: hesapla.ts
  lactating: 'Sağlıklı',
  dry: 'Kuru',
  sold: 'Satıldı',
  dead: 'Öldü',
};

export const STOCK_TYPE_LABELS: Record<StockType, string> = {
  feed: 'Yem',
  vaccine: 'Aşı',
  medicine: 'İlaç',
  supplement: 'Takviye',
};

/** Stok ekranı filtre sırası */
export const STOCK_TYPE_ORDER: StockType[] = ['feed', 'supplement', 'vaccine', 'medicine'];
