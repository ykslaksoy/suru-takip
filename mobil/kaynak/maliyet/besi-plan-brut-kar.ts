/** BRÜT KÂR (alış ve yem sonrası) = satış − alış − yem; sağlık/çoban/kira hariç. */

export const BRUT_KAR_ETIKET = 'BRÜT KÂR (alış ve yem sonrası)';

export type BrutKarSonuc = {
  etiket: typeof BRUT_KAR_ETIKET;
  satisBas: number | null;
  alisBas: number | null;
  yemBas: number | null;
  brutKar: number | null;
  eksik: string[];
  not: string[];
};

export function hesaplaBrutKar(opts: {
  satisBas: number | null;
  alisBas: number | null;
  yemBas: number | null;
}): BrutKarSonuc {
  const eksik: string[] = [];
  const not = [
    'Sağlık, çoban, kira vb. bu metrikte yok — ayrı «diğer gider / net» gerekir.',
    'Gelecek satış fiyatı senaryo olabilir; geçmiş alış değiştirilmez.',
  ];
  if (opts.satisBas == null) eksik.push('Satış geliri');
  if (opts.alisBas == null) eksik.push('Alış');
  if (opts.yemBas == null) eksik.push('Yem');
  if (eksik.length) {
    return { etiket: BRUT_KAR_ETIKET, ...opts, brutKar: null, eksik, not };
  }
  return {
    etiket: BRUT_KAR_ETIKET,
    satisBas: opts.satisBas,
    alisBas: opts.alisBas,
    yemBas: opts.yemBas,
    brutKar: Math.round(opts.satisBas! - opts.alisBas! - opts.yemBas!),
    eksik: [],
    not,
  };
}
