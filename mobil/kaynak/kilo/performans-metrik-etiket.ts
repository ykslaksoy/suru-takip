/**
 * Performans analitiği — Türkçe metrik adları ve birimler (hesap mantığı ayrı).
 */
export type PerformansMetrikKodu = 'FCR' | 'GCAA';

export type FcrKaynakKodu = 'gunluk_rasyon' | 'stok_cikis' | 'sayim_farki';

export const PERFORMANS_METRIK = {
  FCR: {
    baslik: 'Yemden yararlanma oranı',
    kisa: 'FCR',
    birim: 'kg yem/kg canlı ağırlık artışı',
    tooltip:
      'Dönemde verilen yem (kg) bölü ölçülen canlı ağırlık artışı (kg). Karşılaştırılabilir pozitif artışta genelde daha düşük değer daha iyidir; verim yüzdesi veya ters oran değildir.',
    yetersizVeri: 'Yemden yararlanma oranı için en az iki tartım, pozitif artış ve yem verisi gerekir.',
  },
  GCAA: {
    baslik: 'Günlük canlı ağırlık artışı',
    kisa: 'GCAA',
    birim: 'g/gün',
    tooltip:
      'En az iki ölçülen tartımdan hesaplanır; tahmin değildir. Günlük yem (kg/gün) ile karıştırılmaz. Eski kısaltma ADG yerine GCAA kullanılır.',
    yetersizVeri: 'Günlük canlı ağırlık artışı için en az iki tartım ve pozitif artış gerekir.',
  },
} as const;

const YEM_BAZ_GENEL =
  'Yem miktarı «olduğu gibi» (as-fed); kuru madde (KM) bilgisi kayıtlarda yoksa KM ile as-fed sessizce karıştırılmaz.';

const FCR_KAYNAK: Record<FcrKaynakKodu, string> = {
  gunluk_rasyon: 'Kaynak: planlanan günlük rasyon × gün',
  stok_cikis: 'Kaynak: stok çıkış kayıtları',
  sayim_farki: 'Kaynak: yem sayım farkı',
};

export function metrikBaslik(kod: PerformansMetrikKodu): string {
  const m = PERFORMANS_METRIK[kod];
  return `${m.baslik} (${m.kisa})`;
}

export function metrikKisaBirim(kod: PerformansMetrikKodu): string {
  const m = PERFORMANS_METRIK[kod];
  return `${m.kisa} · ${m.birim}`;
}

export function metrikTooltip(kod: PerformansMetrikKodu): string {
  return PERFORMANS_METRIK[kod].tooltip;
}

export function metrikYetersizVeri(kod: PerformansMetrikKodu): string {
  return PERFORMANS_METRIK[kod].yetersizVeri;
}

export function fcrDegerMetni(orani: number): string {
  return `${orani.toLocaleString('tr-TR')} ${PERFORMANS_METRIK.FCR.birim}`;
}

export function gcaaDegerMetni(gramGun: number): string {
  const kgGun = Math.round((gramGun / 1000) * 1000) / 1000;
  return `+${gramGun} ${PERFORMANS_METRIK.GCAA.birim} (${kgGun.toLocaleString('tr-TR')} kg/gün canlı ağırlık)`;
}

export function fcrYemBazAciklamasi(kaynak?: FcrKaynakKodu | null): string {
  if (!kaynak) return YEM_BAZ_GENEL;
  return `${YEM_BAZ_GENEL} ${FCR_KAYNAK[kaynak]}.`;
}

export function padokGcaaOzetEtiketi(): string {
  return `${metrikBaslik('GCAA')} ortalaması (yalnız ölçülenler)`;
}
