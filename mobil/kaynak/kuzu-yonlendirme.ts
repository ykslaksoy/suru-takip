/**
 * Süt sürüsünde doğan kuzular — damızlık / besi hedefi (Mod 5 & 7).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KuzuYonHedef } from '@/kaynak/kuzu-hedef-sabit';

export type { KuzuYonHedef } from '@/kaynak/kuzu-hedef-sabit';
export {
  yasAy,
  satinAlinanKuzuMu,
  besiYolundaMi,
  sutDoganKuzuAdaylari,
  sutDisiAnneIds,
} from '@/kaynak/kuzu-hedef-sabit';

const KEY = 'sy_kuzu_yon_hedef';

export async function getKuzuYonHedefMap(): Promise<Record<string, KuzuYonHedef>> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, KuzuYonHedef>;
  } catch {
    return {};
  }
}

async function saveMap(m: Record<string, KuzuYonHedef>): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(m));
}

export async function setKuzuYonHedefBulk(ids: string[], hedef: KuzuYonHedef): Promise<void> {
  const m = await getKuzuYonHedefMap();
  for (const id of ids) m[id] = hedef;
  await saveMap(m);
  if (hedef === 'damizlik') {
    const { getAnimals, upsertAnimal } = await import('@/kaynak/cekirdek/veritabani');
    for (const id of ids) {
      const a = (await getAnimals()).find((x) => x.id === id);
      if (!a) continue;
      if (!/damızlık|damizlik/i.test(a.notes)) {
        await upsertAnimal({
          ...a,
          notes: `${a.notes ? `${a.notes} · ` : ''}damızlık aday`,
        });
      }
    }
  }
}

export async function besiyeAlKuzular(ids: string[], padok = 'Besi'): Promise<number> {
  if (!ids.length) return 0;
  await setKuzuYonHedefBulk(ids, 'besi');
  const { besiyeAlToplu } = await import('@/kaynak/besi-koc-kat');
  return besiyeAlToplu(ids, padok);
}
