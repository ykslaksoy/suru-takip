/** Hızlı tartım ekranında son kullanılan kuzu / kilo yöntemi (global tercihe ek, oturumlar arası) */
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import type { KuzuSecimYontemi, TartimGirisYontemi } from '@/kaynak/giris-yontemi';
import { etkinKuzuSecim, etkinTartimGiris, type TartimGirisYontemi as TartimId } from '@/kaynak/giris-yontemi';

function hizliTartimTartimYontem(id: TartimId): TartimId {
  if (id === 'manuel' || id === 'sesle-kilo' || id === 'baskul' || id === 'baskul-ocr') return id;
  return etkinTartimGiris(id);
}

const KEY = 'sy_hizli_tartim_yontem_v1';

export type HizliTartimKuzuYontem = KuzuSecimYontemi | 'liste';

export type HizliTartimYontemTercih = {
  kuzu: HizliTartimKuzuYontem;
  tartim: TartimGirisYontemi;
};

export const VARSAYILAN_HIZLI_TARTIM_YONTEM: HizliTartimYontemTercih = {
  kuzu: 'manuel',
  tartim: 'manuel',
};

export async function getHizliTartimYontem(
  globalKuzu: KuzuSecimYontemi,
  globalTartim: TartimGirisYontemi,
): Promise<HizliTartimYontemTercih> {
  const raw = await kaliciGetItem(KEY);
  const fb: HizliTartimYontemTercih = {
    kuzu: globalKuzu === 'otomatik-tanima' ? 'manuel' : (globalKuzu as HizliTartimKuzuYontem),
    tartim: hizliTartimTartimYontem(globalTartim),
  };
  if (!raw) return fb;
  try {
    const p = JSON.parse(raw) as Partial<HizliTartimYontemTercih>;
    const kuzu = p.kuzu === 'liste' ? 'liste' : etkinKuzuSecim((p.kuzu as KuzuSecimYontemi) ?? globalKuzu);
    const tartim = hizliTartimTartimYontem((p.tartim as TartimGirisYontemi) ?? globalTartim);
    return { kuzu: kuzu === 'otomatik-tanima' ? 'manuel' : (kuzu as HizliTartimKuzuYontem), tartim };
  } catch {
    return fb;
  }
}

export async function saveHizliTartimYontem(t: HizliTartimYontemTercih): Promise<void> {
  await kaliciSetItem(KEY, JSON.stringify(t));
}
