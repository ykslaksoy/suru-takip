import type { KuzuSecimYontemi, TartimGirisYontemi, YontemDurum } from './tipler';
import { KUZU_SECIM_SECENEKLER, TARTIM_GIRIS_SECENEKLER } from './tipler';

const KUZU_DURUM: Record<KuzuSecimYontemi, YontemDurum> = {
  'otomatik-tanima': 'aktif',
  manuel: 'aktif',
  'kupe-ocr': 'aktif',
  rfid: 'aktif',
  'sirt-no-ocr': 'aktif',
  'sesle-numara': 'aktif',
};

const TARTIM_DURUM: Record<TartimGirisYontemi, YontemDurum> = {
  manuel: 'aktif',
  baskul: 'yakininda',
  'sesle-kilo': 'aktif',
  'baskul-ocr': 'yakininda',
  'toplu-csv': 'yakininda',
  'iot-api': 'kapali',
};

export function kuzuSecimYontemDurumu(id: KuzuSecimYontemi): YontemDurum {
  return KUZU_DURUM[id] ?? 'yakininda';
}

export function tartimGirisYontemDurumu(id: TartimGirisYontemi): YontemDurum {
  return TARTIM_DURUM[id] ?? 'yakininda';
}

export function yontemDurumEtiket(durum: YontemDurum): string {
  switch (durum) {
    case 'aktif':
      return 'Aktif';
    case 'yakininda':
      return 'Yakında';
    case 'kapali':
      return 'Kapalı';
  }
}

export function kuzuSecimEtiket(id: KuzuSecimYontemi): string {
  return KUZU_SECIM_SECENEKLER.find((s) => s.id === id)?.baslik ?? id;
}

export function tartimGirisEtiket(id: TartimGirisYontemi): string {
  return TARTIM_GIRIS_SECENEKLER.find((s) => s.id === id)?.baslik ?? id;
}

/** Seçilen yöntem kullanılabilir değilse güvenli varsayılan */
export function etkinKuzuSecim(id: KuzuSecimYontemi): KuzuSecimYontemi {
  return kuzuSecimYontemDurumu(id) === 'aktif' ? id : 'manuel';
}

export function etkinTartimGiris(id: TartimGirisYontemi): TartimGirisYontemi {
  const durum = tartimGirisYontemDurumu(id);
  if (durum === 'aktif') return id;
  return 'manuel';
}

export function tartimYontemYakinindaMi(id: TartimGirisYontemi): boolean {
  return tartimGirisYontemDurumu(id) !== 'aktif';
}
