import { MOD6_ADIMLAR, getMod6Ilerleme, type Mod6AdimId } from './adim-kilidi';
import { tespitMod6VeriDurumu, type Mod6AdimKanit, type Mod6VeriDurum } from './veri-ilerleme';

export type Mod6BirlesikIlerleme = {
  tamamlanan: Mod6AdimId[];
  kaynak: Partial<Record<Mod6AdimId, 'veri' | 'manuel'>>;
  kanitlar: Mod6AdimKanit[];
  ozet: Mod6VeriDurum['ozet'];
};

export async function getMod6BirlesikIlerleme(): Promise<Mod6BirlesikIlerleme> {
  const [manuel, veri] = await Promise.all([getMod6Ilerleme(), tespitMod6VeriDurumu()]);
  const autoSet = new Set(veri.otomatikTamamlanan);
  const manuelSet = new Set(manuel.tamamlanan);
  const tamamlanan: Mod6AdimId[] = [];
  const kaynak: Partial<Record<Mod6AdimId, 'veri' | 'manuel'>> = {};

  for (const adim of MOD6_ADIMLAR) {
    const oncekiOk =
      adim.sira === 0 ||
      MOD6_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
    if (!oncekiOk) break;
    if (autoSet.has(adim.id)) {
      tamamlanan.push(adim.id);
      kaynak[adim.id] = 'veri';
    } else if (manuelSet.has(adim.id)) {
      tamamlanan.push(adim.id);
      kaynak[adim.id] = 'manuel';
    } else break;
  }

  return { tamamlanan, kaynak, kanitlar: veri.kanitlar, ozet: veri.ozet };
}
