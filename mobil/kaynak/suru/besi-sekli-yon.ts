/**
 * Besi şekli — tek kaynak: aşı ortam profili (`sy_asi_profil_v1`).
 * Harita / padok planı yönlendirmesi buradan okunur; çiftlik tercihi sessizce değiştirilmez.
 */
import {
  BESI_SECENEKLER,
  profilKaydet,
  profilOku,
  type BesiSekli as ProfilBesiSekli,
  type AsiOrtamProfili,
} from '@/kaynak/akilli-veteriner/asi-modu';

export type { BesiSekli, HaritaHedef } from '@/kaynak/suru/besi-sekli-rota';
export {
  BESI_SECENEKLER,
  haritaGirisEtiketi,
  haritaGirisIpucu,
  haritaHedefRotasi,
  icBesiModu,
  meraHaritasiUygun,
} from '@/kaynak/suru/besi-sekli-rota';

import type { BesiSekli } from '@/kaynak/suru/besi-sekli-rota';

export async function besiSekliOku(): Promise<BesiSekli> {
  return (await profilOku()).besiSekli as ProfilBesiSekli;
}

export async function besiSekliKaydet(sekil: BesiSekli): Promise<void> {
  const profil: AsiOrtamProfili = { ...(await profilOku()), besiSekli: sekil };
  await profilKaydet(profil);
}
