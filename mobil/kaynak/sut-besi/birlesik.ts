import { MOD5_ADIMLAR, getMod5Ilerleme, type Mod5AdimId } from './adim-kilidi';
import { tespitMod5VeriDurumu, type Mod5AdimKanit, type Mod5VeriDurum } from './veri-ilerleme';

export type Mod5BirlesikIlerleme = {
  tamamlanan: Mod5AdimId[];
  kaynak: Partial<Record<Mod5AdimId, 'veri' | 'manuel'>>;
  kanitlar: Mod5AdimKanit[];
  ozet: Mod5VeriDurum['ozet'];
};

export async function getMod5BirlesikIlerleme(): Promise<Mod5BirlesikIlerleme> {
  const [manuel, veri] = await Promise.all([getMod5Ilerleme(), tespitMod5VeriDurumu()]);
  const autoSet = new Set(veri.otomatikTamamlanan);
  const manuelSet = new Set(manuel.tamamlanan);
  const tamamlanan: Mod5AdimId[] = [];
  const kaynak: Partial<Record<Mod5AdimId, 'veri' | 'manuel'>> = {};

  for (const adim of MOD5_ADIMLAR) {
    const oncekiOk =
      adim.sira === 0 ||
      MOD5_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
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
