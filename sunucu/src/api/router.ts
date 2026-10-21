import type { IncomingMessage, ServerResponse } from 'node:http';
import { tenantCount, tenantSyncPush, tenantSyncCount } from '../servisler/tenant-store.js';

const JSON_CT = 'application/json; charset=utf-8';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': JSON_CT });
  res.end(JSON.stringify(body));
}

function apiKeyOk(req: IncomingMessage): boolean {
  const expected = String(process.env.SYNC_API_KEY ?? '').trim();
  if (!expected) return true;
  const auth = String(req.headers.authorization ?? '');
  if (auth === `Bearer ${expected}`) return true;
  const header = String(req.headers['x-sync-api-key'] ?? '');
  return header === expected;
}

function tenantFromRequest(req: IncomingMessage): string | null {
  const raw =
    String(req.headers['x-tenant-id'] ?? '').trim() ||
    String(req.headers['x-superkuzu-tenant'] ?? '').trim();
  if (!raw || raw.length > 128) return null;
  return raw;
}

export async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const host = req.headers.host ?? 'localhost';
  const url = new URL(req.url ?? '/', `http://${host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'superkuzu-sunucu',
      mode: 'mvp-stub',
      tenants: tenantCount(),
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/v1/sync') {
    if (!apiKeyOk(req)) {
      sendJson(res, 401, { ok: false, error: 'unauthorized' });
      return;
    }
    const tenantId = tenantFromRequest(req);
    if (!tenantId) {
      sendJson(res, 400, { ok: false, error: 'missing_tenant', hint: 'X-Tenant-Id header' });
      return;
    }
    let parsed: { entries?: unknown };
    try {
      parsed = JSON.parse(await readBody(req)) as { entries?: unknown };
    } catch {
      sendJson(res, 400, { ok: false, error: 'invalid_json' });
      return;
    }
    if (!Array.isArray(parsed.entries)) {
      sendJson(res, 400, { ok: false, error: 'entries_required' });
      return;
    }
    const entries = parsed.entries
      .filter((e): e is Record<string, unknown> => e !== null && typeof e === 'object')
      .map((e) => ({
        id: String(e.id ?? ''),
        tableName: String(e.tableName ?? e.table_name ?? ''),
        recordId: String(e.recordId ?? e.record_id ?? ''),
        action: String(e.action ?? 'upsert'),
        payload: e.payload ?? null,
        createdAt: String(e.createdAt ?? e.created_at ?? new Date().toISOString()),
      }))
      .filter((e) => e.id && e.tableName);

    const accepted = tenantSyncPush(tenantId, entries);
    sendJson(res, 200, {
      ok: true,
      tenantId,
      accepted,
      totalForTenant: tenantSyncCount(tenantId),
      note: 'MVP stub — veriler bellekte; kalıcı depo ve çakışma çözümü yok.',
    });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'not_found' });
}
