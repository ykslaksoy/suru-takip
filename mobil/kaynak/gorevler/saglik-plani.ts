/**
 * Aşı ve İlaç — önerilen plan (SuperKuzu) + çiftçinin kendi planı.
 *
 * Önerilen plan herkese açık DEĞİL: `onerilenPlanAcikMi()` varsayılan olarak kapalı döner.
 * Kapalıyken kendi plan BOŞ başlar (önerilen id’ler tohumlamada kullanılmaz).
 * İleride yönetici paneli (uzak bayrak) bu kontrolü besleyecek.
 */
import { useCallback, useEffect, useState } from 'react';
import { ASI_PROGRAMI, asiKategori } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI } from '@/kaynak/akilli-veteriner/vitamin-programi';
import { kaliciGetItem, kaliciSetItem, kaliciRemoveItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { getAktifModId } from '@/sabitler/Modlar';
import {
  getOnerilenPlanByMod,
  onerilenPlanAcikMi as onerilenPlanAcikMiMod,
} from './saglik-plani-mod';
import type { PlanZaman } from './plan-takvim';

export type SaglikPlaniBolum = 'asi' | 'parazit' | 'vitamin';
export type SaglikPlani = Record<SaglikPlaniBolum, string[]>;
export type SaglikPlaniModu = 'onerilen' | 'kendi';

export const SAGLIK_PLANI_BOLUMLER: SaglikPlaniBolum[] = ['asi', 'parazit', 'vitamin'];

const KEY_KENDI = 'sy_saglik_plani_kendi_v1';
const KEY_MOD = 'sy_saglik_plani_mod_v1';
const KEY_ZAMAN = 'sy_saglik_plani_zaman_v1';

/** Kalem başına zamanlama (gün sonra / tekrar) — boşsa varsayılan */
export async function getPlanZaman(): Promise<PlanZaman> {
  const raw = await kaliciGetItem(KEY_ZAMAN);
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as PlanZaman;
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

export async function savePlanZaman(z: PlanZaman): Promise<void> {
  await kaliciSetItem(KEY_ZAMAN, JSON.stringify(z));
}

/** Takvimde kullanılacak etkin plan: önerilen yalnız erişim açık + mod önerilen iken. */
export async function getEtkinPlan(): Promise<SaglikPlani> {
  const [acik, mod] = await Promise.all([onerilenPlanAcikMi(), getPlanModu()]);
  if (acik && mod === 'onerilen') {
    const o = await getOnerilenPlan();
    if (o) return o;
  }
  return getKendiPlan();
}

/**
 * Önerilen plana erişim — Mod 1 kapalı (hızlı besi); hazır mod 2–6 açık.
 * TODO(yönetici paneli): uzak bayraktan (kullanıcı / işletme bazlı) oku.
 */
export async function onerilenPlanAcikMi(): Promise<boolean> {
  return onerilenPlanAcikMiMod();
}

/** Önerilen plan — erişim yoksa null (id’ler dışarı verilmez). */
export async function getOnerilenPlan(): Promise<SaglikPlani | null> {
  if (!(await onerilenPlanAcikMi())) return null;
  const modId = await getAktifModId();
  const p = await getOnerilenPlanByMod(modId);
  return p ? kopya(p) : null;
}

function kopya(p: SaglikPlani): SaglikPlani {
  return { asi: [...p.asi], parazit: [...p.parazit], vitamin: [...p.vitamin] };
}

export function bosPlan(): SaglikPlani {
  return { asi: [], parazit: [], vitamin: [] };
}

/** Bölümün tam katalogundaki geçerli id’ler (sıralı). */
export function bolumKatalogIdleri(bolum: SaglikPlaniBolum): string[] {
  if (bolum === 'vitamin') return VITAMIN_PROGRAMI.map((v) => v.id);
  return ASI_PROGRAMI.filter((p) => asiKategori(p) === bolum).map((p) => p.id);
}

function temizle(p: Partial<SaglikPlani> | null | undefined): SaglikPlani {
  const out = bosPlan();
  for (const b of SAGLIK_PLANI_BOLUMLER) {
    const gecerli = new Set(bolumKatalogIdleri(b));
    const ids = Array.isArray(p?.[b]) ? (p![b] as unknown[]) : [];
    out[b] = [...new Set(ids.filter((id): id is string => typeof id === 'string' && gecerli.has(id)))];
  }
  return out;
}

/** Kendi planı — kayıt yoksa: erişim açıksa önerilenden, kapalıysa boş başlar. */
export async function getKendiPlan(): Promise<SaglikPlani> {
  const raw = await kaliciGetItem(KEY_KENDI);
  if (raw) {
    try {
      return temizle(JSON.parse(raw) as Partial<SaglikPlani>);
    } catch {
      /* bozuk kayıt → tohum */
    }
  }
  return (await getOnerilenPlan()) ?? bosPlan();
}

export async function saveKendiPlan(p: SaglikPlani): Promise<SaglikPlani> {
  const t = temizle(p);
  await kaliciSetItem(KEY_KENDI, JSON.stringify(t));
  return t;
}

/** Kendi planı sıfırla — erişim açıksa önerilene, kapalıysa boşa döner. */
export async function kendiPlanSifirla(): Promise<SaglikPlani> {
  await kaliciRemoveItem(KEY_KENDI);
  return (await getOnerilenPlan()) ?? bosPlan();
}

export async function getPlanModu(): Promise<SaglikPlaniModu> {
  if (!(await onerilenPlanAcikMi())) return 'kendi';
  const raw = await kaliciGetItem(KEY_MOD);
  return raw === 'kendi' ? 'kendi' : 'onerilen';
}

export async function savePlanModu(m: SaglikPlaniModu): Promise<void> {
  await kaliciSetItem(KEY_MOD, m);
}

/** Ekran hook’u — erişim, mod, önerilen ve kendi plan. */
export function useSaglikPlani() {
  const [hazir, setHazir] = useState(false);
  const [onerilenAcik, setOnerilenAcik] = useState(false);
  const [onerilen, setOnerilen] = useState<SaglikPlani | null>(null);
  const [kendi, setKendi] = useState<SaglikPlani>(bosPlan());
  const [mod, setModState] = useState<SaglikPlaniModu>('kendi');
  const [zaman, setZamanState] = useState<PlanZaman>({});

  useEffect(() => {
    let iptal = false;
    (async () => {
      const [acik, o, k, m, z] = await Promise.all([
        onerilenPlanAcikMi(),
        getOnerilenPlan(),
        getKendiPlan(),
        getPlanModu(),
        getPlanZaman(),
      ]);
      setZamanState(z);
      if (iptal) return;
      setOnerilenAcik(acik);
      setOnerilen(o);
      setKendi(k);
      setModState(acik ? m : 'kendi');
      setHazir(true);
    })().catch(() => setHazir(true));
    return () => {
      iptal = true;
    };
  }, []);

  const setMod = useCallback(
    (m: SaglikPlaniModu) => {
      const yeni = onerilenAcik ? m : 'kendi';
      setModState(yeni);
      savePlanModu(yeni).catch(() => {});
    },
    [onerilenAcik],
  );

  const kendiGuncelle = useCallback((p: SaglikPlani) => {
    setKendi(p);
    saveKendiPlan(p).catch(() => {});
  }, []);

  const ekle = useCallback(
    (b: SaglikPlaniBolum, id: string) => {
      if (kendi[b].includes(id)) return;
      kendiGuncelle({ ...kendi, [b]: [...kendi[b], id] });
    },
    [kendi, kendiGuncelle],
  );

  const cikar = useCallback(
    (b: SaglikPlaniBolum, id: string) => {
      kendiGuncelle({ ...kendi, [b]: kendi[b].filter((x) => x !== id) });
    },
    [kendi, kendiGuncelle],
  );

  const sifirla = useCallback(async () => {
    setKendi(await kendiPlanSifirla());
  }, []);

  const setZaman = useCallback((id: string, z: { gunSonra: number; tekrarGun: number | null }) => {
    setZamanState((onceki) => {
      const yeni = { ...onceki, [id]: z };
      savePlanZaman(yeni).catch(() => {});
      return yeni;
    });
  }, []);

  return { hazir, onerilenAcik, onerilen, kendi, mod, setMod, ekle, cikar, sifirla, zaman, setZaman };
}
