import { bulutAcik } from '@/kaynak/bulut/ayar';
import { senkronlanirMi } from '@/kaynak/bulut/siniflama';

export type TartimBulutDurum = 'kapali' | 'yerel_kayit' | 'senkronlanabilir';

export function tartimBulutDurumu(): TartimBulutDurum {
  if (!bulutAcik()) return 'kapali';
  return senkronlanirMi('sy_weights') ? 'senkronlanabilir' : 'yerel_kayit';
}

/** Yerel kayıt tamamlanır; bulut gönderimi ayrı adım — başarı iddia edilmez. */
export function tartimBulutMesaji(durum: TartimBulutDurum): string {
  switch (durum) {
    case 'kapali':
      return 'Yalnız bu cihazda kaydedildi (bulut kapalı).';
    case 'yerel_kayit':
      return 'Yalnız bu cihazda kaydedildi.';
    case 'senkronlanabilir':
      return 'Yerel kaydedildi. Bulut açık — sonraki senkron beklenir; gönderim garanti değil.';
  }
}
