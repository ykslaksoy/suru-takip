import type { EksikKayit } from './komut';
import { eksikKayitAyikla, eksikSorusu, komutAyikla } from './komut';
import { grupEtiketi } from '@/kaynak/toplu/secim';
import type { SesKomutEylemi } from './tipler';

export type KomutOnizlemeAlan = {
  hayvan: string;
  islem: string;
  deger: string;
  /** true = tam parse; false = eksik alan veya eşleşme yok */
  tam: boolean;
  not?: string;
};

export function komutOnizlemeSatirlari(eylem: SesKomutEylemi): KomutOnizlemeAlan {
  switch (eylem.tur) {
    case 'tartim':
      return {
        hayvan: `Küpe: ${eylem.kupeArama}`,
        islem: 'Tartım',
        deger: `${eylem.kiloKg} kg`,
        tam: true,
      };
    case 'asi':
      return {
        hayvan: `Küpe: ${eylem.kupeArama}`,
        islem: 'Aşı / sağlık',
        deger: eylem.asiAdi,
        tam: true,
      };
    case 'grup_asi': {
      const sayi = eylem.hayvanSayisi != null ? ` (${eylem.hayvanSayisi} kuzu)` : '';
      return {
        hayvan: grupEtiketi(eylem.grup) + sayi,
        islem: eylem.programTur === 'vitamin' ? 'Vitamin' : 'Toplu aşı',
        deger: eylem.asiAdi,
        tam: eylem.hayvanSayisi != null,
        not: eylem.hayvanSayisi == null ? 'Onay öncesi kuzu sayısı hesaplanır' : undefined,
      };
    }
    case 'stok':
      return {
        hayvan: '—',
        islem: `Stok ${eylem.yon === 'giris' ? 'girişi' : 'çıkışı'}`,
        deger: `${eylem.stokAdi}, ${eylem.miktar} ${eylem.birim}`,
        tam: true,
      };
    default:
      return { hayvan: '—', islem: '—', deger: '—', tam: false };
  }
}

function eksikOnizleme(e: EksikKayit): KomutOnizlemeAlan {
  if (e.tur === 'tartim') {
    return {
      hayvan: e.kupeArama ? `Küpe: ${e.kupeArama}` : 'Küpe: ?',
      islem: 'Tartım',
      deger: e.kiloKg != null ? `${e.kiloKg} kg` : 'Kilo: ?',
      tam: false,
      not: eksikSorusu(e),
    };
  }
  return {
    hayvan: e.kupeArama ? `Küpe: ${e.kupeArama}` : 'Küpe: ?',
    islem: 'Aşı / sağlık',
    deger: e.asiAdi ?? 'Aşı adı: ?',
    tam: false,
    not: eksikSorusu(e),
  };
}

/** Tam komut veya eksik/ eşleşmeyen — kayıt yapmaz, yalnız önizleme */
export function komutOnizle(metin: string): KomutOnizlemeAlan | null {
  const t = metin.trim();
  if (!t) return null;
  const tam = komutAyikla(t);
  if (tam) return komutOnizlemeSatirlari(tam);
  const eksik = eksikKayitAyikla(t);
  if (eksik) return eksikOnizleme(eksik);
  return null;
}
