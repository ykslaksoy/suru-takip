import type { BesiPlanSenaryo } from '@/kaynak/maliyet/besi-plan-tipler';

/** Onaylı kayıt üzerine taslak yazımına izin verilmez */
export function besiPlanTaslakYazilabilirMi(mevcut?: BesiPlanSenaryo): boolean {
  return mevcut?.durum !== 'onayli';
}
