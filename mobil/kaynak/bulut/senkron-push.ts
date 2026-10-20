import type { SyncQueueEntry } from '@/kaynak/cekirdek/veritabani';
import { getIsletmeProfil } from '@/kaynak/cekirdek/isletme-profil';
import { bulutApiSyncKey, bulutApiUrl } from '@/kaynak/bulut/api-url';

export type SenkronPushSonuc =
  | { ok: true; accepted: number }
  | { ok: false; mesaj: string };

async function tenantAnahtari(): Promise<string> {
  const profil = await getIsletmeProfil();
  const ad = profil.isletmeAdi.trim().toLowerCase().replace(/\s+/g, '-');
  if (ad.length >= 2) return `isletme:${ad}`;
  const tel = (profil.telefon ?? '').replace(/\D/g, '');
  if (tel.length >= 10) return `tel:${tel.slice(-10)}`;
  return 'anon:yerel-cihaz';
}

function entryToJson(e: SyncQueueEntry) {
  let payload: unknown = e.payload;
  try {
    payload = JSON.parse(e.payload);
  } catch {
    /* ham string */
  }
  return {
    id: e.id,
    tableName: e.tableName,
    recordId: e.recordId,
    action: e.action,
    payload,
    createdAt: e.createdAt,
  };
}

/**
 * Bekleyen kuyruk kayıtlarını sunucu stub'a POST eder.
 * Başarısızlıkta kuyruk yerelde kalır (flush yapılmaz).
 */
export async function bulutaSenkronKuyruguGonder(
  entries: SyncQueueEntry[],
): Promise<SenkronPushSonuc> {
  const base = bulutApiUrl();
  if (!base) {
    return { ok: false, mesaj: 'API URL tanımlı değil.' };
  }
  if (entries.length === 0) {
    return { ok: true, accepted: 0 };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': await tenantAnahtari(),
  };
  const key = bulutApiSyncKey();
  if (key) headers.Authorization = `Bearer ${key}`;

  const url = `${base}/api/v1/sync`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        clientSentAt: new Date().toISOString(),
        entries: entries.map(entryToJson),
      }),
    });
    const text = await res.text();
    let body: { ok?: boolean; accepted?: number; error?: string } = {};
    try {
      body = JSON.parse(text) as typeof body;
    } catch {
      /* */
    }
    if (!res.ok || body.ok === false) {
      const err = body.error ?? res.statusText ?? 'sync_failed';
      return { ok: false, mesaj: `Bulut API reddetti (${res.status}): ${err}` };
    }
    return { ok: true, accepted: body.accepted ?? entries.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, mesaj: `Bulut API erişilemedi: ${msg}` };
  }
}
