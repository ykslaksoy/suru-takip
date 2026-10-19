/**
 * Otomatik aşı tabancası (ayarlı dozlu enjektör) — saf hesap, depolama yok.
 *
 * - Sabit dozlu aşı/vitamin: katalog dozu (ör. karma 2 ml).
 * - Kiloya göre iğne (ivermektin, doramektin): doz-hesap ile kuzu başı ml,
 *   seçili grubun ortalama kilosundan ayar → tabancanın adımına yuvarlanır.
 * - Kilosu olmayan kuzu: geçici ~20 kg (uygulamanın genel varsayımı), işaretlenir.
 * - Ayardan bir adımdan fazla sapan kuzular "ayrı ayarla" listesine düşer.
 */
import { ASI_PROGRAMI } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI } from '@/kaynak/akilli-veteriner/vitamin-programi';
import { RAPEL_ANA_PROGRAM } from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import { hesaplaToplamMl } from '@/kaynak/akilli-veteriner/doz-hesap';
import type { IlacDoz } from '@/kaynak/akilli-veteriner/teshis';

/** Tabanca kapasitesi (en yüksek doz, ml) — kullanıcı seçer */
export const TABANCA_KAPASITELERI = [1, 2, 5] as const;
export type TabancaKapasite = (typeof TABANCA_KAPASITELERI)[number];
export const VARSAYILAN_TABANCA_KAPASITE: TabancaKapasite = 2;

/** Kilosu bilinmeyen kuzu için geçici kilo (uygulama geneli: ~20 kg) */
export const KILO_YOK_VARSAYILAN_KG = 20;

/** İğne ucu değişimi: her N kuzuda bir (ve her aşı türünde yeni uç) */
export const IGNE_UCU_DEGISIM_KUZU = 20;

/** Ayar adımı: kapasitenin onda biri (1 ml → 0,1 · 2 ml → 0,2 · 5 ml → 0,5) */
export function tabancaAdimi(kapasite: number): number {
  return Math.round((kapasite / 10) * 100) / 100;
}

function yuvarla2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Değeri adıma yuvarla (en az bir adım) */
export function adimaYuvarla(ml: number, adim: number): number {
  if (!(ml > 0) || !(adim > 0)) return adim;
  return yuvarla2(Math.max(adim, Math.round(ml / adim) * adim));
}

export function mlMetni(ml: number): string {
  return String(yuvarla2(ml)).replace('.', ',');
}

/**
 * Kiloya göre iğneler — doz-hesap protokolü (teshis.ts ivermektin ile aynı:
 * 0,2 mg/kg, %1 ürün 10 mg/ml → her 10 kiloya 0,2 ml).
 */
export const KILOYA_GORE_IGNE: Record<string, IlacDoz> = {
  ivermektin: { id: 'ivermektin', ilacAdi: 'İvermektin', tip: 'igne', doz: '', mgPerKg: 0.2, urunMgMl: 10, uygulama: 'SC', siklik: 'Tek doz' },
  doramektin: { id: 'doramektin', ilacAdi: 'Doramektin', tip: 'igne', doz: '', mgPerKg: 0.2, urunMgMl: 10, uygulama: 'SC', siklik: 'Tek doz' },
};

export type TabancaDozTipi =
  | { tur: 'sabit'; ml: number }
  | { tur: 'kilo'; ilac: IlacDoz }
  | { tur: 'uygun_degil'; neden: string };

/** Program için tabanca doz tipi (rapel id'leri ana programa çevrilir) */
export function tabancaDozTipi(programId: string): TabancaDozTipi {
  const id = RAPEL_ANA_PROGRAM[programId] ?? programId;
  const kilo = KILOYA_GORE_IGNE[id];
  if (kilo) return { tur: 'kilo', ilac: kilo };
  const asi = ASI_PROGRAMI.find((p) => p.id === id);
  if (asi) {
    if (asi.mlHayvan != null) return { tur: 'sabit', ml: asi.mlHayvan };
    return { tur: 'uygun_degil', neden: asi.uygulamaYeri === 'ağızdan' ? 'ağızdan verilir' : 'çizik / kutuya bak' };
  }
  const v = VITAMIN_PROGRAMI.find((x) => x.id === id);
  if (v) {
    if (v.uygulama === 'igne' && v.mlHayvan != null) return { tur: 'sabit', ml: v.mlHayvan };
    return { tur: 'uygun_degil', neden: v.uygulama === 'igne' ? 'kutuya bak' : 'iğne değil' };
  }
  return { tur: 'uygun_degil', neden: 'doz bilinmiyor' };
}

export type TabancaKuzu = { id: string; etiket: string; kg: number | null };

export type TabancaAyriKuzu = { id: string; etiket: string; ml: number; kg: number; kiloYok: boolean };

export type TabancaAyari = {
  uygun: true;
  kapasite: number;
  adim: number;
  /** Tabancanın ayarlanacağı ml */
  ayarMl: number;
  /** Doz kapasiteyi aşarsa kuzu başı basış sayısı */
  basis: number;
  /** Kuzu başı gerçek doz (sabit doz veya ortalama kilodan) */
  dozMl: number;
  kuzuSayisi: number;
  /** Şişede gereken toplam ml */
  toplamMl: number;
  kiloyaGore: boolean;
  ortKg: number | null;
  ayri: TabancaAyriKuzu[];
  /** Kilosu olmayan (≈20 kg sayılan) kuzular */
  kiloYok: { id: string; etiket: string }[];
  satir: string;
};

export type TabancaUygunDegil = { uygun: false; satir: string };

/** Ayar satırı: "Tabancayı 2 ml'ye ayarla · 42 kuzu · şişede ~84 ml gerekir" */
export function tabancaAyariHesapla(
  programId: string,
  kuzular: TabancaKuzu[],
  kapasite: number = VARSAYILAN_TABANCA_KAPASITE,
): TabancaAyari | TabancaUygunDegil {
  const tip = tabancaDozTipi(programId);
  if (tip.tur === 'uygun_degil') {
    return { uygun: false, satir: `Bu kalemde tabanca kullanılmaz (${tip.neden}).` };
  }
  const adim = tabancaAdimi(kapasite);
  const n = kuzular.length;

  if (tip.tur === 'sabit') {
    const basis = Math.max(1, Math.ceil(tip.ml / kapasite - 1e-9));
    const ayarMl = adimaYuvarla(tip.ml / basis, adim);
    const toplamMl = yuvarla2(tip.ml * n);
    const basisMetni = basis > 1 ? `, her kuzuya ${basis} kez bas` : '';
    return {
      uygun: true,
      kapasite,
      adim,
      ayarMl,
      basis,
      dozMl: tip.ml,
      kuzuSayisi: n,
      toplamMl,
      kiloyaGore: false,
      ortKg: null,
      ayri: [],
      kiloYok: [],
      satir: `Tabancayı ${mlMetni(ayarMl)} ml'ye ayarla${basisMetni} · ${n} kuzu · şişede ~${mlMetni(toplamMl)} ml gerekir`,
    };
  }

  // Kiloya göre
  const etkin = kuzular.map((k) => ({ ...k, kgEtkin: k.kg != null && k.kg > 0 ? k.kg : KILO_YOK_VARSAYILAN_KG, kiloYok: !(k.kg != null && k.kg > 0) }));
  const tartili = etkin.filter((k) => !k.kiloYok);
  const ortKg =
    n === 0
      ? KILO_YOK_VARSAYILAN_KG
      : yuvarla2((tartili.length ? tartili : etkin).reduce((s, k) => s + k.kgEtkin, 0) / (tartili.length || etkin.length));
  const dozMl = hesaplaToplamMl(tip.ilac, ortKg) ?? 0;
  const basis = Math.max(1, Math.ceil(dozMl / kapasite - 1e-9));
  const ayarMl = adimaYuvarla(dozMl / basis, adim);
  const ayarToplam = ayarMl * basis;

  const ayri: TabancaAyriKuzu[] = [];
  let toplamMl = 0;
  for (const k of etkin) {
    const ham = hesaplaToplamMl(tip.ilac, k.kgEtkin) ?? 0;
    const kendi = adimaYuvarla(ham, adim);
    if (Math.abs(kendi - ayarToplam) > adim + 1e-9) {
      ayri.push({ id: k.id, etiket: k.etiket, ml: kendi, kg: k.kgEtkin, kiloYok: k.kiloYok });
      toplamMl += kendi;
    } else {
      toplamMl += ayarToplam;
    }
  }
  toplamMl = yuvarla2(toplamMl);
  const basisMetni = basis > 1 ? `, her kuzuya ${basis} kez bas` : '';
  return {
    uygun: true,
    kapasite,
    adim,
    ayarMl,
    basis,
    dozMl,
    kuzuSayisi: n,
    toplamMl,
    kiloyaGore: true,
    ortKg,
    ayri,
    kiloYok: etkin.filter((k) => k.kiloYok).map((k) => ({ id: k.id, etiket: k.etiket })),
    satir: `Tabancayı ${mlMetni(ayarMl)} ml'ye ayarla${basisMetni} · ${n} kuzu · şişede ~${mlMetni(toplamMl)} ml gerekir`,
  };
}

/** "Bu kuzuları ayrı ayarla: TR… (3 ml), …" */
export function ayriAyarMetni(ayar: TabancaAyari): string | null {
  if (ayar.ayri.length === 0) return null;
  return 'Bu kuzuları ayrı ayarla: ' + ayar.ayri.map((k) => `${k.etiket} (${mlMetni(k.ml)} ml${k.kiloYok ? ', kilo yok' : ''})`).join(', ');
}

/** İğne ucu: her aşı türünde yeni uç + her 20 kuzuda bir (hangisi fazlaysa) */
export function igneUcuAdedi(kuzuSayisi: number, degisimHer: number = IGNE_UCU_DEGISIM_KUZU): number {
  if (kuzuSayisi <= 0) return 0;
  return Math.max(1, Math.ceil(kuzuSayisi / degisimHer));
}

/** Birden çok aşı türü için toplam iğne ucu */
export function igneUcuToplam(kuzuSayilari: number[], degisimHer: number = IGNE_UCU_DEGISIM_KUZU): number {
  return kuzuSayilari.reduce((s, n) => s + igneUcuAdedi(n, degisimHer), 0);
}

export function igneUcuKurali(degisimHer: number = IGNE_UCU_DEGISIM_KUZU): string {
  return `her ${degisimHer} kuzuda bir veya her aşı türünde yeni uç (hangisi fazlaysa)`;
}

/** Stok adından tabanca / iğne ucu tanıma */
function norm(s: string): string {
  return s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
}
export function tabancaStokMu(ad: string): boolean {
  const n = norm(ad);
  return n.includes('tabanca') && !n.includes('ucu') && !n.includes('uc ');
}
export function igneUcuStokMu(ad: string): boolean {
  const n = norm(ad);
  return n.includes('igne ucu') || (n.includes('tabanca') && n.includes('uc'));
}

/** Sesli geri okuma ön eki: "Tabanca 2 ml" */
export function tabancaSesOneki(ayarMl: number): string {
  return `Tabanca ${mlMetni(ayarMl)} ml`;
}
