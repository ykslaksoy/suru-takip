/**
 * Mod 1 — Hızlı / kapalı kuzu besi aşı · vitamin · hap · yem planı.
 * Giriş koruma + yem dönüşümü; satılana kadar (~90 gün, isteğe bağlı +30).
 *
 * Minimum standart (Yüksel onay): tartı · İvermektin · Albendazol · karma · Selenyum-E.
 * A-D3-E / B kompleks rutin değil — zayıf/stres/iştah yoksa (AI veya elle “gerekli”).
 * Öncelik: Gün 1 tartı önerilen ilk; aynı seans aşı/iğne (kg yoksa ~20 kg, tipik 17–24 kg)
 * → 21 gün karma 2/2 → 15 günde bir tartım. Rutin gün-90 İvermektin/Albendazol yok.
 * Karma = klostridiyal + pastörella → ayrı çelertme gerekmez.
 */

import { ASI_PROGRAMI, asiMlDozYerEtiketi, asiKategori } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI, vitaminMlDozYerEtiketi } from '@/kaynak/akilli-veteriner/vitamin-programi';
import {
  TARTIM_15_PROGRAM_ID,
  TARTIM_GIRIS_PROGRAM_ID,
  type ModTakviyeKalemi,
  type TakviyeTip,
} from '@/kaynak/akilli-veteriner/takviye-tipler';

/** Plan kimliği — şablon değişince seed yeniler */
export const HIZLI_BESI_PLAN_SURUM = 'v15';

/** Tipik besi ufku (alım → satış) — gün */
export const BESI_SATIS_UFUK_GUN = 90;
/** İsteğe bağlı ek ay */
export const BESI_EK_SURE_GUN = 30;
/** Planlama tavanı (90 + 30) */
export const BESI_PLAN_TAVAN_GUN = BESI_SATIS_UFUK_GUN + BESI_EK_SURE_GUN;

/** @deprecated — karma klostridiyal kapsar; hızlı beside kullanılmıyor */
export const ENTEROTOKSEMI_RAPEL_PROGRAM_ID = 'enterotoksemi-rapel';

/** 21. gün karma rapel — ayrı plan kalemi */
export const KARMA_RAPEL_PROGRAM_ID = 'karma-rapel';

/**
 * @deprecated v13 — rutin satış öncesi pekiştirme kaldırıldı (klinik gerekçeyle elle).
 * Eski plan kayıtları için eşleme korunur.
 */
export const IVERMEKTIN_PEKISTIRME_ID = 'ivermektin-90';
/** @deprecated v13 — rutin satış öncesi pekiştirme kaldırıldı */
export const ALBENDAZOL_PEKISTIRME_ID = 'albendazol-90';

/** Rapel / pekiştirme → ana program */
export const RAPEL_ANA_PROGRAM: Record<string, string> = {
  [KARMA_RAPEL_PROGRAM_ID]: 'karma',
  [IVERMEKTIN_PEKISTIRME_ID]: 'ivermektin',
  [ALBENDAZOL_PEKISTIRME_ID]: 'albendazol',
};

export function rapelMi(programId: string): boolean {
  return programId in RAPEL_ANA_PROGRAM;
}

export function rapelAnaProgramId(programId: string): string | null {
  return RAPEL_ANA_PROGRAM[programId] ?? null;
}

export function tartimKontrolProgramId(gun: number): string {
  if (gun <= 1) return TARTIM_GIRIS_PROGRAM_ID;
  if (gun === 15) return TARTIM_15_PROGRAM_ID;
  return `tartim-gun-${gun}`;
}

export function tartimKontrolGun(programId: string): number | null {
  if (programId === TARTIM_GIRIS_PROGRAM_ID) return 1;
  if (programId === TARTIM_15_PROGRAM_ID) return 15;
  const m = programId.match(/^tartim-gun-(\d+)$/);
  return m ? Number(m[1]) : null;
}

/**
 * Girişte yapılan / yapılacak koruma (Padok B/C “eski” seed’de yapıldı sayılır).
 * Karma = klostridiyal + pastörella (çelertme dahil) — ayrı enterotoksemi yok.
 */
export const HIZLI_BESI_GIRIS_ASI_PARAZIT = [
  'karma',
  'albendazol',
  'ivermektin',
] as const;

/**
 * Minimum standart giriş paketi (bizim varsayılan).
 * Kullanıcı kendi standardını kaydederse o geçerlidir (gün 1 seçici).
 */
export const HIZLI_BESI_MIN_STANDART_ASI_PARAZIT = [
  'ivermektin',
  'albendazol',
  'karma',
] as const;

/** Tek standart vitamin/destek iğnesi — Selenyum-E */
export const HIZLI_BESI_MIN_STANDART_VITAMIN = ['selen-e'] as const;

/**
 * Giriş paketi vitamin / destek (B/C seed’de yapıldı).
 * v15: yalnız Selenyum-E. A-D3-E / B / yem destekleri rutin girişte değil.
 */
export const HIZLI_BESI_GIRIS_VITAMIN = [...HIZLI_BESI_MIN_STANDART_VITAMIN] as const;

/**
 * Opsiyonel gün-1 vitaminler — checklist’te durur, “hepsi”/varsayılan pakette yok.
 * AI veya çoban “gerekli” (zayıf / stres / iştah yok) işaretlerse eklenir.
 */
export const HIZLI_BESI_OPSIYONEL_VITAMIN = ['ad3e', 'b-kompleks'] as const;

/** Yem/beslenme — gün 1 seçicide yok; planda ayrı (yem listesi) */
export const HIZLI_BESI_BESLENME_PROGRAM = ['probiyotik', 'premiks'] as const;

export type BesiTakvimSatir = {
  tip: 'asi' | 'parazit' | 'vitamin' | 'tartim';
  programId: string;
  gun: number;
  not: string;
  /** Kaçıncı doz (plan içi) — aşı/iğne/hap */
  dozNo?: number;
  /** Toplam doz sayısı (plan içi) */
  toplamDoz?: number;
};

/**
 * Takvim: girişten satış ufkuna.
 * Gün 1 = alım tartımı (önerilen ilk) + aynı seans giriş aşı/iğne (kg) ·
 * 15+ = kontrol tartım · 21 = karma rapel
 * Rutin gün-90 parazit yok.
 */
function olusturHizliBesiTakvim(): BesiTakvimSatir[] {
  const base: BesiTakvimSatir[] = [
    {
      tip: 'tartim',
      programId: TARTIM_GIRIS_PROGRAM_ID,
      gun: 1,
      not: 'Alım tartımı (T1) · önerilen ilk — dozlar buna göre; aynı seans diğer işler de olur',
    },
    {
      tip: 'parazit',
      programId: 'ivermektin',
      gun: 1,
      not: 'İç-dış parazit iğne — tartarken / aynı seans önce',
      dozNo: 1,
      toplamDoz: 1,
    },
    {
      tip: 'parazit',
      programId: 'albendazol',
      gun: 1,
      not: 'İç parazit hapı · her 10 kiloya 1 hap',
      dozNo: 1,
      toplamDoz: 1,
    },
    {
      tip: 'asi',
      programId: 'karma',
      gun: 1,
      not: 'Klostridiyal + pastörella (çelertme dahil · 1. doz)',
      dozNo: 1,
      toplamDoz: 2,
    },
    {
      tip: 'vitamin',
      programId: 'ad3e',
      gun: 1,
      not: 'Opsiyonel · zayıf / kapalı / iştah yoksa (gerekli işaretlenince)',
      dozNo: 1,
      toplamDoz: 1,
    },
    {
      tip: 'vitamin',
      programId: 'b-kompleks',
      gun: 1,
      not: 'Opsiyonel · stres / nakil / iştah yoksa (gerekli işaretlenince)',
      dozNo: 1,
      toplamDoz: 1,
    },
    {
      tip: 'vitamin',
      programId: 'selen-e',
      gun: 1,
      not: 'Kas · beyaz kas · kilo alımı — minimum standart · tartı ile aynı seans',
      dozNo: 1,
      toplamDoz: 1,
    },
    {
      tip: 'vitamin',
      programId: 'probiyotik',
      gun: 1,
      not: 'Beslenme · yem listesinde (gün 1 seçicide yok)',
      dozNo: 1,
      toplamDoz: 1,
    },
    {
      tip: 'vitamin',
      programId: 'premiks',
      gun: 1,
      not: 'Beslenme · yem listesinde (gün 1 seçicide yok)',
      dozNo: 1,
      toplamDoz: 1,
    },
    { tip: 'tartim', programId: TARTIM_15_PROGRAM_ID, gun: 15, not: 'Kontrol tartımı — sağlık sonrası' },
    {
      tip: 'asi',
      programId: KARMA_RAPEL_PROGRAM_ID,
      gun: 21,
      not: 'Karma rapel (2. doz · 21 gün)',
      dozNo: 2,
      toplamDoz: 2,
    },
  ];

  // 15 günde bir tartım — satış + ek süre tavanına kadar
  for (let gun = 30; gun <= BESI_PLAN_TAVAN_GUN; gun += 15) {
    base.push({
      tip: 'tartim',
      programId: tartimKontrolProgramId(gun),
      gun,
      not:
        gun === BESI_SATIS_UFUK_GUN
          ? `Kontrol tartımı · ~${gun}. gün (satış ufku)`
          : gun === BESI_PLAN_TAVAN_GUN
            ? `Kontrol tartımı · ~${gun}. gün (ek süre sonu)`
            : `Kontrol tartımı · ${gun}. gün`,
    });
  }

  return base.sort(
    (a, b) =>
      a.gun - b.gun ||
      takviyeGorevOncelikSira(a.tip, a.programId) - takviyeGorevOncelikSira(b.tip, b.programId),
  );
}

export const HIZLI_BESI_TAKVIM: BesiTakvimSatir[] = olusturHizliBesiTakvim();

/** Plan satırından doz sırası (rapel dahil) */
export function planDozSirasi(programId: string): { dozNo: number; toplamDoz: number } | null {
  const satir = HIZLI_BESI_TAKVIM.find((e) => e.programId === programId);
  if (satir?.dozNo != null && satir.toplamDoz != null) {
    return { dozNo: satir.dozNo, toplamDoz: satir.toplamDoz };
  }
  return null;
}

/** Görev / UI: doz miktarı · N/M doz · uygulama yeri */
export function planMlDozYerEtiketi(tip: TakviyeTip | string, programId: string): string | null {
  const doz = planDozSirasi(programId);
  const opts = doz ? { dozNo: doz.dozNo, toplamDoz: doz.toplamDoz } : { dozNo: 1, toplamDoz: 1 };

  if (programId === KARMA_RAPEL_PROGRAM_ID) {
    const p = ASI_PROGRAMI.find((x) => x.id === 'karma');
    return p ? asiMlDozYerEtiketi(p, { dozNo: 2, toplamDoz: 2 }) : null;
  }
  if (programId === IVERMEKTIN_PEKISTIRME_ID) {
    const p = ASI_PROGRAMI.find((x) => x.id === 'ivermektin');
    return p ? asiMlDozYerEtiketi(p, { dozNo: 2, toplamDoz: 2 }) : null;
  }
  if (programId === ALBENDAZOL_PEKISTIRME_ID) {
    const p = ASI_PROGRAMI.find((x) => x.id === 'albendazol');
    return p ? asiMlDozYerEtiketi(p, { dozNo: 2, toplamDoz: 2 }) : null;
  }
  if (tip === 'vitamin') {
    const v = VITAMIN_PROGRAMI.find((x) => x.id === programId);
    return v ? vitaminMlDozYerEtiketi(v, opts) : null;
  }
  const p = ASI_PROGRAMI.find((x) => x.id === programId);
  if (!p) return null;
  return asiMlDozYerEtiketi(p, opts);
}

/** Yem — aşı listesine karışmaz; ayrı görev kategorisi */
export type YemTakvimSatir = {
  id: string;
  gun: number;
  /** Türkçe açıklama (başlık) */
  koruma: string;
  /** Uygulama / ürün (parantez) */
  urun: string;
  not: string;
};

function olusturYemTakvim(): YemTakvimSatir[] {
  const out: YemTakvimSatir[] = [
    {
      id: 'yem-giris',
      gun: 0,
      koruma: 'Besi rasyonu başlat',
      urun: 'Hazır kuzu yemi + arpa + yonca + saman',
      not: 'Gözlem/giriş — günlük karışım; gün 1 tartı ile aynı seans kg güncelle',
    },
    {
      id: 'yem-hafta1',
      gun: 7,
      koruma: 'Rasyon miktar kontrolü',
      urun: 'Günlük yem ayarı',
      not: '1. hafta — iştah ve padok ortalamasına göre',
    },
  ];
  for (let gun = 15; gun <= BESI_PLAN_TAVAN_GUN; gun += 15) {
    out.push({
      id: `yem-gun-${gun}`,
      gun,
      koruma:
        gun === BESI_SATIS_UFUK_GUN
          ? 'Satış ufku yem kontrolü'
          : gun === BESI_PLAN_TAVAN_GUN
            ? 'Ek süre sonu yem kontrolü'
            : 'Tartım sonrası yem güncelle',
      urun: 'Padok kuzu besi rasyonu',
      not: `${gun}. gün — canlı ağırlığa göre kg/hayvan`,
    });
  }
  return out;
}

export const HIZLI_BESI_YEM_TAKVIM: YemTakvimSatir[] = olusturYemTakvim();

/** Görev listesi sırası — düşük = önce (gün 1: tartı önerilen ilk) */
export function takviyeGorevOncelikSira(tip: TakviyeTip, programId: string): number {
  if (programId === TARTIM_GIRIS_PROGRAM_ID) return 0;
  if (programId === TARTIM_15_PROGRAM_ID) return 93;
  if (programId === KARMA_RAPEL_PROGRAM_ID) return 94;
  if (programId === IVERMEKTIN_PEKISTIRME_ID) return 95;
  if (programId === ALBENDAZOL_PEKISTIRME_ID) return 96;
  const tGun = tartimKontrolGun(programId);
  if (tGun != null) return 100 + tGun;
  if (tip === 'tartim') return 200;
  const sira: Record<string, number> = {
    ivermektin: 1,
    albendazol: 2,
    karma: 3,
    'selen-e': 5,
    ad3e: 10,
    'b-kompleks': 11,
    probiyotik: 12,
    premiks: 13,
  };
  return sira[programId] ?? 50;
}

/** Türkçe koruma (ilaç/aşı adı) — tek satır */
export function asiGorunumBaslik(koruma: string, asiAdi: string): string {
  const k = koruma.trim();
  const a = asiAdi.trim();
  if (!a) return k;
  if (!k) return a;
  return `${k} (${a})`;
}

export function gunEtiket(gun: number): string {
  if (gun <= 0) return 'Gün 0 — Giriş (gözlem)';
  if (gun === 1) return 'Gün 1 — Tartı önce · aynı gün diğer işler';
  if (gun === BESI_SATIS_UFUK_GUN) return `Gün ${gun} — Satış ufku`;
  if (gun === BESI_PLAN_TAVAN_GUN) return `Gün ${gun} — Ek süre sonu`;
  return `Gün ${gun}`;
}

function kalemOlustur(
  tip: ModTakviyeKalemi['tip'],
  programId: string,
): ModTakviyeKalemi | null {
  if (programId === KARMA_RAPEL_PROGRAM_ID) {
    const p = ASI_PROGRAMI.find((x) => x.id === 'karma');
    if (!p) return null;
    return {
      tip: 'asi',
      programId: KARMA_RAPEL_PROGRAM_ID,
      ad: 'Klostridiyal + pastörella pekiştirme',
      detay: 'Karma aşı 2. doz',
      mlEtiket: asiMlDozYerEtiketi(p, { dozNo: 2, toplamDoz: 2 }),
    };
  }
  if (programId === IVERMEKTIN_PEKISTIRME_ID) {
    const p = ASI_PROGRAMI.find((x) => x.id === 'ivermektin');
    if (!p) return null;
    return {
      tip: 'parazit',
      programId: IVERMEKTIN_PEKISTIRME_ID,
      ad: 'İç-dış parazit pekiştirme',
      detay: 'İvermektin iğne',
      mlEtiket: asiMlDozYerEtiketi(p, { dozNo: 2, toplamDoz: 2 }),
    };
  }
  if (programId === ALBENDAZOL_PEKISTIRME_ID) {
    const p = ASI_PROGRAMI.find((x) => x.id === 'albendazol');
    if (!p) return null;
    return {
      tip: 'parazit',
      programId: ALBENDAZOL_PEKISTIRME_ID,
      ad: 'İç parazit pekiştirme',
      detay: 'Albendazol',
      mlEtiket: asiMlDozYerEtiketi(p, { dozNo: 2, toplamDoz: 2 }),
    };
  }
  if (programId === TARTIM_GIRIS_PROGRAM_ID) {
    return {
      tip: 'tartim',
      programId: TARTIM_GIRIS_PROGRAM_ID,
      ad: 'Alım tartımı',
      detay: 'T1 · gün 1 önerilen ilk',
      mlEtiket: 'Önerilen ilk',
    };
  }
  const tGun = tartimKontrolGun(programId);
  if (tip === 'tartim' || tGun != null) {
    const gun = tGun ?? 15;
    return {
      tip: 'tartim',
      programId: tartimKontrolProgramId(gun),
      ad: gun === 15 ? '15 günde bir tartım' : `${gun}. gün tartım`,
      detay: 'Kontrol tartımı',
      mlEtiket: `${gun}. gün`,
    };
  }
  if (tip === 'vitamin') {
    const v = VITAMIN_PROGRAMI.find((x) => x.id === programId);
    if (!v) return null;
    const doz = planDozSirasi(programId) ?? { dozNo: 1, toplamDoz: 1 };
    return {
      tip: 'vitamin',
      programId: v.id,
      ad: v.detay,
      detay: v.ad,
      mlEtiket: vitaminMlDozYerEtiketi(v, doz),
    };
  }
  const p = ASI_PROGRAMI.find((x) => x.id === programId);
  if (!p) return null;
  const kat = asiKategori(p);
  const doz = planDozSirasi(programId) ?? { dozNo: 1, toplamDoz: 1 };
  return {
    tip: kat === 'parazit' ? 'parazit' : 'asi',
    programId: p.id,
    ad: p.koruma,
    detay: p.ad,
    mlEtiket: asiMlDozYerEtiketi(p, doz),
  };
}

/**
 * Mod 1 şablonu — satış ufkuna kadar tüm kalemler.
 */
export function hizliBesiTakviyeSablonu(): ModTakviyeKalemi[] {
  const seen = new Set<string>();
  const out: ModTakviyeKalemi[] = [];

  for (const s of HIZLI_BESI_TAKVIM) {
    const key = `${s.tip}:${s.programId}`;
    if (seen.has(key)) continue;
    const k = kalemOlustur(s.tip, s.programId);
    if (!k) continue;
    seen.add(key);
    out.push(k);
  }
  return out;
}

/**
 * Padok A / Gözlem (yeni alım): HIZLI_BESI_TAKVIM’den plan günü.
 * Planda yoksa null — görev “Diğer”e düşer (pasteurella vb. gün 1’e yapışmasın).
 */
export function hizliBesiPlanGun(tip: string, programId: string): number | null {
  const satir = HIZLI_BESI_TAKVIM.find((e) => e.programId === programId);
  if (satir) return satir.gun;
  if (programId === TARTIM_GIRIS_PROGRAM_ID) return 1;
  const tGun = tartimKontrolGun(programId);
  if (tGun != null) return tGun;
  if (tip === 'tartim') return 15;
  if (programId === 'selen-e') return 1;
  return null;
}

export const HIZLI_BESI_PLAN_BASLIK =
  'Hızlı besi — min. standart: tartı · İvermektin · Albendazol · karma · Selenyum-E · ~90+30 gün';
