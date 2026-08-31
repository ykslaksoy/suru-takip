/** Takviye plan kimlikleri — RN bağımlılığı yok (test + plan şablonu). */

export type TakviyeTip = 'asi' | 'parazit' | 'vitamin' | 'tartim';

export type ModTakviyeKalemi = {
  tip: TakviyeTip;
  programId: string;
  ad: string;
  detay: string;
  mlEtiket: string;
};

export const TARTIM_GIRIS_PROGRAM_ID = 'tartim-giris';
export const TARTIM_15_PROGRAM_ID = 'tartim-15';
