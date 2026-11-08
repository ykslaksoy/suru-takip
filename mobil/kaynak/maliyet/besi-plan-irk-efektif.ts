import type { BesiPlanIrkTaslak } from './besi-plan-irk';
import type { BesiPlanGercekOlcum } from './besi-plan-gercek-olcum';

export function irkTaslakHesapIcin(taslak: BesiPlanIrkTaslak, gercek: BesiPlanGercekOlcum | null): BesiPlanIrkTaslak {
  if (!gercek) {
    return {
      ...taslak,
      planBasSayisi: null,
      bilinenIrkBas: null,
      olcumGcaaGramGun: null,
      olcumBas: null,
      olcumBit: null,
      pazarUyumDususYuzde: null,
    };
  }
  return {
    ...taslak,
    planBasSayisi: gercek.planBasSayisi,
    bilinenIrkBas: gercek.bilinenIrkBas,
    olcumGcaaGramGun: gercek.olcumGcaaGramGun,
    olcumBas: gercek.olcumBas,
    olcumBit: gercek.olcumBit,
    pazarUyumDususYuzde: null,
  };
}
