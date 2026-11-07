import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import type { YemKaynagiTercih } from './yem-kaynagi';

const KEY = 'sy_besleme_yem_kaynagi_v1';

export async function yemKaynagiOku(): Promise<YemKaynagiTercih> {
  const raw = await kaliciGetItem(KEY);
  if (raw === 'uretim' || raw === 'ticari' || raw === 'her_ikisi') return raw;
  return 'her_ikisi';
}

export async function yemKaynagiKaydet(v: YemKaynagiTercih): Promise<void> {
  await kaliciSetItem(KEY, v);
}
