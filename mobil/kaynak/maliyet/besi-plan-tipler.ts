/** Besi planlama — taslak; onay stok/rasyon/hayvan kaydı değiştirmez. */

import type { BesiEkonomiKalem } from '@/kaynak/maliyet/besi-ekonomi-kalem';

export type BesiDonemTuru = 'varis_gozlem' | 'uyum' | 'buyume' | 'bitirme';

export const BESI_DONEM_ETIKET: Record<BesiDonemTuru, string> = {
  varis_gozlem: 'Varış / gözlem',
  uyum: 'Uyum / adaptasyon',
  buyume: 'Büyüme',
  bitirme: 'Bitirme',
};

export type BesiPlanDonemGirdi = {
  id: string;
  tur: BesiDonemTuru;
  gun: number;
  /** Kullanıcı — ölçülmezse null */
  gcaaGramGun: number | null;
  gunlukYemKgBas: number | null;
  yemFiyatKg: number | null;
  gunlukBakimBas: number | null;
  not?: string;
};

export type BesiPlanKapsam = { tur: 'genel' | 'padok' | 'hayvan' | 'grup'; etiket: string; hayvanId?: string };

export type BesiPlanSenaryo = {
  id: string;
  surum: number;
  durum: 'taslak' | 'onayli' | 'iptal';
  baslik: string;
  kapsam: BesiPlanKapsam;
  basSayisi: number | null;
  girisKg: number | null;
  girisTarih: string | null;
  alisBasFiyat: number | null;
  hedefCanliKg: number | null;
  hedefGun: number | null;
  donemler: BesiPlanDonemGirdi[];
  /** Besi Yönetimi maliyet kalemleri (taslak) */
  ekonomiKalemler?: BesiEkonomiKalem[];
  olusturma: string;
  guncelleme: string;
  onayTarihi?: string;
  /** Onay = senaryo kilidi; yem tüketimi otomatik başlamaz */
  onayNotu?: string;
};

export type BesiPlanDepo = { surum: 1; senaryolar: BesiPlanSenaryo[] };

export type BesiPlanDonemProjeksiyon = {
  tur: BesiDonemTuru;
  gun: number;
  girisKg: number;
  cikisKg: number;
  artisKg: number;
  yemKg: number;
  yemMaliyet: number;
  bakimMaliyet: number;
  eksikler: string[];
};

export type BesiPlanProjeksiyon =
  | { durum: 'eksik'; eksikler: string[]; donemler: BesiPlanDonemProjeksiyon[] }
  | {
      durum: 'hazir';
      eksikler: string[];
      donemler: BesiPlanDonemProjeksiyon[];
      toplamGun: number;
      toplamArtisKg: number;
      toplamYemKg: number;
      toplamMaliyet: number;
      birlesikFcr: number | null;
      cikisKg: number;
      uyari: string[];
    };
