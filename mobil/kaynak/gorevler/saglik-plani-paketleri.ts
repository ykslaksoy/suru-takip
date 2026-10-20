/**
 * Mod bazlı önerilen aşı paketleri — test / plan ekranı (AsyncStorage bağımlılığı yok).
 */
import { getMod, type UrunModId } from '@/sabitler/ModlarSabit';
import type { SaglikPlani } from './saglik-plani';

export const VETERINER_ONERI_NOTU =
  'Öneridir; işletmenize özel program için veteriner hekiminize danışın.';

export const ONERILEN_PLAN_MOD1: SaglikPlani = {
  asi: ['karma', 'cicek', 'ppr', 'pasteurella', 'sarbon', 'brusella', 'sap'],
  parazit: ['ivermektin', 'albendazol'],
  vitamin: ['selen-e'],
};

const BESI_GIRIS: Pick<SaglikPlani, 'asi' | 'parazit' | 'vitamin'> = {
  asi: ['karma'],
  parazit: ['ivermektin', 'albendazol'],
  vitamin: ['selen-e'],
};

const GEbe_ONDOGUM_ASI = ['karma', 'cicek', 'ppr', 'brusella'] as const;

const DAMIZLIK: SaglikPlani = {
  asi: ['karma', 'cicek', 'ppr', 'brusella'],
  parazit: ['ivermektin', 'albendazol'],
  vitamin: ['selen-e'],
};

const SUT_TABAN_ASI = ['karma', 'cicek', 'ppr', 'pasteurella', 'agalaksi', 'ektima'] as const;

function sutPaketi(): SaglikPlani {
  return {
    asi: [...SUT_TABAN_ASI],
    parazit: ['ivermektin', 'albendazol'],
    vitamin: ['selen-e'],
  };
}

function mod2Paketi(): SaglikPlani {
  const asi = [...new Set([...BESI_GIRIS.asi, ...GEbe_ONDOGUM_ASI])];
  return {
    asi,
    parazit: [...BESI_GIRIS.parazit],
    vitamin: [...BESI_GIRIS.vitamin],
  };
}

/** Mod 5: süt sürüsü paketi + satın alım besi giriş paketi (Mod 1). */
function mod5Paketi(): SaglikPlani {
  const sut = sutPaketi();
  return {
    asi: [...new Set([...sut.asi, ...BESI_GIRIS.asi])],
    parazit: [...new Set([...sut.parazit, ...BESI_GIRIS.parazit])],
    vitamin: [...new Set([...sut.vitamin, ...BESI_GIRIS.vitamin])],
  };
}

function mod7Paketi(): SaglikPlani {
  const sut = sutPaketi();
  const etc = mod2Paketi();
  return {
    asi: [...new Set([...sut.asi, ...etc.asi])],
    parazit: [...new Set([...sut.parazit, ...etc.parazit])],
    vitamin: [...new Set([...sut.vitamin, ...etc.vitamin])],
  };
}

export const ONERILEN_PLANLAR: Record<UrunModId, SaglikPlani> = {
  mod1: ONERILEN_PLAN_MOD1,
  mod2: mod2Paketi(),
  mod3: DAMIZLIK,
  mod4: sutPaketi(),
  mod5: mod5Paketi(),
  mod6: DAMIZLIK,
  mod7: mod7Paketi(),
};

export function onerilenPlanModEtiketi(modId: UrunModId): string {
  return getMod(modId).baslik;
}
