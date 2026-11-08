/**
 * Besi plan — gerçek kayıtlardan ölçüm; kullanıcı teknik sabit girmemeli.
 */
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { padokPerformansOzeti } from '@/kaynak/kilo/padok-performans-ozet';
import type { BesiHedefIrkKodu } from './besi-plan-irk-katalog';
import { normalizeHedefIrkKodu } from './besi-plan-irk-katalog';

export type BesiPlanGercekOlcum = {
  planBasSayisi: number | null;
  bilinenIrkBas: number | null;
  olcumGcaaGramGun: number | null;
  olcumBas: string | null;
  olcumBit: string | null;
  uygunGcaaSayisi: number;
  olculenGcaaSayisi: number;
  kaynak: 'tartim' | 'yok';
  aciklama: string[];
};

function irkBelliMi(a: Animal): boolean {
  const b = (a.breed ?? '').trim().toLowerCase();
  return b.length > 0 && b !== 'bilinmiyor' && b !== '?' && b !== '-';
}

function irkEslesir(a: Animal, hedef?: BesiHedefIrkKodu | null): boolean {
  if (!irkBelliMi(a)) return false;
  if (!hedef || hedef === 'generic_kuzu') return true;
  const b = a.breed.trim().toLowerCase();
  const kod = normalizeHedefIrkKodu(hedef);
  return b.includes(kod.replace(/_/g, ' ')) || b.includes(kod.replace(/_/g, ''));
}

export async function besiPlanGercekOlcumYukle(opts: {
  padok?: string | null;
  hedefIrk?: BesiHedefIrkKodu | null;
  planBasSayisiFallback?: number | null;
}): Promise<BesiPlanGercekOlcum> {
  const aciklama: string[] = [];
  const tum = await getAnimals().catch(() => [] as Animal[]);
  const padok = opts.padok?.trim();
  let uyeler = tum.filter((a) => a.status !== 'sold' && a.status !== 'dead');
  if (padok) {
    uyeler = uyeler.filter((a) => (a.paddock ?? '').trim() === padok);
    aciklama.push(padok ? `Padok/parti: ${padok}` : 'Padok seçilmedi');
  } else if (opts.planBasSayisiFallback != null && opts.planBasSayisiFallback > 0) {
    aciklama.push('Padok yok — plan baş sayısı formdan (kullanıcı bütçe kapsamı)');
  } else {
    aciklama.push('Bağlı parti/padok yok — baş sayısı kayıttan okunamadı');
  }

  const planBas =
    uyeler.length > 0
      ? uyeler.length
      : opts.planBasSayisiFallback != null && opts.planBasSayisiFallback > 0
        ? opts.planBasSayisiFallback
        : null;

  const bilinenToplam = uyeler.filter((a) => irkBelliMi(a)).length;
  const bilinenIrk = uyeler.filter((a) => irkEslesir(a, opts.hedefIrk ?? null)).length;
  const bilinenIrkBas = uyeler.length > 0 ? (opts.hedefIrk ? bilinenIrk : bilinenToplam) : null;

  const perf = uyeler.length > 0 ? await padokPerformansOzeti(uyeler, padok ?? uyeler[0]?.paddock ?? '') : null;

  const olcumGcaa =
    perf?.ortGcaaGram != null && perf.olculenGcaaSayisi > 0 ? Math.round(perf.ortGcaaGram) : null;

  if (olcumGcaa == null) {
    aciklama.push('Yeterli tartım çifti yok — ADG bandı kullanılır');
  } else {
    aciklama.push(
      `Tartım eğilimi: ${olcumGcaa} g/gün (${perf!.olculenGcaaSayisi} baş, ${perf!.uygunGcaaSayisi} uygun dönem)`,
    );
  }

  if (planBas != null && bilinenToplam > 0) {
    aciklama.push(`Irkı kayıtlı baş: ${bilinenToplam}/${planBas}`);
  }

  return {
    planBasSayisi: planBas,
    bilinenIrkBas: uyeler.length > 0 ? (opts.hedefIrk ? bilinenIrk : bilinenToplam) : null,
    olcumGcaaGramGun: olcumGcaa,
    olcumBas: perf?.donemBaslangic ?? null,
    olcumBit: perf?.donemBitis ?? null,
    uygunGcaaSayisi: perf?.uygunGcaaSayisi ?? 0,
    olculenGcaaSayisi: perf?.olculenGcaaSayisi ?? 0,
    kaynak: olcumGcaa != null ? 'tartim' : 'yok',
    aciklama,
  };
}

export { irkTaslakHesapIcin } from './besi-plan-irk-efektif';
