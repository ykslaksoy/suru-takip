/**
 * Besi programı — kullanıcının seçtiği satış ufku (gün).
 * Phase 1: 90 gün (varsayılan) veya 90+30 = 120 gün tavan.
 */

import {
  BESI_EK_SURE_GUN,
  BESI_PLAN_TAVAN_GUN,
  BESI_SATIS_UFUK_GUN,
  HIZLI_BESI_TAKVIM,
  HIZLI_BESI_YEM_TAKVIM,
  type BesiTakvimSatir,
  type YemTakvimSatir,
} from '@/kaynak/akilli-veteriner/hizli-besi-plani';

export {
  BESI_EK_SURE_GUN,
  BESI_PLAN_TAVAN_GUN,
  BESI_SATIS_UFUK_GUN,
} from '@/kaynak/akilli-veteriner/hizli-besi-plani';

export const BESI_UFUK_DEPOLAMA_ANAHTAR = 'sy_besi_program_ufuk_v1';

export type BesiUfukSecenek = {
  gun: number;
  baslik: string;
  aciklama: string;
};

/** Hızlı kabul öncesi seçilebilir ufuklar */
export const BESI_UFUK_SECENEKLERI: readonly BesiUfukSecenek[] = [
  {
    gun: BESI_SATIS_UFUK_GUN,
    baslik: `~${BESI_SATIS_UFUK_GUN} gün`,
    aciklama: 'Tipik satış ufku — minimum standart aşı + 15 günde bir tartım',
  },
  {
    gun: BESI_PLAN_TAVAN_GUN,
    baslik: `~${BESI_PLAN_TAVAN_GUN} gün (+${BESI_EK_SURE_GUN})`,
    aciklama: 'Zayıf veya geç satış — ek süre sonuna kadar kontroller',
  },
];

export function varsayilanBesiUfukGun(): number {
  return BESI_SATIS_UFUK_GUN;
}

/** Geçerli ufuk: bilinen seçenek veya 1…tavan arası */
export function normalizeBesiUfukGun(gun: number): number {
  const n = Math.floor(gun);
  const izin = new Set(BESI_UFUK_SECENEKLERI.map((s) => s.gun));
  if (izin.has(n)) return n;
  if (n >= 1 && n <= BESI_PLAN_TAVAN_GUN) return n;
  if (n > BESI_PLAN_TAVAN_GUN) return BESI_PLAN_TAVAN_GUN;
  return varsayilanBesiUfukGun();
}

async function depo() {
  return import('@/kaynak/cekirdek/web-kalici-depo');
}

export async function besiUfukGunOku(): Promise<number> {
  try {
    const { kaliciGetItem } = await depo();
    const raw = await kaliciGetItem(BESI_UFUK_DEPOLAMA_ANAHTAR);
    if (!raw) return varsayilanBesiUfukGun();
    const p = JSON.parse(raw) as { ufukGun?: number };
    if (typeof p?.ufukGun !== 'number') return varsayilanBesiUfukGun();
    return normalizeBesiUfukGun(p.ufukGun);
  } catch {
    return varsayilanBesiUfukGun();
  }
}

export async function besiUfukGunKaydet(gun: number): Promise<number> {
  const ufukGun = normalizeBesiUfukGun(gun);
  const { kaliciSetItem } = await depo();
  await kaliciSetItem(
    BESI_UFUK_DEPOLAMA_ANAHTAR,
    JSON.stringify({ ufukGun, kaydedildiAt: new Date().toISOString() }),
  );
  return ufukGun;
}

export function takvimSatirlariUfukta(ufukGun: number): BesiTakvimSatir[] {
  const u = normalizeBesiUfukGun(ufukGun);
  return HIZLI_BESI_TAKVIM.filter((s) => s.gun <= u);
}

export function yemSatirlariUfukta(ufukGun: number): YemTakvimSatir[] {
  const u = normalizeBesiUfukGun(ufukGun);
  return HIZLI_BESI_YEM_TAKVIM.filter((s) => s.gun <= u);
}

export function besiPlanMesajUfukta(ufukGun: number): string {
  const u = normalizeBesiUfukGun(ufukGun);
  if (u >= BESI_PLAN_TAVAN_GUN) {
    return `Satışa kadar plan (~${BESI_SATIS_UFUK_GUN}+${BESI_EK_SURE_GUN} gün)`;
  }
  return `Satışa kadar plan (~${u} gün)`;
}
