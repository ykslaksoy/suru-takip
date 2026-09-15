/**
 * Gün 1 oturum seçimi — çoban önce ne yapacağını seçer,
 * sonra yalnızca seçilen kalemler adım adım gösterilir.
 * Tartı önerilen ilk adım; aynı gün / aynı seans aşı-iğne ile birlikte olabilir.
 * Beslenme / yem bu seçicide YOK — yem ayrı listede / ayrı akışta.
 */
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import {
  HIZLI_BESI_GIRIS_ASI_PARAZIT,
  HIZLI_BESI_GIRIS_VITAMIN,
  HIZLI_BESI_TAKVIM,
} from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import { TARTIM_GIRIS_PROGRAM_ID } from '@/kaynak/akilli-veteriner/takviye-tipler';
import type { Gorev } from '@/kaynak/gorevler/siralama';
import type { GorevGunGrup } from '@/kaynak/gorevler/kategoriler';

const KEY = 'sy_gun1_oturum_secim_v1';

/** Varsayılan padok/parti anahtarı — açık alım sürüsü */
export const GUN1_SECIM_VARSAYILAN_PADOK = 'acik-alim';

/**
 * Beslenme / yem kalemleri — gün 1 seçicide ve rehber paketlerinde yok.
 * Probiyotik + premiks rasyon tarafında; ayrı yem listesinde kalır.
 */
export const GUN1_BESLENME_PROGRAM_IDS = ['probiyotik', 'premiks'] as const;

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
    aciklama: 'Tartı + gün 1 aşı/iğne kalemleri. Yem ayrı listede.',
  },
  {
    mod: 'ozel',
    baslik: 'Kendim seçeyim',
    aciklama: 'Listeden bugün yapacak tartı / aşı / iğne kalemlerini işaretle.',
  },
];

function beslenmeMi(programId: string): boolean {
  return (GUN1_BESLENME_PROGRAM_IDS as readonly string[]).includes(programId);
}

/** Gün 1 checklist — tartı + aşı/iğne; yem/beslenme yok */
export function gun1KalemEtiketleri(): Gun1KalemEtiket[] {
  const labels: Record<string, string> = {
    [TARTIM_GIRIS_PROGRAM_ID]: 'Alım tartımı',
    ivermektin: 'İç-dış parazit (İvermektin)',
    albendazol: 'İç parazit hapı (Albendazol)',
    karma: 'Karma aşı',
    ad3e: 'A-D3-E',
    'b-kompleks': 'B kompleks',
    'selen-e': 'Selenyum-E',
  };
  return HIZLI_BESI_TAKVIM.filter((t) => t.gun === 1 && !beslenmeMi(t.programId)).map(
    (t) => ({
      programId: t.programId,
      label: labels[t.programId] ?? t.programId,
    }),
  );
}

export function girisPaketindeAlbendazol(): boolean {
  return (HIZLI_BESI_GIRIS_ASI_PARAZIT as readonly string[]).includes('albendazol');
}

export function girisPaketindeSelen(): boolean {
  return (HIZLI_BESI_GIRIS_VITAMIN as readonly string[]).includes('selen-e');
}

/** Mod → programId seti (beslenme/yem asla eklenmez) */
export function gun1ProgramIdsForMod(
  mod: Gun1SecimMod,
  ozelIds?: string[],
): string[] {
  if (mod === 'sadece-tartim') return [TARTIM_GIRIS_PROGRAM_ID];
  if (mod === 'tarti-parazit-karma') {
    const ids = [TARTIM_GIRIS_PROGRAM_ID, 'ivermektin', 'karma'];
    if (girisPaketindeAlbendazol()) ids.splice(2, 0, 'albendazol');
    return ids;
  }
  if (mod === 'hepsi') {
    return HIZLI_BESI_TAKVIM.filter((t) => t.gun === 1 && !beslenmeMi(t.programId)).map(
      (t) => t.programId,
    );
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
  const programIds = gun1ProgramIdsForMod(input.mod, input.programIds);
  const kayit: Gun1SecimKayit = {
    tarih,
    padokAnahtar,
    mod: input.mod,
    programIds,
    kaydedildiAt: new Date().toISOString(),
  };
  const h = await okuHarita();
  h[depoAnahtar(tarih, padokAnahtar)] = kayit;
  await kaliciSetItem(KEY, JSON.stringify(h));
  return kayit;
}

export async function gun1SecimSil(
  padokAnahtar: string = GUN1_SECIM_VARSAYILAN_PADOK,
  tarih: string = bugunYerelTarih(),
): Promise<void> {
  const h = await okuHarita();
  delete h[depoAnahtar(tarih, padokAnahtar)];
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
