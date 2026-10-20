/** MVP: in-memory sync inbox per tenant (production → PostgreSQL). */

export type SyncQueuePayload = {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  payload: unknown;
  createdAt: string;
};

const store = new Map<string, SyncQueuePayload[]>();

export function tenantSyncPush(tenantId: string, entries: SyncQueuePayload[]): number {
  const key = tenantId.trim();
  if (!key) return 0;
  const bucket = store.get(key) ?? [];
  bucket.push(...entries);
  store.set(key, bucket);
  return entries.length;
}

export function tenantSyncCount(tenantId: string): number {
  return store.get(tenantId.trim())?.length ?? 0;
}

export function tenantCount(): number {
  return store.size;
}
