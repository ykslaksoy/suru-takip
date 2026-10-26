import type { MeraHaritaBelge } from './harita';

export const MERA_KAPASITE_ANAHTAR = 'sy_mera_kapasite_v1';

export type MeraAlanBirim = 'donum' | 'ha';

export type MeraTarlaUygulama = {
  id: string;
  tur: 'ilac' | 'gubre';
  ad: string;
  uygulamaTarihi: string;
  otlatmaBitis: string;
  not: string;
};

export type MeraKapasiteAyar = {
  alan: number;
  birim: MeraAlanBirim;
  tasimaBasHa: number;
  uygulamalar: MeraTarlaUygulama[];
  guncelleme: string;
};

export function donumToHa(donum: number): number {
  return donum / 10;
}

export function alanHa(ayar: MeraKapasiteAyar): number {
  const a = Math.max(0, ayar.alan);
  return ayar.birim === 'ha' ? a : donumToHa(a);
}

export function meraHayvanSayisi(belge: MeraHaritaBelge): number {
  return belge.padoklar.features.reduce((s, f) => {
    const tur = f.properties.tur;
    const adet = f.properties.hayvan ?? 0;
    if (tur === 'mera' || tur === 'padok' || tur === 'yonca') return s + adet;
    return s;
  }, 0);
}

export function meraTasimaKapasitesi(ayar: MeraKapasiteAyar): number {
  const ha = alanHa(ayar);
  if (ha <= 0) return 0;
  return Math.floor(ha * ayar.tasimaBasHa);
}

export type MeraKapasiteSonuc = {
  hayvan: number;
  kapasite: number;
  ha: number;
  asiri: boolean;
  uyari: string | null;
};

export function degerlendirMeraKapasite(ayar: MeraKapasiteAyar, hayvan: number): MeraKapasiteSonuc {
  const ha = alanHa(ayar);
  const kapasite = meraTasimaKapasitesi(ayar);
  if (ha <= 0 || kapasite <= 0) {
    return { hayvan, kapasite, ha, asiri: false, uyari: 'Alan veya taşıma kapasitesi girilmedi.' };
  }
  const asiri = hayvan > kapasite;
  return {
    hayvan,
    kapasite,
    ha,
    asiri,
    uyari: asiri ? 'Aşırı otlatma / rotasyon — hayvan sayısını düşürün veya alan ekleyin.' : null,
  };
}

export function aktifOtlatmaYasaklari(uygulamalar: MeraTarlaUygulama[], bugun = new Date()): MeraTarlaUygulama[] {
  const iso = bugun.toISOString().slice(0, 10);
  return uygulamalar.filter((u) => u.otlatmaBitis >= iso);
}
