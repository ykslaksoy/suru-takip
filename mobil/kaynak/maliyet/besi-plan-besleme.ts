/**
 * t372u — plan besleme yöntemi; katkı/eksik formül ADG artırmaz.
 */

export type BesiPlanBeslemeYontemi =
  | 'hazir_pellet'
  | 'ev_karisimi'
  | 'mera_kaba'
  | 'karma'
  | 'belirsiz';

export const BESLEME_YONTEM_ETIKET: Record<BesiPlanBeslemeYontemi, string> = {
  hazir_pellet: 'Hazır pelet / fabrika yemi (bitirme)',
  ev_karisimi: 'Ev / işletme karışımı',
  mera_kaba: 'Mera + kaba yem ağırlıklı',
  karma: 'Karma (kısmen hazır)',
  belirsiz: 'Belirsiz / girilmedi',
};

export type BesiPlanBeslemeTaslak = {
  yontem: BesiPlanBeslemeYontemi;
  /** Tam faz reçete + günlük alım girildi mi */
  formulDogrulandi: boolean;
  /** Katkı seçili — tek başına ADG yükseltmez */
  katkiSecildi: boolean;
};

export function varsayilanBeslemeTaslak(): BesiPlanBeslemeTaslak {
  return { yontem: 'hazir_pellet', formulDogrulandi: false, katkiSecildi: false };
}
