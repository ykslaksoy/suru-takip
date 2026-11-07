/**
 * Şimdi sat / besiye devam — marjinal karar (batık maliyet ayrı).
 * Piyasa fiyatı ve artış varsayımları kullanıcıdan; garanti yok.
 */

export type SatisBirimi = 'canli_kg' | 'karkas_kg';
export type KiloKaynagi = 'olculmus' | 'girilen' | 'tahmin';

export type SatDevamGirdi = {
  canliKg: number | null;
  kiloKaynagi: KiloKaynagi;
  satisBirimi: SatisBirimi;
  /** Canlı kg satışında ₺/kg canlı; karkasta ₺/kg karkas */
  satisFiyatKg: number | null;
  /** Karkas satışında zorunlu (0–1) */
  karkasVerim: number | null;
  paraBirimi: 'TRY';
  ekGun: number;
  /** Kullanıcı varsayımı kg/gün */
  gunlukArtisKg: number | null;
  gunlukEkYemKgBas: number | null;
  yemFiyatKg: number | null;
  /** Günlük bakım (işçilik, su-enerji, yatak, sağlık, diğer) ₺/baş/gün */
  gunlukBakimBas: number | null;
  /** Batık (alış + bugüne kadar gerçekleşen) — marjinal hesaba katılmaz */
  batikMaliyetBas: number | null;
};

export type SatDevamSonuc =
  | { durum: 'eksik'; eksikler: string[]; kismi: null }
  | {
      durum: 'hazir';
      eksikler: string[];
      simdiBrut: number;
      simdiNet: number;
      gelecekCanliKg: number;
      gelecekBrut: number;
      ekMaliyet: number;
      gelecekNet: number;
      marjinalFark: number;
      basabasGelecekFiyatKg: number | null;
      uyari: string[];
      batikMaliyetBas: number | null;
      /** Batık dahil gösterim — karar değil */
      donguKarSimdi: number | null;
      donguKarDevam: number | null;
    };

function kgSatisTutari(
  canliKg: number,
  birim: SatisBirimi,
  fiyatKg: number,
  verim: number | null,
): number | null {
  if (birim === 'canli_kg') return canliKg * fiyatKg;
  if (verim == null || verim <= 0 || verim > 1) return null;
  return canliKg * verim * fiyatKg;
}

export function hesaplaSatDevam(g: SatDevamGirdi): SatDevamSonuc {
  const eksikler: string[] = [];
  const uyari: string[] = [];

  if (g.canliKg == null || g.canliKg <= 0) eksikler.push('Güncel canlı ağırlık (kg)');
  if (g.satisFiyatKg == null || g.satisFiyatKg <= 0) eksikler.push('Satış fiyatı (₺/kg)');
  if (g.satisBirimi === 'karkas_kg' && (g.karkasVerim == null || g.karkasVerim <= 0 || g.karkasVerim > 1)) {
    eksikler.push('Karkas verimi (%) — canlı/kg karışımı için');
  }
  if (!Number.isFinite(g.ekGun) || g.ekGun < 1) eksikler.push('Ek besi günü (en az 1)');
  if (g.gunlukArtisKg == null || g.gunlukArtisKg < 0) eksikler.push('Günlük artış varsayımı (kg/gün)');
  if (g.gunlukEkYemKgBas == null || g.gunlukEkYemKgBas < 0) eksikler.push('Günlük ek yem (kg/baş)');
  if (g.yemFiyatKg == null || g.yemFiyatKg < 0) eksikler.push('Yem fiyatı (₺/kg)');

  if (g.gunlukBakimBas == null) {
    eksikler.push('Günlük bakım maliyeti (₺/baş/gün) — işçilik/su/yatak/sağlık');
  }

  if (eksikler.length > 0) return { durum: 'eksik', eksikler, kismi: null };

  const canli = g.canliKg!;
  const gun = Math.floor(g.ekGun);
  const artis = g.gunlukArtisKg!;
  const gelecekCanliKg = Math.round((canli + artis * gun) * 10) / 10;

  const simdiBrut = kgSatisTutari(canli, g.satisBirimi, g.satisFiyatKg!, g.karkasVerim);
  const gelecekBrut = kgSatisTutari(gelecekCanliKg, g.satisBirimi, g.satisFiyatKg!, g.karkasVerim);
  if (simdiBrut == null || gelecekBrut == null) {
    return { durum: 'eksik', eksikler: ['Satış birimi / verim tutarsız'], kismi: null };
  }

  const yemGunluk = g.gunlukEkYemKgBas! * g.yemFiyatKg!;
  const bakimGunluk = g.gunlukBakimBas ?? 0;
  const ekMaliyet = Math.round((yemGunluk + bakimGunluk) * gun);
  const simdiNet = Math.round(simdiBrut);
  const gelecekNet = Math.round(gelecekBrut - ekMaliyet);
  const marjinalFark = gelecekNet - simdiNet;

  const kgSatilabilir =
    g.satisBirimi === 'canli_kg' ? gelecekCanliKg : gelecekCanliKg * (g.karkasVerim ?? 0);
  const basabasGelecekFiyatKg =
    kgSatilabilir > 0 ? Math.round(((simdiNet + ekMaliyet) / kgSatilabilir) * 100) / 100 : null;

  if (g.kiloKaynagi === 'tahmin') uyari.push('Kilo tahmin — tartım doğrulanmalı.');
  if (g.kiloKaynagi === 'girilen') uyari.push('Kilo manuel girildi.');
  uyari.push('Doğrusal artış varsayımı; optimum gün veya garanti kâr iddiası yok.');

  const batik = g.batikMaliyetBas;
  const donguKarSimdi = batik != null ? simdiNet - batik : null;
  const donguKarDevam = batik != null ? gelecekNet - batik : null;

  return {
    durum: 'hazir',
    eksikler: [],
    simdiBrut,
    simdiNet,
    gelecekCanliKg,
    gelecekBrut: Math.round(gelecekBrut),
    ekMaliyet,
    gelecekNet,
    marjinalFark,
    basabasGelecekFiyatKg,
    uyari,
    batikMaliyetBas: batik,
    donguKarSimdi,
    donguKarDevam,
  };
}
