import { birlesBesiModel, type BesiModelBirlesik } from './besi-model-birles';
import { varsayilanBesiModel } from './besi-model-birles';

let onbellek: { model: BesiModelBirlesik; alindi: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function getBesiTeknikModel(force = false): Promise<BesiModelBirlesik> {
  const now = Date.now();
  if (!force && onbellek && now - onbellek.alindi < TTL_MS) return onbellek.model;
  try {
    const r = await fetch('/api/besi/model', { method: 'GET', headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(String(r.status));
    const j = (await r.json()) as { ok?: boolean; model?: unknown };
    if (!j.ok || j.model == null) throw new Error('model yok');
    const model = birlesBesiModel(j.model, {
      id: (j.model as BesiModelBirlesik).adminSurumId,
      guncelleme: (j.model as BesiModelBirlesik).guncelleme,
    });
    onbellek = { model, alindi: now };
    return model;
  } catch {
    const model = varsayilanBesiModel();
    onbellek = { model, alindi: now };
    return model;
  }
}

export function besiModelOnbellekTemizle() {
  onbellek = null;
}
