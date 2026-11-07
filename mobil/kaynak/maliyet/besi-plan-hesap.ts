import type {
  BesiPlanDonemGirdi,
  BesiPlanDonemProjeksiyon,
  BesiPlanProjeksiyon,
  BesiPlanSenaryo,
} from '@/kaynak/maliyet/besi-plan-tipler';

function donemEksik(d: BesiPlanDonemGirdi): string[] {
  const e: string[] = [];
  if (!Number.isFinite(d.gun) || d.gun < 0) e.push(`${d.tur}: gün sayısı`);
  if (d.tur !== 'varis_gozlem' && d.tur !== 'uyum') {
    if (d.gcaaGramGun == null || d.gcaaGramGun < 0) e.push(`${d.tur}: GCAA varsayımı (g/gün)`);
  }
  if (d.gunlukYemKgBas == null || d.gunlukYemKgBas < 0) e.push(`${d.tur}: günlük yem kg/baş`);
  if (d.yemFiyatKg == null || d.yemFiyatKg < 0) e.push(`${d.tur}: yem ₺/kg`);
  if (d.gunlukBakimBas == null || d.gunlukBakimBas < 0) e.push(`${d.tur}: günlük bakım ₺/baş`);
  return e;
}

/**
 * Dönemleri sırayla birleştirir; FCR = toplam yem / toplam artış (oran ortalaması değil).
 */
export function hesaplaBesiPlanProjeksiyon(
  senaryo: Pick<BesiPlanSenaryo, 'girisKg' | 'donemler' | 'basSayisi'>,
): BesiPlanProjeksiyon {
  const eksikGenel: string[] = [];
  if (senaryo.girisKg == null || senaryo.girisKg <= 0) eksikGenel.push('Başlangıç canlı kg');
  if (senaryo.basSayisi == null || senaryo.basSayisi < 1) eksikGenel.push('Baş sayısı');

  let kg = senaryo.girisKg ?? 0;
  const donemler: BesiPlanDonemProjeksiyon[] = [];
  let toplamYem = 0;
  let toplamArtis = 0;
  let toplamMaliyet = 0;
  let toplamGun = 0;

  for (const d of senaryo.donemler) {
    const eksikler = donemEksik(d);
    const giris = kg;
    let artis = 0;
    if (eksikler.length === 0 && d.gcaaGramGun != null && d.gun > 0) {
      artis = Math.round((d.gcaaGramGun / 1000) * d.gun * 1000) / 1000;
    } else if ((d.tur === 'varis_gozlem' || d.tur === 'uyum') && d.gun > 0 && eksikler.length <= 2) {
      artis = 0;
    }
    const cikis = Math.round((giris + artis) * 10) / 10;
    const yemKg = d.gunlukYemKgBas != null && d.gun > 0 ? d.gun * d.gunlukYemKgBas : 0;
    const yemMal =
      d.yemFiyatKg != null && d.gunlukYemKgBas != null ? yemKg * d.yemFiyatKg : 0;
    const bakim =
      d.gunlukBakimBas != null && d.gun > 0 ? d.gun * d.gunlukBakimBas : 0;
    donemler.push({
      tur: d.tur,
      gun: d.gun,
      girisKg: giris,
      cikisKg: cikis,
      artisKg: Math.round(artis * 100) / 100,
      yemKg: Math.round(yemKg * 10) / 10,
      yemMaliyet: Math.round(yemMal),
      bakimMaliyet: Math.round(bakim),
      eksikler,
    });
    if (eksikler.length === 0) {
      kg = cikis;
      toplamYem += yemKg;
      toplamArtis += artis;
      toplamMaliyet += yemMal + bakim;
      toplamGun += d.gun;
    }
    eksikGenel.push(...eksikler);
  }

  const uyari = [
    'Taslak projeksiyon — ırk ortalaması veya garanti çıktı değil.',
    'Onaylı plan yem stokunu veya rasyonu otomatik değiştirmez.',
  ];

  if (eksikGenel.length) {
    return { durum: 'eksik', eksikler: [...new Set(eksikGenel)], donemler };
  }

  const birlesikFcr = toplamArtis > 0 ? Math.round((toplamYem / toplamArtis) * 100) / 100 : null;
  return {
    durum: 'hazir',
    eksikler: [],
    donemler,
    toplamGun,
    toplamArtisKg: Math.round(toplamArtis * 100) / 100,
    toplamYemKg: Math.round(toplamYem * 10) / 10,
    toplamMaliyet: Math.round(toplamMaliyet),
    birlesikFcr,
    cikisKg: kg,
    uyari,
  };
}

/** Taslak motor ile karşılaştırma — ayrı tahmin motoru çağrılmaz. */
export function besiPlanDonemToplamGun(donemler: BesiPlanDonemGirdi[]): number {
  return donemler.reduce((s, d) => s + (Number.isFinite(d.gun) ? d.gun : 0), 0);
}
