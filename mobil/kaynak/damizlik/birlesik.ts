import { MOD3_ADIMLAR, getMod3Ilerleme, type Mod3AdimId } from './adim-kilidi';
import { tespitMod3VeriDurumu, type Mod3AdimKanit, type Mod3VeriDurum } from './veri-ilerleme';

export type Mod3BirlesikIlerleme = {
  tamamlanan: Mod3AdimId[];
  kaynak: Partial<Record<Mod3AdimId, 'veri' | 'manuel'>>;
  kanitlar: Mod3AdimKanit[];
  ozet: Mod3VeriDurum['ozet'];
};

export async function getMod3BirlesikIlerleme(): Promise<Mod3BirlesikIlerleme> {
  const [manuel, veri] = await Promise.all([getMod3Ilerleme(), tespitMod3VeriDurumu()]);
  const autoSet = new Set(veri.otomatikTamamlanan);
  const manuelSet = new Set(manuel.tamamlanan);
  const tamamlanan: Mod3AdimId[] = [];
  const kaynak: Partial<Record<Mod3AdimId, 'veri' | 'manuel'>> = {};

  for (const adim of MOD3_ADIMLAR) {
    const oncekiOk =
      adim.sira === 0 ||
      MOD3_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
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
