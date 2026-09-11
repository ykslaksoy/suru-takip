import { countAnimals, countAnimalsInPaddock } from '@/kaynak/cekirdek/veritabani';
import { getBugunGorevleri } from '@/kaynak/gorevler/liste';
import { getSmartSuggestions } from '@/kaynak/akilli-kuzu/oneri';

export const KILITLI_ANA_BASLIK = 'Akıllı Kuzu';
export const KILITLI_SEZON_ETIKET = '2026 Sezonu';

export type AnaSayfaPartiTon = 'a' | 'b' | 'c';

export type AnaSayfaParti = {
  harf: 'A' | 'B' | 'C';
  ad: string;
  yasEtiket: string;
  bas: number;
  ton: AnaSayfaPartiTon;
};

export type AnaSayfaOzet = {
  hayvanSayisi: number;
  gorevSayisi: number;
  partiler: AnaSayfaParti[];
  kritik: number;
  aksiyon: number;
};

/** Kilitli sezon yaş etiketleri — Grok 2026-09-07 */
export const KILITLI_PADOKLAR: Omit<AnaSayfaParti, 'bas'>[] = [
  { harf: 'A', ad: 'Padok A', yasEtiket: '2–2,5 aylık', ton: 'a' },
  { harf: 'B', ad: 'Padok B', yasEtiket: '3,5 aylık', ton: 'b' },
  { harf: 'C', ad: 'Padok C', yasEtiket: '4,5 aylık', ton: 'c' },
];

/** Akıllı Kuzu sekmesi ile aynı demo bağlamı — Kritik 1 / Aksiyon 2 */
const KILITLI_ONERI_CTX = {
  quarantineDay: 2,
  quarantineTotal: 5,
  needsVaccine: true,
  lowStock: true,
};

export async function getAnaSayfaOzeti(): Promise<AnaSayfaOzet> {
  const [hayvanSayisi, gorevler, ...baslar] = await Promise.all([
    countAnimals(),
    getBugunGorevleri(50),
    ...KILITLI_PADOKLAR.map((p) => countAnimalsInPaddock(p.ad)),
  ]);
  const oneriler = getSmartSuggestions(KILITLI_ONERI_CTX);
  return {
    hayvanSayisi,
    gorevSayisi: gorevler.length,
    partiler: KILITLI_PADOKLAR.map((p, i) => ({ ...p, bas: baslar[i] ?? 0 })),
    kritik: oneriler.filter((s) => s.urgency === 'alert').length,
    aksiyon: oneriler.filter((s) => s.urgency === 'action').length,
  };
}
