import type { TartimGirisYontemi } from '@/kaynak/giris-yontemi';
import { tartimGirisEtiket } from '@/kaynak/giris-yontemi';
import { konusmaDurumu } from '@/kaynak/ses/konusma';
import { ocrMotorDestekleniyor } from '@/kaynak/ocr/motor';
import { BASKUL_ADAPTOR_TANIMLI, baskulOrtamDestekliyorMu } from '@/kaynak/baskul';

export type HizliKiloYontemId = Extract<TartimGirisYontemi, 'manuel' | 'sesle-kilo' | 'baskul-ocr' | 'baskul'>;

export const HIZLI_KILO_YONTEMLERI: HizliKiloYontemId[] = ['manuel', 'sesle-kilo', 'baskul-ocr', 'baskul'];

export type HizliKiloYontemDurum = 'hazir' | 'kisitli' | 'yok';

export function hizliKiloYontemEtiket(id: HizliKiloYontemId): string {
  if (id === 'baskul') return 'Bağlı tartı';
  if (id === 'baskul-ocr') return 'Ekran OCR';
  return tartimGirisEtiket(id);
}

export function hizliKiloYontemDurumu(id: HizliKiloYontemId): { durum: HizliKiloYontemDurum; not: string } {
  switch (id) {
    case 'manuel':
      return { durum: 'hazir', not: 'Tüm ortamlar' };
    case 'sesle-kilo': {
      const k = konusmaDurumu();
      return k.sttHazir
        ? { durum: 'hazir', not: 'Web Speech (Chrome/Edge/Safari kısıtlı)' }
        : { durum: 'yok', not: k.aciklama };
    }
    case 'baskul-ocr':
      return ocrMotorDestekleniyor()
        ? { durum: 'hazir', not: 'Web OCR (Tesseract CDN); onay zorunlu' }
        : { durum: 'yok', not: 'Expo native’de motor yok — web veya elle' };
    case 'baskul':
      if (!baskulOrtamDestekliyorMu()) {
        return { durum: 'kisitli', not: 'Safari/iOS’ta USB-BT API yok; elle/ses/OCR deneyin' };
      }
      if (!BASKUL_ADAPTOR_TANIMLI) {
        return { durum: 'kisitli', not: 'Marka/protokol tanımlı değil — bağlanınca bilgi verilir' };
      }
      return { durum: 'hazir', not: 'Tanımlı adaptör ile' };
    default:
      return { durum: 'yok', not: '' };
  }
}

export function hizliKiloYontemSecilebilir(id: HizliKiloYontemId): boolean {
  const d = hizliKiloYontemDurumu(id);
  return d.durum === 'hazir' || d.durum === 'kisitli';
}
