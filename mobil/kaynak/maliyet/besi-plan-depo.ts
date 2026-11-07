import { v4 as uuidv4 } from 'uuid';
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import type { BesiPlanDepo, BesiPlanSenaryo } from '@/kaynak/maliyet/besi-plan-tipler';

const KEY = 'sy_besi_plan_senaryo_v1';

const BOS: BesiPlanDepo = { surum: 1, senaryolar: [] };

export async function getBesiPlanDepo(): Promise<BesiPlanDepo> {
  const raw = await kaliciGetItem(KEY);
  if (!raw) return { ...BOS };
  try {
    const p = JSON.parse(raw) as BesiPlanDepo;
    if (p?.surum !== 1 || !Array.isArray(p.senaryolar)) return { ...BOS };
    return p;
  } catch {
    return { ...BOS };
  }
}

async function yaz(depo: BesiPlanDepo): Promise<void> {
  await kaliciSetItem(KEY, JSON.stringify(depo));
}

export function parseBesiPlanDepo(raw: string): BesiPlanDepo {
  return JSON.parse(raw) as BesiPlanDepo;
}

export async function kaydetBesiPlanTaslak(
  girdi: Omit<BesiPlanSenaryo, 'id' | 'surum' | 'durum' | 'olusturma' | 'guncelleme' | 'onayTarihi'> & {
    id?: string;
  },
): Promise<BesiPlanSenaryo> {
  const depo = await getBesiPlanDepo();
  const now = new Date().toISOString();
  const mevcut = girdi.id ? depo.senaryolar.find((s) => s.id === girdi.id) : undefined;
  const kayit: BesiPlanSenaryo = {
    ...girdi,
    id: mevcut?.id ?? girdi.id ?? uuidv4(),
    surum: (mevcut?.surum ?? 0) + 1,
    durum: 'taslak',
    olusturma: mevcut?.olusturma ?? now,
    guncelleme: now,
  };
  const idx = depo.senaryolar.findIndex((s) => s.id === kayit.id);
  if (idx >= 0) depo.senaryolar[idx] = kayit;
  else depo.senaryolar.push(kayit);
  await yaz(depo);
  return kayit;
}

export async function onaylaBesiPlanSenaryo(id: string, onayNotu?: string): Promise<BesiPlanSenaryo | null> {
  const depo = await getBesiPlanDepo();
  const s = depo.senaryolar.find((x) => x.id === id);
  if (!s || s.durum === 'iptal') return null;
  s.durum = 'onayli';
  s.onayTarihi = new Date().toISOString();
  s.onayNotu = onayNotu ?? 'Plan onaylandı — gerçek yem tüketimi başlamaz.';
  s.guncelleme = s.onayTarihi;
  await yaz(depo);
  return s;
}

export async function iptalBesiPlanSenaryo(id: string): Promise<void> {
  const depo = await getBesiPlanDepo();
  const s = depo.senaryolar.find((x) => x.id === id);
  if (!s) return;
  s.durum = 'iptal';
  s.guncelleme = new Date().toISOString();
  await yaz(depo);
}
