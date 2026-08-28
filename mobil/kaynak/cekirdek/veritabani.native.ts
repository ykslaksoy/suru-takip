import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import type {
  Animal,
  AnimalSpecies,
  BetaFeedback,
  BetaSignup,
  HealthRecord,
  StockItem,
  StockMovement,
  WeightRecord,
} from './tipler';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('suruyon.db');
    await initSchema(db);
  }
  return db;
}

async function initSchema(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS animals (
      id TEXT PRIMARY KEY NOT NULL,
      ear_tag TEXT NOT NULL,
      turkvet_no TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      breed TEXT NOT NULL DEFAULT '',
      sex TEXT NOT NULL DEFAULT 'female',
      birth_date TEXT NOT NULL DEFAULT '',
      paddock TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'healthy',
      mother_id TEXT,
      gehis_id TEXT,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS weight_records (
      id TEXT PRIMARY KEY NOT NULL,
      animal_id TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      recorded_at TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS health_records (
      id TEXT PRIMARY KEY NOT NULL,
      animal_id TEXT NOT NULL,
      record_type TEXT NOT NULL DEFAULT 'illness',
      symptoms TEXT NOT NULL DEFAULT '',
      diagnosis TEXT NOT NULL DEFAULT '',
      treatment TEXT NOT NULL DEFAULT '',
      medicine TEXT NOT NULL DEFAULT '',
      withdrawal_days INTEGER NOT NULL DEFAULT 0,
      vet_name TEXT NOT NULL DEFAULT '',
      recorded_at TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS stock_items (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'adet',
      min_quantity REAL NOT NULL DEFAULT 0,
      expiry_date TEXT,
      notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY NOT NULL,
      stock_id TEXT NOT NULL,
      movement_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      recorded_at TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS beta_signups (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      region TEXT NOT NULL,
      flock_size INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS beta_feedback (
      id TEXT PRIMARY KEY NOT NULL,
      farm_name TEXT NOT NULL DEFAULT '',
      region TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      rating INTEGER NOT NULL DEFAULT 5,
      category TEXT NOT NULL DEFAULT 'general',
      message TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
  `);
  try {
    await database.execAsync(`ALTER TABLE stock_movements ADD COLUMN notes TEXT NOT NULL DEFAULT ''`);
  } catch {
    /* sütun zaten var */
  }
  try {
    await database.execAsync(`ALTER TABLE animals ADD COLUMN species TEXT NOT NULL DEFAULT 'sheep'`);
  } catch {
    /* sütun zaten var */
  }
}

function rowToAnimal(row: Record<string, unknown>): Animal {
  return {
    id: row.id as string,
    earTag: row.ear_tag as string,
    turkvetNo: row.turkvet_no as string,
    name: row.name as string,
    breed: row.breed as string,
    species: ((row.species as AnimalSpecies) || 'sheep') as AnimalSpecies,
    sex: row.sex as Animal['sex'],
    birthDate: row.birth_date as string,
    paddock: row.paddock as string,
    status: row.status as Animal['status'],
    motherId: (row.mother_id as string) || null,
    gehisId: (row.gehis_id as string) || null,
    notes: row.notes as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    syncStatus: row.sync_status as Animal['syncStatus'],
  };
}

export async function countAnimals(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM animals');
  return row?.count ?? 0;
}

export async function getAnimals(filter?: { sex?: string; status?: string; search?: string }): Promise<Animal[]> {
  const database = await getDatabase();
  let query = 'SELECT * FROM animals WHERE 1=1';
  const params: string[] = [];
  if (filter?.sex) { query += ' AND sex = ?'; params.push(filter.sex); }
  if (filter?.status) { query += ' AND status = ?'; params.push(filter.status); }
  if (filter?.search) {
    query += ' AND (ear_tag LIKE ? OR name LIKE ? OR turkvet_no LIKE ?)';
    const term = `%${filter.search}%`;
    params.push(term, term, term);
  }
  query += ' ORDER BY ear_tag ASC';
  const rows = await database.getAllAsync<Record<string, unknown>>(query, params);
  return rows.map(rowToAnimal);
}

export async function getAnimal(id: string): Promise<Animal | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<Record<string, unknown>>('SELECT * FROM animals WHERE id = ?', [id]);
  return row ? rowToAnimal(row) : null;
}

export async function upsertAnimal(animal: Omit<Animal, 'createdAt' | 'updatedAt' | 'syncStatus'> & Partial<Pick<Animal, 'createdAt' | 'updatedAt' | 'syncStatus'>>): Promise<Animal> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const existing = await getAnimal(animal.id);
  const record: Animal = { ...animal, species: animal.species ?? existing?.species ?? 'sheep', createdAt: existing?.createdAt ?? animal.createdAt ?? now, updatedAt: now, syncStatus: 'pending' };
  await database.runAsync(
    `INSERT OR REPLACE INTO animals (id, ear_tag, turkvet_no, name, breed, species, sex, birth_date, paddock, status, mother_id, gehis_id, notes, created_at, updated_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [record.id, record.earTag, record.turkvetNo, record.name, record.breed, record.species ?? 'sheep', record.sex, record.birthDate, record.paddock, record.status, record.motherId, record.gehisId, record.notes, record.createdAt, record.updatedAt, record.syncStatus]
  );
  await enqueueSync('animals', record.id, existing ? 'update' : 'create', record);
  return record;
}

export async function deleteAnimal(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM animals WHERE id = ?', [id]);
  await enqueueSync('animals', id, 'delete', { id });
}

export async function getWeightRecords(animalId: string): Promise<WeightRecord[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<Record<string, unknown>>('SELECT * FROM weight_records WHERE animal_id = ? ORDER BY recorded_at DESC', [animalId]);
  return rows.map((row) => ({ id: row.id as string, animalId: row.animal_id as string, weightKg: row.weight_kg as number, recordedAt: row.recorded_at as string, notes: row.notes as string }));
}

export async function addWeightRecord(record: Omit<WeightRecord, 'id'> & { id?: string }): Promise<WeightRecord> {
  const database = await getDatabase();
  const full: WeightRecord = { ...record, id: record.id ?? uuidv4() };
  await database.runAsync('INSERT INTO weight_records (id, animal_id, weight_kg, recorded_at, notes) VALUES (?, ?, ?, ?, ?)', [full.id, full.animalId, full.weightKg, full.recordedAt, full.notes]);
  return full;
}

export async function getLatestWeight(animalId: string): Promise<number | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ weight_kg: number }>('SELECT weight_kg FROM weight_records WHERE animal_id = ? ORDER BY recorded_at DESC LIMIT 1', [animalId]);
  return row?.weight_kg ?? null;
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
  const database = await getDatabase();
  const query = animalId
    ? `SELECT h.*, a.ear_tag FROM health_records h JOIN animals a ON a.id = h.animal_id WHERE h.animal_id = ? ORDER BY h.recorded_at DESC`
    : `SELECT h.*, a.ear_tag FROM health_records h JOIN animals a ON a.id = h.animal_id ORDER BY h.recorded_at DESC LIMIT 50`;
  const rows = await database.getAllAsync<Record<string, unknown>>(query, animalId ? [animalId] : []);
  return rows.map((row) => ({
    id: row.id as string, animalId: row.animal_id as string, recordType: row.record_type as HealthRecord['recordType'],
    symptoms: row.symptoms as string, diagnosis: row.diagnosis as string, treatment: row.treatment as string,
    medicine: row.medicine as string, withdrawalDays: row.withdrawal_days as number, vetName: row.vet_name as string,
    recordedAt: row.recorded_at as string, notes: row.notes as string, earTag: row.ear_tag as string,
  }));
}

export async function addHealthRecord(record: Omit<HealthRecord, 'id'> & { id?: string }): Promise<HealthRecord> {
  const database = await getDatabase();
  const full: HealthRecord = { ...record, id: record.id ?? uuidv4() };
  await database.runAsync(
    `INSERT INTO health_records (id, animal_id, record_type, symptoms, diagnosis, treatment, medicine, withdrawal_days, vet_name, recorded_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [full.id, full.animalId, full.recordType, full.symptoms, full.diagnosis, full.treatment, full.medicine, full.withdrawalDays, full.vetName, full.recordedAt, full.notes]
  );
  if (full.recordType === 'illness') {
    const animal = await getAnimal(full.animalId);
    if (animal && animal.status === 'healthy') await upsertAnimal({ ...animal, status: 'sick' });
  }
  return full;
}

export async function getActiveWithdrawals(): Promise<(HealthRecord & { earTag: string })[]> {
  const records = await getHealthRecords();
  const now = Date.now();
  return records.filter((r) => r.withdrawalDays && r.medicine && new Date(r.recordedAt).getTime() + r.withdrawalDays * 86400000 > now) as (HealthRecord & { earTag: string })[];
}

export async function getStockItems(type?: string): Promise<StockItem[]> {
  const database = await getDatabase();
  const query = type ? 'SELECT * FROM stock_items WHERE type = ? ORDER BY name ASC' : 'SELECT * FROM stock_items ORDER BY type ASC, name ASC';
  const rows = await database.getAllAsync<Record<string, unknown>>(query, type ? [type] : []);
  return rows.map((row) => ({ id: row.id as string, name: row.name as string, type: row.type as StockItem['type'], quantity: row.quantity as number, unit: row.unit as string, minQuantity: row.min_quantity as number, expiryDate: (row.expiry_date as string) || null, notes: row.notes as string }));
}

export async function upsertStockItem(item: Omit<StockItem, 'id'> & { id?: string }): Promise<StockItem> {
  const database = await getDatabase();
  const full: StockItem = { ...item, id: item.id ?? uuidv4() };
  await database.runAsync(`INSERT OR REPLACE INTO stock_items (id, name, type, quantity, unit, min_quantity, expiry_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [full.id, full.name, full.type, full.quantity, full.unit, full.minQuantity, full.expiryDate, full.notes]);
  return full;
}

export async function adjustStock(stockId: string, movementType: 'in' | 'out', quantity: number, notes = ''): Promise<void> {
  const item = (await getStockItems()).find((s) => s.id === stockId);
  if (!item) return;
  const delta = movementType === 'in' ? quantity : -quantity;
  await upsertStockItem({ ...item, quantity: Math.max(0, item.quantity + delta) });
  const database = await getDatabase();
  await database.runAsync('INSERT INTO stock_movements (id, stock_id, movement_type, quantity, recorded_at, notes) VALUES (?, ?, ?, ?, ?, ?)', [uuidv4(), stockId, movementType, quantity, new Date().toISOString(), notes]);
}

export async function getLowStockItems(): Promise<StockItem[]> {
  return (await getStockItems()).filter((i) => i.quantity <= i.minQuantity);
}

export async function getStockMovements(filter?: {
  stockId?: string;
  from?: string;
  to?: string;
}): Promise<StockMovement[]> {
  const database = await getDatabase();
  let rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM stock_movements ORDER BY recorded_at DESC'
  );
  let list = rows.map((r) => ({
    id: r.id as string,
    stockId: r.stock_id as string,
    movementType: r.movement_type as StockMovement['movementType'],
    quantity: r.quantity as number,
    recordedAt: r.recorded_at as string,
    notes: (r.notes as string) ?? '',
  }));
  if (filter?.stockId) list = list.filter((m) => m.stockId === filter.stockId);
  if (filter?.from) {
    const t = new Date(filter.from).getTime();
    list = list.filter((m) => new Date(m.recordedAt).getTime() >= t);
  }
  if (filter?.to) {
    const t = new Date(filter.to).getTime();
    list = list.filter((m) => new Date(m.recordedAt).getTime() <= t);
  }
  return list;
}

export async function countAnimalsInPaddock(paddock: string): Promise<number> {
  const p = paddock.trim();
  if (!p) return countAnimals();
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM animals WHERE paddock = ?',
    [p]
  );
  return row?.c ?? 0;
}

export async function addBetaSignup(signup: Omit<BetaSignup, 'id' | 'createdAt'>): Promise<BetaSignup> {
  const database = await getDatabase();
  const full: BetaSignup = { ...signup, id: uuidv4(), createdAt: new Date().toISOString() };
  await database.runAsync('INSERT INTO beta_signups (id, name, phone, region, flock_size, created_at) VALUES (?, ?, ?, ?, ?, ?)', [full.id, full.name, full.phone, full.region, full.flockSize, full.createdAt]);
  return full;
}

export async function getBetaSignups(): Promise<BetaSignup[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<Record<string, unknown>>('SELECT * FROM beta_signups ORDER BY created_at DESC');
  return rows.map((row) => ({ id: row.id as string, name: row.name as string, phone: row.phone as string, region: row.region as string, flockSize: row.flock_size as number, createdAt: row.created_at as string }));
}

export async function addBetaFeedback(feedback: Omit<BetaFeedback, 'id' | 'createdAt'>): Promise<BetaFeedback> {
  const database = await getDatabase();
  const full: BetaFeedback = { ...feedback, id: uuidv4(), createdAt: new Date().toISOString() };
  await database.runAsync('INSERT INTO beta_feedback (id, farm_name, region, phone, rating, category, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [full.id, full.farmName, full.region, full.phone, full.rating, full.category, full.message, full.createdAt]);
  return full;
}

export async function getBetaFeedback(): Promise<BetaFeedback[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<Record<string, unknown>>('SELECT * FROM beta_feedback ORDER BY created_at DESC');
  return rows.map((row) => ({ id: row.id as string, farmName: row.farm_name as string, region: row.region as string, phone: row.phone as string, rating: row.rating as number, category: row.category as string, message: row.message as string, createdAt: row.created_at as string }));
}

export async function getPendingSyncCount(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sync_queue');
  return row?.count ?? 0;
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
  const database = await getDatabase();
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM sync_queue ORDER BY created_at ASC'
  );
  return rows.map((row) => ({
    id: row.id as string,
    tableName: row.table_name as string,
    recordId: row.record_id as string,
    action: row.action as string,
    payload: row.payload as string,
    createdAt: row.created_at as string,
  }));
}

export async function flushSyncQueue(): Promise<number> {
  const database = await getDatabase();
  const n = await getPendingSyncCount();
  await database.runAsync('DELETE FROM sync_queue');
  return n;
}

async function enqueueSync(tableName: string, recordId: string, action: string, payload: unknown): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('INSERT INTO sync_queue (id, table_name, record_id, action, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)', [uuidv4(), tableName, recordId, action, JSON.stringify(payload), new Date().toISOString()]);
}

export async function exportTurkvetData(): Promise<string> {
  const animals = await getAnimals();
  return JSON.stringify({ version: '1.0', source: 'SuruYon', exportedAt: new Date().toISOString(), animals: animals.map((a) => ({ turkvetNo: a.turkvetNo, earTag: a.earTag, gehisId: a.gehisId, species: a.species === 'goat' ? 'caprine' : 'ovine', breed: a.breed, sex: a.sex, birthDate: a.birthDate, status: a.status, motherTurkvetNo: a.motherId, lastUpdated: a.updatedAt })) }, null, 2);
}

export async function clearAllStorage(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM sync_queue; DELETE FROM stock_movements; DELETE FROM stock_items; DELETE FROM health_records; DELETE FROM weight_records; DELETE FROM animals; DELETE FROM beta_signups; DELETE FROM beta_feedback;');
}
