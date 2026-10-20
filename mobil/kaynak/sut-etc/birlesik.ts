import { MOD7_ADIMLAR, getMod7Ilerleme, type Mod7AdimId } from './adim-kilidi';
import { tespitMod7VeriDurumu, type Mod7AdimKanit, type Mod7VeriDurum } from './veri-ilerleme';

export type Mod7BirlesikIlerleme = {
  tamamlanan: Mod7AdimId[];
  kaynak: Partial<Record<Mod7AdimId, 'veri' | 'manuel'>>;
  kanitlar: Mod7AdimKanit[];
  ozet: Mod7VeriDurum['ozet'];
};

export async function getMod7BirlesikIlerleme(): Promise<Mod7BirlesikIlerleme> {
  const [manuel, veri] = await Promise.all([getMod7Ilerleme(), tespitMod7VeriDurumu()]);
  const autoSet = new Set(veri.otomatikTamamlanan);
  const manuelSet = new Set(manuel.tamamlanan);
  const tamamlanan: Mod7AdimId[] = [];
  const kaynak: Partial<Record<Mod7AdimId, 'veri' | 'manuel'>> = {};

  for (const adim of MOD7_ADIMLAR) {
    const oncekiOk =
      adim.sira === 0 ||
      MOD7_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
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
