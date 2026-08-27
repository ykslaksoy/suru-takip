import { getAnimals, getLatestWeight } from '@/kaynak/cekirdek/veritabani';
import { calculateRation, PHASE_LABELS, type RationPhase } from '@/kaynak/rasyon/hesapla';
import { inferRationPhase } from '@/kaynak/rasyon/hayvan-plani';
import {
  getKullaniciRasyonlari,
  rasyonMaliyetOzeti,
  type KullaniciRasyon,
} from '@/kaynak/rasyon/kullanici-rasyon';

export type AkilliOneri = {
  hayvanSayisi: number;
  ortalamaKg: number;
  dominantDonem: RationPhase;
  donemEtiketi: string;
  hesap: ReturnType<typeof calculateRation>;
  tahminiGunlukMaliyet: number | null;
  kullaniciRasyon: KullaniciRasyon | null;
  notlar: string[];
};

/**
 * Sürü ortalaması + dönem çıkarımı ile akıllı öneri.
 * Kullanıcı rasyonu varsa kg maliyeti ile günlük maliyet tahmin eder.
 */
export async function akilliRasyonOnerisi(opts?: {
  hedefGun?: number;
  yemFiyatKg?: number;
}): Promise<AkilliOneri | null> {
  const animals = (await getAnimals()).filter((a) => a.status !== 'sold' && a.status !== 'dead');
  if (animals.length === 0) return null;

  const kilos: number[] = [];
  const phaseCount: Partial<Record<RationPhase, number>> = {};
  for (const a of animals) {
    const w = await getLatestWeight(a.id);
    if (w != null && w > 0) kilos.push(w);
    const p = inferRationPhase(a);
    phaseCount[p] = (phaseCount[p] ?? 0) + 1;
  }

  const ortalamaKg =
    kilos.length > 0
      ? Math.round((kilos.reduce((s, k) => s + k, 0) / kilos.length) * 10) / 10
      : 45;

  const dominantDonem =
    (Object.entries(phaseCount).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] as RationPhase) ||
    'maintenance';

  const hesap = calculateRation({
    liveWeightKg: ortalamaKg,
    count: animals.length,
    phase: dominantDonem,
    forageQuality: 'medium',
  });

  const kullanici = (await getKullaniciRasyonlari())[0] ?? null;
  const maliyetKg =
    opts?.yemFiyatKg ??
    (kullanici ? rasyonMaliyetOzeti(kullanici).maliyetKg : null);
  const tahminiGunlukMaliyet =
    maliyetKg != null && maliyetKg > 0
      ? Math.round(hesap.totalDailyKg * maliyetKg * 100) / 100
      : null;

  const hedefGun = opts?.hedefGun ?? 60;
  const notlar = [
    ...hesap.notes,
    `${animals.length} hayvan · ort. ${ortalamaKg} kg · ${PHASE_LABELS[dominantDonem]}`,
    `~${hedefGun} gün için toplam yem ≈ ${Math.round(hesap.totalDailyKg * hedefGun)} kg`,
  ];
  if (tahminiGunlukMaliyet != null) {
    notlar.push(`Tahmini günlük yem maliyeti ≈ ${tahminiGunlukMaliyet} ₺`);
    notlar.push(`~${hedefGun} gün maliyet ≈ ${Math.round(tahminiGunlukMaliyet * hedefGun)} ₺`);
  } else {
    notlar.push('Maliyet için “Benim rasyonum” bileşen fiyatlarını girin.');
  }

  return {
    hayvanSayisi: animals.length,
    ortalamaKg,
    dominantDonem,
    donemEtiketi: PHASE_LABELS[dominantDonem],
    hesap,
    tahminiGunlukMaliyet,
    kullaniciRasyon: kullanici,
    notlar,
  };
}
