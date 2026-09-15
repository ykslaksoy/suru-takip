/**
 * Gün 1 oturum seçimi — çoban önce ne yapacağını seçer,
 * sonra yalnızca seçilen kalemler adım adım gösterilir.
 * Minimum standart: tartı · İvermektin · Albendazol · karma · Selenyum-E.
 * A-D3-E / B kompleks checklist’te opsiyonel; “hepsi”de yok.
 * Kullanıcı kendi standardını kaydederse o bizimkini ezer.
 * Beslenme / yem seçicide YOK.
 */
import {
  HIZLI_BESI_BESLENME_PROGRAM,
  HIZLI_BESI_GIRIS_ASI_PARAZIT,
  HIZLI_BESI_GIRIS_VITAMIN,
  HIZLI_BESI_MIN_STANDART_ASI_PARAZIT,
  HIZLI_BESI_MIN_STANDART_VITAMIN,
  HIZLI_BESI_OPSIYONEL_VITAMIN,
  HIZLI_BESI_TAKVIM,
} from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import { TARTIM_GIRIS_PROGRAM_ID } from '@/kaynak/akilli-veteriner/takviye-tipler';
import type { Gorev } from '@/kaynak/gorevler/siralama';
import type { GorevGunGrup } from '@/kaynak/gorevler/kategoriler';

const KEY = 'sy_gun1_oturum_secim_v1';
const STANDART_KEY = 'sy_kullanici_giris_standart_v1';

/** Node testte RN çekmemek için lazy */
async function depo() {
  return import('@/kaynak/cekirdek/web-kalici-depo');
}

/** Varsayılan padok/parti anahtarı — açık alım sürüsü */
export const GUN1_SECIM_VARSAYILAN_PADOK = 'acik-alim';

/**
 * Beslenme / yem kalemleri — gün 1 seçicide ve rehber paketlerinde yok.
 */
export const GUN1_BESLENME_PROGRAM_IDS = HIZLI_BESI_BESLENME_PROGRAM;

/** Bizim minimum standart (kullanıcı override yoksa) */
export const GUN1_MIN_STANDART_PROGRAM_IDS: readonly string[] = [
  TARTIM_GIRIS_PROGRAM_ID,
  ...HIZLI_BESI_MIN_STANDART_ASI_PARAZIT,
  ...HIZLI_BESI_MIN_STANDART_VITAMIN,
];

export type Gun1SecimMod =
  | 'sadece-tartim'
  | 'tarti-parazit-karma'
  | 'hepsi'
  | 'ozel';

export type Gun1SecimKayit = {
  /** YYYY-MM-DD (yerel) */
  tarih: string;
  /** Padok / parti kimliği */
  padokAnahtar: string;
  mod: Gun1SecimMod;
  programIds: string[];
  kaydedildiAt: string;
};

export type Gun1Secenek = {
  mod: Gun1SecimMod;
  baslik: string;
  aciklama: string;
};

export type Gun1KalemEtiket = {
  programId: string;
  label: string;
  /** Checklist’te opsiyonel (A-D3-E / B) */
  opsiyonel?: boolean;
  /** Eklenince ne kazanılır */
  fayda?: string;
};

/** Çoban dili — seçim ekranı (yem/beslenme yok) */
export const GUN1_SECENEKLER: Gun1Secenek[] = [
  {
    mod: 'sadece-tartim',
    baslik: 'Sadece tartım',
    aciklama: 'Bugün yalnız alım tartımı. Aşı/iğne sonra.',
  },
  {
    mod: 'tarti-parazit-karma',
    baslik: 'Tartım + iç-dış parazit + karma aşı',
    aciklama:
      'Tartı, İvermektin, Albendazol (paketteyse) ve karma aşı — aynı seans.',
  },
  {
    mod: 'hepsi',
    baslik: 'Hepsini birden',
    aciklama:
      'Minimum standart: tartı + İvermektin + Albendazol + karma + Selenyum-E. Yem ayrı.',
  },
  {
    mod: 'ozel',
    baslik: 'Kendim seçeyim',
    aciklama:
      'Listeden işaretle. A-D3-E / B yalnız zayıf-stres-iştah yoksa. Yem yok.',
  },
];

/** Kalem başına çoban dili fayda — “eklersen ne olur” */
export const GUN1_KALEM_FAYDA: Record<string, string> = {
  [TARTIM_GIRIS_PROGRAM_ID]:
    'Doza doğru kilo girer; tahmini ~20 kg yerine gerçek kg.',
  ivermektin: 'İç-dış parazit riski düşer; kilo kaybı ve kaşıntı azalır.',
  albendazol: 'İç parazit yükü azalır; yemden daha iyi yararlanır.',
  karma: 'Klostridiyal + pastörella koruması başlar (1. doz → 21. günde 2/2).',
  'selen-e': 'Beyaz kas riski azalır; kas ve kilo alımına destek.',
  ad3e: 'Zayıf / kapalı beside göz-kemik desteği (gerekliyse).',
  'b-kompleks': 'İştahsız veya stresli kuzuda toparlanma desteği (gerekliyse).',
};

const KALEM_LABEL: Record<string, string> = {
  [TARTIM_GIRIS_PROGRAM_ID]: 'Alım tartımı',
  ivermektin: 'İç-dış parazit (İvermektin)',
  albendazol: 'İç parazit hapı (Albendazol)',
  karma: 'Karma aşı',
  ad3e: 'A-D3-E (gerekliyse)',
  'b-kompleks': 'B kompleks (gerekliyse)',
  'selen-e': 'Selenyum-E',
};

function beslenmeMi(programId: string): boolean {
  return (GUN1_BESLENME_PROGRAM_IDS as readonly string[]).includes(programId);
}

function opsiyonelVitaminMi(programId: string): boolean {
  return (HIZLI_BESI_OPSIYONEL_VITAMIN as readonly string[]).includes(programId);
}

/** Gün 1 checklist — tartı + aşı/iğne + opsiyonel vitamin; yem yok */
export function gun1KalemEtiketleri(): Gun1KalemEtiket[] {
  return HIZLI_BESI_TAKVIM.filter((t) => t.gun === 1 && !beslenmeMi(t.programId)).map(
    (t) => ({
      programId: t.programId,
      label: KALEM_LABEL[t.programId] ?? t.programId,
      opsiyonel: opsiyonelVitaminMi(t.programId),
      fayda: GUN1_KALEM_FAYDA[t.programId],
    }),
  );
}

export function girisPaketindeAlbendazol(): boolean {
  return (HIZLI_BESI_GIRIS_ASI_PARAZIT as readonly string[]).includes('albendazol');
}

export function girisPaketindeSelen(): boolean {
  return (HIZLI_BESI_GIRIS_VITAMIN as readonly string[]).includes('selen-e');
}

export function kalemFayda(programId: string): string | null {
  return GUN1_KALEM_FAYDA[programId] ?? null;
}

export function kalemLabel(programId: string): string {
  return KALEM_LABEL[programId] ?? programId;
}

/** Kullanıcı özel standardı — null = bizim min. standart */
export async function kullaniciGirisStandartOku(): Promise<string[] | null> {
  try {
    const { kaliciGetItem } = await depo();
    const raw = await kaliciGetItem(STANDART_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { programIds?: string[] };
    if (!Array.isArray(p?.programIds) || p.programIds.length === 0) return null;
    const izin = new Set(gun1KalemEtiketleri().map((k) => k.programId));
    return p.programIds.filter((id) => izin.has(id) && !beslenmeMi(id));
  } catch {
    return null;
  }
}

export async function kullaniciGirisStandartKaydet(
  programIds: string[],
): Promise<string[]> {
  const { kaliciSetItem } = await depo();
  const izin = new Set(gun1KalemEtiketleri().map((k) => k.programId));
  const temiz = programIds.filter((id) => izin.has(id) && !beslenmeMi(id));
  await kaliciSetItem(STANDART_KEY, JSON.stringify({ programIds: temiz }));
  return temiz;
}

export async function kullaniciGirisStandartSil(): Promise<void> {
  const { kaliciSetItem } = await depo();
  await kaliciSetItem(STANDART_KEY, '');
}

/**
 * Etkin minimum standart — kullanıcı kaydı varsa o, yoksa bizim paket.
 * Sync yardımcı: override verilmezse varsayılan.
 */
export function etkinMinStandartIds(override?: string[] | null): string[] {
  if (override && override.length > 0) {
    const izin = new Set(gun1KalemEtiketleri().map((k) => k.programId));
    return override.filter((id) => izin.has(id) && !beslenmeMi(id));
  }
  return [...GUN1_MIN_STANDART_PROGRAM_IDS];
}

export async function etkinMinStandartIdsAsync(): Promise<string[]> {
  return etkinMinStandartIds(await kullaniciGirisStandartOku());
}

/** Seçimde eksik kalan min. standart kalemleri */
export function eksikMinStandart(
  secilen: string[],
  standart: string[] = [...GUN1_MIN_STANDART_PROGRAM_IDS],
): string[] {
  const set = new Set(secilen);
  return standart.filter((id) => !set.has(id));
}

/** Soft tavsiye metni — engellemez */
export function minStandartTavsiyeMesaji(eksikler: string[]): string | null {
  if (eksikler.length === 0) return null;
  const adlar = eksikler.map(kalemLabel).join(' · ');
  return `Bunları eklemeniz tavsiye edilir: ${adlar}. İsterseniz kendi yolunuzla devam edebilirsiniz.`;
}

/** Sonradan eklenince “ne kazanırsın” satırları */
export function minStandartFaydaSatirlari(programIds: string[]): string[] {
  return programIds
    .map((id) => {
      const f = kalemFayda(id);
      return f ? `${kalemLabel(id)}: ${f}` : null;
    })
    .filter((x): x is string => !!x);
}

/** Mod → programId seti (beslenme/yem asla eklenmez) */
export function gun1ProgramIdsForMod(
  mod: Gun1SecimMod,
  ozelIds?: string[],
  /** Kullanıcı standardı — hepsi için override */
  minStandartOverride?: string[] | null,
): string[] {
  if (mod === 'sadece-tartim') return [TARTIM_GIRIS_PROGRAM_ID];
  if (mod === 'tarti-parazit-karma') {
    const ids = [TARTIM_GIRIS_PROGRAM_ID, 'ivermektin', 'karma'];
    if (girisPaketindeAlbendazol()) ids.splice(2, 0, 'albendazol');
    return ids;
  }
  if (mod === 'hepsi') {
    return etkinMinStandartIds(minStandartOverride ?? null);
  }
  const izin = new Set(gun1KalemEtiketleri().map((k) => k.programId));
  return (ozelIds ?? []).filter((id) => izin.has(id));
}

export function bugunYerelTarih(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type DepoHarita = Record<string, Gun1SecimKayit>;

function depoAnahtar(tarih: string, padokAnahtar: string): string {
  return `${tarih}::${padokAnahtar}`;
}

async function okuHarita(): Promise<DepoHarita> {
  try {
    const { kaliciGetItem } = await depo();
    const raw = await kaliciGetItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as DepoHarita;
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

export async function gun1SecimOku(
  padokAnahtar: string = GUN1_SECIM_VARSAYILAN_PADOK,
  tarih: string = bugunYerelTarih(),
): Promise<Gun1SecimKayit | null> {
  const h = await okuHarita();
  return h[depoAnahtar(tarih, padokAnahtar)] ?? null;
}

export async function gun1SecimKaydet(input: {
  mod: Gun1SecimMod;
  programIds?: string[];
  padokAnahtar?: string;
  tarih?: string;
}): Promise<Gun1SecimKayit> {
  const padokAnahtar = input.padokAnahtar ?? GUN1_SECIM_VARSAYILAN_PADOK;
  const tarih = input.tarih ?? bugunYerelTarih();
  const override = await kullaniciGirisStandartOku();
  const programIds = gun1ProgramIdsForMod(input.mod, input.programIds, override);
  const kayit: Gun1SecimKayit = {
    tarih,
    padokAnahtar,
    mod: input.mod,
    programIds,
    kaydedildiAt: new Date().toISOString(),
  };
  const h = await okuHarita();
  h[depoAnahtar(tarih, padokAnahtar)] = kayit;
  const { kaliciSetItem } = await depo();
  await kaliciSetItem(KEY, JSON.stringify(h));
  return kayit;
}

export async function gun1SecimSil(
  padokAnahtar: string = GUN1_SECIM_VARSAYILAN_PADOK,
  tarih: string = bugunYerelTarih(),
): Promise<void> {
  const h = await okuHarita();
  delete h[depoAnahtar(tarih, padokAnahtar)];
  const { kaliciSetItem } = await depo();
  await kaliciSetItem(KEY, JSON.stringify(h));
}

export function gorevdenProgramId(gorevId: string): string | null {
  const m = gorevId.match(/^takviye-ozet-(?:asi|parazit|vitamin|tartim)-(.+)$/);
  return m?.[1] ?? null;
}

export function gun1GorevVarMi(gunGruplari: GorevGunGrup[]): boolean {
  return gunGruplari.some((g) => g.gun === 1 && g.gorevler.length > 0);
}

export function gunGruplariniSecimeGoreFiltrele(
  gunGruplari: GorevGunGrup[],
  secim: Gun1SecimKayit | null,
): GorevGunGrup[] {
  if (!secim || secim.programIds.length === 0) return gunGruplari;
  const izin = new Set(secim.programIds);
  return gunGruplari
    .map((gg) => {
      if (gg.gun !== 1) return gg;
      const gorevler = gg.gorevler.filter((g) => {
        const pid = gorevdenProgramId(g.id);
        if (!pid) return true;
        if (beslenmeMi(pid)) return false;
        return izin.has(pid);
      });
      return { ...gg, gorevler };
    })
    .filter((gg) => gg.gorevler.length > 0 || gg.gun !== 1);
}

export function secimModEtiket(mod: Gun1SecimMod): string {
  return GUN1_SECENEKLER.find((s) => s.mod === mod)?.baslik ?? mod;
}

export function gorevListesindeGun1(gorevler: Gorev[]): boolean {
  return gorevler.some((g) => g.planGun === 1);
}

/**
 * AI / elle “gerekli” — zayıf, stres, iştah yok işaretlerinde A-D3-E / B öner.
 * Engellemez; checklist’e soft ek önerisi.
 */
export function opsiyonelVitaminOner(
  baglam: { zayif?: boolean; stres?: boolean; istahYok?: boolean },
): string[] {
  const out: string[] = [];
  if (baglam.zayif || baglam.istahYok) out.push('ad3e');
  if (baglam.stres || baglam.istahYok) out.push('b-kompleks');
  return out.filter((id) =>
    (HIZLI_BESI_OPSIYONEL_VITAMIN as readonly string[]).includes(id),
  );
}
