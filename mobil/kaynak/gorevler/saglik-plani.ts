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

export type SaglikPlaniBolum = 'asi' | 'parazit' | 'vitamin';
export type SaglikPlani = Record<SaglikPlaniBolum, string[]>;
export type SaglikPlaniModu = 'onerilen' | 'kendi';

export const SAGLIK_PLANI_BOLUMLER: SaglikPlaniBolum[] = ['asi', 'parazit', 'vitamin'];

const KEY_KENDI = 'sy_saglik_plani_kendi_v1';
const KEY_MOD = 'sy_saglik_plani_mod_v1';

/** Mod 1 (Kuzu alarak besi) önerilen plan — yalnız erişim açıkken kullanılır. */
const ONERILEN_PLAN: SaglikPlani = {
  asi: ['karma', 'cicek', 'ppr', 'pasteurella', 'sarbon', 'brusella', 'sap'],
  parazit: ['ivermektin', 'albendazol'],
  vitamin: ['selen-e'],
};

/**
 * Önerilen plana erişim var mı? Varsayılan: KAPALI.
 * TODO(yönetici paneli): uzak bayraktan (kullanıcı / işletme bazlı) oku.
 */
export async function onerilenPlanAcikMi(): Promise<boolean> {
  return false;
}

/** Önerilen plan — erişim yoksa null (id’ler dışarı verilmez). */
export async function getOnerilenPlan(): Promise<SaglikPlani | null> {
  if (!(await onerilenPlanAcikMi())) return null;
  return kopya(ONERILEN_PLAN);
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

  useEffect(() => {
    let iptal = false;
    (async () => {
      const [acik, o, k, m] = await Promise.all([
        onerilenPlanAcikMi(),
        getOnerilenPlan(),
        getKendiPlan(),
        getPlanModu(),
      ]);
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

  return { hazir, onerilenAcik, onerilen, kendi, mod, setMod, ekle, cikar, sifirla };
}
