/**
 * Görüntü / LLM analiz sağlayıcısı.
 * Varsayılan: offline kural motoru (mevcut fotografAnalizi).
 * İsteğe bağlı: EXPO_PUBLIC_VISION_URL — POST { tur, etiket, symptoms, cevaplar }
 */

import Constants from 'expo-constants';
import { fotografAnalizi, type FotoTur, type VakaFotografi } from './fotograf';
import type { VetCevaplar } from './netlestirme';
import type { VetSuggestion } from '@/kaynak/cekirdek/tipler';

export type VisionAnalizGirdi = {
  fotograflar: VakaFotografi[];
  symptoms?: string;
  cevaplar?: VetCevaplar;
};

export type VisionAnalizSonuc = Pick<
  VetSuggestion,
  'fotoGozlemleri' | 'tedaviOnerileri' | 'conditions' | 'urgency'
> & {
  kaynak: 'offline' | 'uzak';
  not?: string;
};

function visionUrl(): string | null {
  const ekstra = Constants.expoConfig?.extra as { visionUrl?: string } | undefined;
  const env =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_VISION_URL) ||
    ekstra?.visionUrl ||
    '';
  const u = String(env).trim();
  return u.startsWith('http') ? u : null;
}

/** Offline — tür + cevap bağlamı (piksel okunmaz) */
export function visionOfflineAnaliz(girdi: VisionAnalizGirdi): VisionAnalizSonuc {
  const turler = girdi.fotograflar.map((f) => f.tur);
  if (turler.length === 0) {
    return {
      fotoGozlemleri: [],
      tedaviOnerileri: [],
      conditions: [],
      urgency: 'low',
      kaynak: 'offline',
      not: 'Fotoğraf yok — yalnızca semptom kuralları',
    };
  }

  const gozlemler: string[] = [];
  const tedavi: string[] = [];
  const conditions: string[] = [];
  let urgency: VetSuggestion['urgency'] = 'low';
  const rank = { low: 0, medium: 1, high: 2 };

  for (const tur of [...new Set(turler)] as FotoTur[]) {
    const r = fotografAnalizi(tur, {
      cevaplar: girdi.cevaplar,
      symptoms: girdi.symptoms,
    });
    gozlemler.push(...r.fotoGozlemleri);
    tedavi.push(...r.tedaviOnerileri);
    conditions.push(...(r.conditions ?? []));
    if (rank[r.urgency ?? 'low'] > rank[urgency]) urgency = r.urgency ?? 'low';
  }

  return {
    fotoGozlemleri: [...new Set(gozlemler)],
    tedaviOnerileri: [...new Set(tedavi)],
    conditions: [...new Set(conditions)],
    urgency,
    kaynak: 'offline',
    not: 'Yerel kural motoru — görüntü pikseli okunmaz',
  };
}

/**
 * Uzak vision endpoint (yapılandırıldıysa).
 * Beklenen JSON: { fotoGozlemleri?, tedaviOnerileri?, conditions?, urgency? }
 * Hata / timeout → offline’a düşer.
 */
export async function visionUzakAnaliz(girdi: VisionAnalizGirdi): Promise<VisionAnalizSonuc | null> {
  const url = visionUrl();
  if (!url || girdi.fotograflar.length === 0) return null;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        suruyon: '1',
        symptoms: girdi.symptoms ?? '',
        cevaplar: girdi.cevaplar ?? {},
        fotograflar: girdi.fotograflar.map((f) => ({
          tur: f.tur,
          etiket: f.etiket,
          // URI cihaz lokal — sunucu erişemez; tür/etiket gönderilir
          uriHint: f.uri.startsWith('http') ? f.uri : undefined,
        })),
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<VisionAnalizSonuc>;
    return {
      fotoGozlemleri: data.fotoGozlemleri ?? [],
      tedaviOnerileri: data.tedaviOnerileri ?? [],
      conditions: data.conditions ?? [],
      urgency: data.urgency ?? 'medium',
      kaynak: 'uzak',
      not: 'Uzak vision / LLM yanıtı',
    };
  } catch {
    return null;
  }
}

/** Önce uzak (varsa), yoksa offline */
export async function visionAnalizEt(girdi: VisionAnalizGirdi): Promise<VisionAnalizSonuc> {
  const uzak = await visionUzakAnaliz(girdi);
  if (uzak && (uzak.fotoGozlemleri.length > 0 || uzak.conditions.length > 0)) return uzak;
  return visionOfflineAnaliz(girdi);
}

export function visionKaynakAciklama(): string {
  return visionUrl()
    ? 'Vision URL tanımlı — uzak analiz denenecek, yoksa yerel kural.'
    : 'Vision URL yok (EXPO_PUBLIC_VISION_URL) — yalnızca yerel kural motoru.';
}
