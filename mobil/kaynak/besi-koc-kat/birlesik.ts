import {
  MOD2_ADIMLAR,
  getMod2Ilerleme,
  type Mod2AdimId,
  type Mod2Adim,
} from './adim-kilidi';
import { tespitMod2VeriDurumu, type Mod2AdimKanit, type Mod2VeriDurum } from './veri-ilerleme';

export type Mod2BirlesikIlerleme = {
  tamamlanan: Mod2AdimId[];
  kaynak: Partial<Record<Mod2AdimId, 'veri' | 'manuel'>>;
  kanitlar: Mod2AdimKanit[];
  ozet: Mod2VeriDurum['ozet'];
};

export async function getMod2BirlesikIlerleme(): Promise<Mod2BirlesikIlerleme> {
  const [manuel, veri] = await Promise.all([getMod2Ilerleme(), tespitMod2VeriDurumu()]);
  const autoSet = new Set(veri.otomatikTamamlanan);
  const manuelSet = new Set(manuel.tamamlanan);
  const tamamlanan: Mod2AdimId[] = [];
  const kaynak: Partial<Record<Mod2AdimId, 'veri' | 'manuel'>> = {};

  for (const adim of MOD2_ADIMLAR) {
    const oncekiOk =
      adim.sira === 0 ||
      MOD2_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
    if (!oncekiOk) break;

    if (autoSet.has(adim.id)) {
      tamamlanan.push(adim.id);
      kaynak[adim.id] = 'veri';
    } else if (manuelSet.has(adim.id)) {
      tamamlanan.push(adim.id);
      kaynak[adim.id] = 'manuel';
    } else {
      break;
    }
  }

  return { tamamlanan, kaynak, kanitlar: veri.kanitlar, ozet: veri.ozet };
}

export function adimAcikMiMod2(adim: Mod2Adim, tamamlanan: Mod2AdimId[]): boolean {
  if (adim.sira === 0) return true;
  return MOD2_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
}

export function sonrakiAcikAdimMod2(tamamlanan: Mod2AdimId[]): Mod2Adim | null {
  return (
    MOD2_ADIMLAR.find((a) => adimAcikMiMod2(a, tamamlanan) && !tamamlanan.includes(a.id)) ?? null
  );
}
