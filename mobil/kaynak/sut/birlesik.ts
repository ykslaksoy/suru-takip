import { MOD4_ADIMLAR, getMod4Ilerleme, type Mod4AdimId } from './adim-kilidi';
import { tespitMod4VeriDurumu, type Mod4AdimKanit, type Mod4VeriDurum } from './veri-ilerleme';

export type Mod4BirlesikIlerleme = {
  tamamlanan: Mod4AdimId[];
  kaynak: Partial<Record<Mod4AdimId, 'veri' | 'manuel'>>;
  kanitlar: Mod4AdimKanit[];
  ozet: Mod4VeriDurum['ozet'];
};

export async function getMod4BirlesikIlerleme(): Promise<Mod4BirlesikIlerleme> {
  const [manuel, veri] = await Promise.all([getMod4Ilerleme(), tespitMod4VeriDurumu()]);
  const autoSet = new Set(veri.otomatikTamamlanan);
  const manuelSet = new Set(manuel.tamamlanan);
  const tamamlanan: Mod4AdimId[] = [];
  const kaynak: Partial<Record<Mod4AdimId, 'veri' | 'manuel'>> = {};

  for (const adim of MOD4_ADIMLAR) {
    const oncekiOk =
      adim.sira === 0 ||
      MOD4_ADIMLAR.filter((a) => a.sira < adim.sira).every((a) => tamamlanan.includes(a.id));
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
