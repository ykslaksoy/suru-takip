import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type {
  Animal,
  BetaFeedback,
  BetaSignup,
  HealthRecord,
  StockItem,
  StockMovement,
  WeightRecord,
} from './tipler';

const KEYS = {
  animals: 'sy_animals',
  weights: 'sy_weights',
  health: 'sy_health',
  stock: 'sy_stock',
  movements: 'sy_movements',
  betaSignups: 'sy_beta_signups',
  betaFeedback: 'sy_beta_feedback',
  syncQueue: 'sy_sync_queue',
};

async function read<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

async function write<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function countAnimals(): Promise<number> {
  return (await read<Animal>(KEYS.animals)).length;
}

export async function getAnimals(filter?: { sex?: string; status?: string; search?: string }): Promise<Animal[]> {
  let list = (await read<Animal>(KEYS.animals)).map((a) => ({
    ...a,
    species: a.species ?? 'sheep',
    modId: a.modId ?? null,
    sirtNo: a.sirtNo ?? null,
    gehisId: a.gehisId ?? null,
  }));
  if (filter?.sex) list = list.filter((a) => a.sex === filter.sex);
  if (filter?.status) list = list.filter((a) => a.status === filter.status);
  if (filter?.search) {
    const term = filter.search.toLowerCase();
    list = list.filter(
      (a) =>
        a.earTag.toLowerCase().includes(term) ||
        a.name.toLowerCase().includes(term) ||
        a.turkvetNo.toLowerCase().includes(term) ||
        (a.gehisId ?? '').toLowerCase().includes(term) ||
        (a.sirtNo ?? '').toLowerCase().includes(term)
    );
  }
  return list.sort((a, b) => a.earTag.localeCompare(b.earTag));
}

export async function getAnimal(id: string): Promise<Animal | null> {
  return (await read<Animal>(KEYS.animals)).find((a) => a.id === id) ?? null;
}

export async function upsertAnimal(
  animal: Omit<Animal, 'createdAt' | 'updatedAt' | 'syncStatus'> & Partial<Pick<Animal, 'createdAt' | 'updatedAt' | 'syncStatus'>>
): Promise<Animal> {
  const animals = await read<Animal>(KEYS.animals);
  const now = new Date().toISOString();
  const existing = animals.find((a) => a.id === animal.id);
  const record: Animal = {
    ...animal,
    species: animal.species ?? existing?.species ?? 'sheep',
    modId: animal.modId !== undefined ? animal.modId : existing?.modId ?? null,
    sirtNo: animal.sirtNo !== undefined ? animal.sirtNo : existing?.sirtNo ?? null,
    gehisId: animal.gehisId !== undefined ? animal.gehisId : existing?.gehisId ?? null,
    createdAt: existing?.createdAt ?? animal.createdAt ?? now,
    updatedAt: now,
    syncStatus: 'pending',
  };
  const next = existing ? animals.map((a) => (a.id === record.id ? record : a)) : [...animals, record];
  await write(KEYS.animals, next);
  await enqueueSync('animals', record.id, existing ? 'update' : 'create', record);
  return record;
}

export async function deleteAnimal(id: string): Promise<void> {
  await write(
    KEYS.animals,
    (await read<Animal>(KEYS.animals)).filter((a) => a.id !== id)
  );
  await enqueueSync('animals', id, 'delete', { id });
}

export async function getWeightRecords(animalId: string): Promise<WeightRecord[]> {
  return (await read<WeightRecord>(KEYS.weights))
    .filter((r) => r.animalId === animalId)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

export async function addWeightRecord(record: Omit<WeightRecord, 'id'> & { id?: string }): Promise<WeightRecord> {
  const full: WeightRecord = { ...record, id: record.id ?? uuidv4() };
  const weights = await read<WeightRecord>(KEYS.weights);
  await write(KEYS.weights, [...weights, full]);
  return full;
}

export async function getLatestWeight(animalId: string): Promise<number | null> {
  const records = await getWeightRecords(animalId);
  return records[0]?.weightKg ?? null;
}

export async function calculateADG(animalId: string, days = 30): Promise<number | null> {
  const records = await getWeightRecords(animalId);
  if (records.length < 2) return null;
  const latest = records[0];
  const cutoff = new Date(latest.recordedAt);
  cutoff.setDate(cutoff.getDate() - days);
  const older = records.find((r) => new Date(r.recordedAt) <= cutoff) ?? records[records.length - 1];
  if (older.id === latest.id) return null;
  const dayDiff = (new Date(latest.recordedAt).getTime() - new Date(older.recordedAt).getTime()) / 86400000;
  if (dayDiff <= 0) return null;
  return Math.round(((latest.weightKg - older.weightKg) / dayDiff) * 1000);
}

export async function getHealthRecords(animalId?: string): Promise<(HealthRecord & { earTag?: string })[]> {
  const health = await read<HealthRecord>(KEYS.health);
  const animals = await read<Animal>(KEYS.animals);
  const mapped = health.map((h) => ({
    ...h,
    earTag: animals.find((a) => a.id === h.animalId)?.earTag,
  }));
  const filtered = animalId ? mapped.filter((h) => h.animalId === animalId) : mapped;
  return filtered.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()).slice(0, animalId ? undefined : 50);
}

export async function addHealthRecord(record: Omit<HealthRecord, 'id'> & { id?: string }): Promise<HealthRecord> {
  const full: HealthRecord = { ...record, id: record.id ?? uuidv4() };
  await write(KEYS.health, [...(await read<HealthRecord>(KEYS.health)), full]);
  if (full.recordType === 'illness') {
    const animal = await getAnimal(full.animalId);
    if (animal && animal.status === 'healthy') await upsertAnimal({ ...animal, status: 'sick' });
  }
  return full;
}

export async function getActiveWithdrawals(): Promise<(HealthRecord & { earTag: string })[]> {
  const records = await getHealthRecords();
  const now = Date.now();
  return records.filter((r) => {
    if (!r.withdrawalDays || !r.medicine) return false;
    return new Date(r.recordedAt).getTime() + r.withdrawalDays * 86400000 > now;
  }) as (HealthRecord & { earTag: string })[];
}

export async function getStockItems(type?: string): Promise<StockItem[]> {
  let items = await read<StockItem>(KEYS.stock);
  if (type) items = items.filter((i) => i.type === type);
  return items.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
}

export async function upsertStockItem(item: Omit<StockItem, 'id'> & { id?: string }): Promise<StockItem> {
  const full: StockItem = { ...item, id: item.id ?? uuidv4() };
  const items = await read<StockItem>(KEYS.stock);
  const existing = items.find((i) => i.id === full.id);
  await write(KEYS.stock, existing ? items.map((i) => (i.id === full.id ? full : i)) : [...items, full]);
  return full;
}

export async function adjustStock(stockId: string, movementType: 'in' | 'out', quantity: number, notes = ''): Promise<void> {
  const item = (await getStockItems()).find((s) => s.id === stockId);
  if (!item) return;
  const delta = movementType === 'in' ? quantity : -quantity;
  await upsertStockItem({ ...item, quantity: Math.max(0, item.quantity + delta) });
  await write(KEYS.movements, [
    ...(await read<StockMovement>(KEYS.movements)),
    { id: uuidv4(), stockId, movementType, quantity, recordedAt: new Date().toISOString(), notes },
  ]);
}

export async function getLowStockItems(): Promise<StockItem[]> {
  return (await getStockItems()).filter((i) => i.quantity <= i.minQuantity);
}

export async function getStockMovements(filter?: {
  stockId?: string;
  from?: string;
  to?: string;
}): Promise<StockMovement[]> {
  let list = await read<StockMovement>(KEYS.movements);
  if (filter?.stockId) list = list.filter((m) => m.stockId === filter.stockId);
  if (filter?.from) {
    const t = new Date(filter.from).getTime();
    list = list.filter((m) => new Date(m.recordedAt).getTime() >= t);
  }
  if (filter?.to) {
    const t = new Date(filter.to).getTime();
    list = list.filter((m) => new Date(m.recordedAt).getTime() <= t);
  }
  return list.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

export async function countAnimalsInPaddock(paddock: string): Promise<number> {
  const p = paddock.trim();
  if (!p) return countAnimals();
  return (await getAnimals()).filter((a) => a.paddock.trim() === p).length;
}

export async function addBetaSignup(signup: Omit<BetaSignup, 'id' | 'createdAt'>): Promise<BetaSignup> {
  const full: BetaSignup = { ...signup, id: uuidv4(), createdAt: new Date().toISOString() };
  await write(KEYS.betaSignups, [...(await read<BetaSignup>(KEYS.betaSignups)), full]);
  return full;
}

export async function getBetaSignups(): Promise<BetaSignup[]> {
  return (await read<BetaSignup>(KEYS.betaSignups)).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addBetaFeedback(feedback: Omit<BetaFeedback, 'id' | 'createdAt'>): Promise<BetaFeedback> {
  const full: BetaFeedback = { ...feedback, id: uuidv4(), createdAt: new Date().toISOString() };
  await write(KEYS.betaFeedback, [...(await read<BetaFeedback>(KEYS.betaFeedback)), full]);
  return full;
}

export async function getBetaFeedback(): Promise<BetaFeedback[]> {
  return (await read<BetaFeedback>(KEYS.betaFeedback)).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getPendingSyncCount(): Promise<number> {
  return (await read<{ id: string }>(KEYS.syncQueue)).length;
}

export type SyncQueueEntry = {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  payload: string;
  createdAt: string;
};

export async function getSyncQueueEntries(): Promise<SyncQueueEntry[]> {
  const rows = await read<{
    id: string;
    table_name: string;
    record_id: string;
    action: string;
    payload: string;
    created_at: string;
  }>(KEYS.syncQueue);
  return rows
    .map((r) => ({
      id: r.id,
      tableName: r.table_name,
      recordId: r.record_id,
      action: r.action,
      payload: r.payload,
      createdAt: r.created_at,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function flushSyncQueue(): Promise<number> {
  const n = await getPendingSyncCount();
  await write(KEYS.syncQueue, []);
  return n;
}

async function enqueueSync(tableName: string, recordId: string, action: string, payload: unknown): Promise<void> {
  await write(KEYS.syncQueue, [
    ...(await read<{ id: string; table_name: string; record_id: string; action: string; payload: string; created_at: string }>(KEYS.syncQueue)),
    {
      id: uuidv4(),
      table_name: tableName,
      record_id: recordId,
      action,
      payload: JSON.stringify(payload),
      created_at: new Date().toISOString(),
    },
  ]);
}

export async function exportTurkvetData(): Promise<string> {
  const animals = await getAnimals();
  const payload = animals.map((a) => ({
    turkvetNo: a.turkvetNo,
    earTag: a.earTag,
    gehisId: a.gehisId,
    species: a.species === 'goat' ? 'caprine' : 'ovine',
    breed: a.breed,
    sex: a.sex,
    birthDate: a.birthDate,
    status: a.status,
    motherTurkvetNo: a.motherId,
    lastUpdated: a.updatedAt,
  }));
  return JSON.stringify({ version: '1.0', source: 'SuruYon', exportedAt: new Date().toISOString(), animals: payload }, null, 2);
}

export async function clearAllStorage(): Promise<void> {
  await Promise.all(Object.values(KEYS).map((k) => AsyncStorage.removeItem(k)));
}
