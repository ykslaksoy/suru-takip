import type { RationPhase } from '@/kaynak/rasyon/hesapla';
import { PHASE_LABELS } from '@/kaynak/rasyon/hesapla';
import {
  FCR_BIRIM,
  GCAA_BIRIM,
  normPadok,
  type PerformansEsikDepo,
  type PerformansEsikKayit,
  type PerformansEsikKapsam,
} from '@/kaynak/kilo/performans-esik-tipler';

/**
 * Öncelik (yüksekten düşüğe): padok+faz → padok → faz → genel.
 * Aynı metrik için ilk eşleşen etkin kayıt kullanılır.
 */
const ONCELIK: PerformansEsikKapsam['tur'][] = ['padok_faz', 'padok', 'faz', 'genel'];

export type CozulmusPerformansEsik = {
  gcaaAltGram: number | null;
  gcaaKaynak: string | null;
  fcrUst: number | null;
  fcrKaynak: string | null;
};

function kapsamEslesir(
  kayitKapsam: PerformansEsikKapsam,
  tur: PerformansEsikKapsam['tur'],
  padokAd: string,
  faz: RationPhase,
): boolean {
  const p = normPadok(padokAd);
  if (tur === 'genel') return kayitKapsam.tur === 'genel';
  if (tur === 'faz') return kayitKapsam.tur === 'faz' && kayitKapsam.faz === faz;
  if (tur === 'padok') return kayitKapsam.tur === 'padok' && normPadok(kayitKapsam.padokAd) === p;
  if (tur === 'padok_faz') {
    return (
      kayitKapsam.tur === 'padok_faz' &&
      normPadok(kayitKapsam.padokAd) === p &&
      kayitKapsam.faz === faz
    );
  }
  return false;
}

function kapsamEtiketi(k: PerformansEsikKapsam): string {
  if (k.tur === 'genel') return 'Genel çiftlik hedefi';
  if (k.tur === 'padok') return `Padok: ${k.padokAd}`;
  if (k.tur === 'faz') return `Besleme dönemi: ${PHASE_LABELS[k.faz]}`;
  return `Padok ${k.padokAd} · ${PHASE_LABELS[k.faz]}`;
}

function kayitBul(
  depo: PerformansEsikDepo,
  tur: PerformansEsikKapsam['tur'],
  padokAd: string,
  faz: RationPhase,
): PerformansEsikKayit | null {
  for (const k of depo.kayitlar) {
    if (kapsamEslesir(k.kapsam, tur, padokAd, faz)) return k;
  }
  return null;
}

export function cozumlePerformansEsikleri(
  depo: PerformansEsikDepo,
  padokAd: string,
  faz: RationPhase,
): CozulmusPerformansEsik {
  let gcaaAltGram: number | null = null;
  let gcaaKaynak: string | null = null;
  let fcrUst: number | null = null;
  let fcrKaynak: string | null = null;

  for (const tur of ONCELIK) {
    if (gcaaAltGram == null) {
      const k = kayitBul(depo, tur, padokAd, faz);
      if (k?.gcaaAlt?.etkin) {
        gcaaAltGram = k.gcaaAlt.deger;
        gcaaKaynak = kapsamEtiketi(k.kapsam);
      }
    }
    if (fcrUst == null) {
      const k = kayitBul(depo, tur, padokAd, faz);
      if (k?.fcrUst?.etkin) {
        fcrUst = k.fcrUst.deger;
        fcrKaynak = kapsamEtiketi(k.kapsam);
      }
    }
  }

  return { gcaaAltGram, gcaaKaynak, fcrUst, fcrKaynak };
}

export function aktifEsikOzet(c: CozulmusPerformansEsik): string {
  const p: string[] = [];
  if (c.gcaaAltGram != null && c.gcaaKaynak) {
    p.push(`GCAA alt hedef ≥ ${c.gcaaAltGram} ${GCAA_BIRIM} (${c.gcaaKaynak})`);
  }
  if (c.fcrUst != null && c.fcrKaynak) {
    p.push(`FCR üst hedef ≤ ${c.fcrUst} ${FCR_BIRIM} (${c.fcrKaynak})`);
  }
  return p.length ? p.join(' · ') : 'Çiftlik performans hedefi tanımlı değil';
}

export const PERFORMANS_ESIK_ONCELIK_METNI =
  'Öncelik: padok+besleme dönemi → padok → besleme dönemi → genel. Eşleşen ilk etkin hedef kullanılır.';
