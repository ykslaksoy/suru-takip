import type { PerformansEsikDepo } from '@/kaynak/kilo/performans-esik-tipler';
import { cozumlePerformansEsikleri } from '@/kaynak/kilo/performans-esik-oncelik';
import {
  performansEsikGcaaBaslik,
  performansEsikGcaaDegerlendir,
  PERFORMANS_ESIK_KONTROL_LISTESI,
} from '@/kaynak/kilo/performans-esik-degerlendir';
import type { RationPhase } from '@/kaynak/rasyon/hesapla';

export type SuruGcaaEsikSonuc =
  | { durum: 'yetersiz_veri' }
  | { durum: 'esik_yok' }
  | { durum: 'tamam' }
  | {
      durum: 'hedef_alti';
      ortGcaa: number;
      hedef: number;
      kaynak: string;
      kontrolListesi: readonly string[];
    };

/** Ana sayfa / öneri: yalnız ölçülmüş ortalama GCAA + genel/padok çözümlü eşik. */
export function suruOrtGcaaEsikDegerlendir(
  depo: PerformansEsikDepo,
  ortGcaaGram: number | null | undefined,
  padokAd: string,
  faz: RationPhase = 'lamb_fattening',
): SuruGcaaEsikSonuc {
  const esik = cozumlePerformansEsikleri(depo, padokAd, faz);
  if (esik.gcaaAltGram == null) return { durum: 'esik_yok' };
  if (ortGcaaGram == null || !Number.isFinite(ortGcaaGram)) return { durum: 'yetersiz_veri' };
  const sahteAdg = {
    durum: 'hazir' as const,
    gramGun: Math.round(ortGcaaGram),
    gainKg: 1,
    periodDays: 30,
    startAt: '',
    endAt: '',
    startWeightKg: 0,
    endWeightKg: 0,
  };
  const d = performansEsikGcaaDegerlendir(sahteAdg, esik);
  if (d.sonuc === 'hedef_alti') {
    return {
      durum: 'hedef_alti',
      ortGcaa: d.gcaaGram,
      hedef: d.hedefGram,
      kaynak: d.kaynak,
      kontrolListesi: PERFORMANS_ESIK_KONTROL_LISTESI,
    };
  }
  if (d.sonuc === 'hedef_icinde') return { durum: 'tamam' };
  return { durum: 'yetersiz_veri' };
}

export function suruGcaaOneriMetni(sonuc: SuruGcaaEsikSonuc): { baslik: string; voice: string } | null {
  if (sonuc.durum !== 'hedef_alti') return null;
  const baslik = performansEsikGcaaBaslik({
    sonuc: 'hedef_alti',
    gcaaGram: sonuc.ortGcaa,
    hedefGram: sonuc.hedef,
    kaynak: sonuc.kaynak,
    kontrolListesi: sonuc.kontrolListesi,
  });
  if (!baslik) return null;
  const voice = [
    `Çiftlik hedefi (${sonuc.kaynak}): en az ${sonuc.hedef} g/gün. Ölçülen ortalama ${sonuc.ortGcaa} g/gün.`,
    'Bu uyarı tanı veya tedavi önerisi değildir; otomatik rasyon/ilaç/padok değişikliği yapılmaz.',
    ...sonuc.kontrolListesi.slice(0, 3),
  ].join(' ');
  return { baslik, voice };
}
