import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { meraHaritaPadoklarlaSenkron } from './harita';
import {
  aktifOtlatmaYasaklari,
  degerlendirMeraKapasite,
  meraHayvanSayisi,
  MERA_KAPASITE_ANAHTAR,
  type MeraKapasiteAyar,
  type MeraKapasiteSonuc,
  type MeraTarlaUygulama,
} from './kapasite-hesap';

export {
  MERA_KAPASITE_ANAHTAR,
  aktifOtlatmaYasaklari,
  alanHa,
  degerlendirMeraKapasite,
  donumToHa,
  meraHayvanSayisi,
  meraTasimaKapasitesi,
  type MeraAlanBirim,
  type MeraKapasiteAyar,
  type MeraKapasiteSonuc,
  type MeraTarlaUygulama,
} from './kapasite-hesap';

const VARSAYILAN: MeraKapasiteAyar = {
  alan: 0,
  birim: 'donum',
  tasimaBasHa: 4,
  uygulamalar: [],
  guncelleme: new Date(0).toISOString(),
};

export async function meraKapasiteOku(): Promise<MeraKapasiteAyar> {
  const raw = await kaliciGetItem(MERA_KAPASITE_ANAHTAR);
  if (!raw) return { ...VARSAYILAN };
  try {
    const p = JSON.parse(raw) as Partial<MeraKapasiteAyar>;
    return {
      alan: typeof p.alan === 'number' ? p.alan : 0,
      birim: p.birim === 'ha' ? 'ha' : 'donum',
      tasimaBasHa: typeof p.tasimaBasHa === 'number' && p.tasimaBasHa > 0 ? p.tasimaBasHa : 4,
      uygulamalar: Array.isArray(p.uygulamalar) ? p.uygulamalar : [],
      guncelleme: p.guncelleme ?? new Date().toISOString(),
    };
  } catch {
    return { ...VARSAYILAN };
  }
}

export async function meraKapasiteKaydet(
  patch: Partial<Pick<MeraKapasiteAyar, 'alan' | 'birim' | 'tasimaBasHa'>>,
): Promise<MeraKapasiteAyar> {
  const mevcut = await meraKapasiteOku();
  const yeni: MeraKapasiteAyar = {
    ...mevcut,
    ...patch,
    guncelleme: new Date().toISOString(),
  };
  await kaliciSetItem(MERA_KAPASITE_ANAHTAR, JSON.stringify(yeni));
  return yeni;
}

export async function meraUygulamaEkle(input: Omit<MeraTarlaUygulama, 'id'> & { id?: string }): Promise<MeraKapasiteAyar> {
  const mevcut = await meraKapasiteOku();
  const kayit: MeraTarlaUygulama = {
    id: input.id ?? `mu-${Date.now()}`,
    tur: input.tur === 'gubre' ? 'gubre' : 'ilac',
    ad: input.ad.trim(),
    uygulamaTarihi: input.uygulamaTarihi.slice(0, 10),
    otlatmaBitis: input.otlatmaBitis.slice(0, 10),
    not: (input.not ?? '').trim(),
  };
  mevcut.uygulamalar.unshift(kayit);
  mevcut.guncelleme = new Date().toISOString();
  await kaliciSetItem(MERA_KAPASITE_ANAHTAR, JSON.stringify(mevcut));
  return mevcut;
}

export async function meraKapasiteOzeti(): Promise<MeraKapasiteSonuc & { ayar: MeraKapasiteAyar; yasaklar: MeraTarlaUygulama[] }> {
  const [ayar, belge] = await Promise.all([meraKapasiteOku(), meraHaritaPadoklarlaSenkron()]);
  const hayvan = meraHayvanSayisi(belge);
  const sonuc = degerlendirMeraKapasite(ayar, hayvan);
  const yasaklar = aktifOtlatmaYasaklari(ayar.uygulamalar);
  return { ...sonuc, ayar, yasaklar };
}
