/**
 * Yem / besleme görevleri — aşı listesinden ayrı.
 * Satış ufkuna kadar milestone’lar (günlük 90 satır dökümü değil).
 */

import { hayvanAltEtiket, hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import {
  BESI_PLAN_TAVAN_GUN,
  HIZLI_BESI_YEM_TAKVIM,
  asiGorunumBaslik,
  gunEtiket,
  type YemTakvimSatir,
} from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import { getAktifModId } from '@/sabitler/Modlar';
import { gozlemPadokMu } from '@/kaynak/suru/padok';
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import type { Gorev } from '@/kaynak/gorevler/siralama';
import { bugunTarih } from '@/kaynak/gorevler/siralama';

const YEM_PLAN_KEY = 'sy_yem_plan_v1';
/** Eski sürü yem kapanışı migration sürümü */
export const YEM_ESKI_KAPAT_SURUM = 'v1-2026-09-15';

export type YemPlanDurum = {
  animalId: string;
  yemId: string;
  yapildi: boolean;
  yapildiAt?: string;
  planlananAt: string;
};

export type YemPlanDepo = {
  surum: string;
  durumlar: YemPlanDurum[];
  /** Eski sürü kapatma işlendi mi */
  eskiKapatSurum?: string;
};

export type YemGorevHayvan = {
  animalId: string;
  etiket: string;
  altEtiket: string;
  paddock: string;
  planlananAt: string;
  durum: 'yapilacak' | 'planli' | 'yapildi';
};

export type YemGorevDetay = {
  yemId: string;
  koruma: string;
  urun: string;
  gun: number;
  gunBaslik: string;
  hayvanSayisi: number;
  hayvanlar: YemGorevHayvan[];
  planlananAt?: string;
};

function isoGunSonra(gun: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + gun);
  return d.toISOString().slice(0, 10);
}

async function oku(): Promise<YemPlanDepo> {
  const raw = await kaliciGetItem(YEM_PLAN_KEY);
  if (!raw) return { surum: 'v1', durumlar: [] };
  try {
    return JSON.parse(raw) as YemPlanDepo;
  } catch {
    return { surum: 'v1', durumlar: [] };
  }
}

async function yaz(d: YemPlanDepo): Promise<void> {
  await kaliciSetItem(YEM_PLAN_KEY, JSON.stringify(d));
}

function satirBul(yemId: string): YemTakvimSatir | undefined {
  return HIZLI_BESI_YEM_TAKVIM.find((y) => y.id === yemId);
}

/** Yeni kabul edilen kuzulara satış ufkuna kadar yem planı yaz */
export async function yemPlaniHayvanlaraEkle(
  hayvanIds: string[],
  opts?: { girisTarih?: Date },
): Promise<number> {
  if (hayvanIds.length === 0) return 0;
  const giris = opts?.girisTarih ?? new Date();
  const depo = await oku();
  const mevcut = new Set(depo.durumlar.map((d) => `${d.animalId}|${d.yemId}`));
  let n = 0;
  for (const animalId of hayvanIds) {
    for (const y of HIZLI_BESI_YEM_TAKVIM) {
      if (y.gun > BESI_PLAN_TAVAN_GUN) continue;
      const key = `${animalId}|${y.id}`;
      if (mevcut.has(key)) continue;
      depo.durumlar.push({
        animalId,
        yemId: y.id,
        yapildi: false,
        planlananAt: isoGunSonra(y.gun, giris),
      });
      mevcut.add(key);
      n += 1;
    }
  }
  await yaz(depo);
  return n;
}

/** Eski sürü: tüm yem uygulamalarını bugün ayrı ayrı tamamla */
export async function yemPlaniEskiSuruyuKapat(hayvanIds: string[]): Promise<number> {
  const bugun = new Date().toISOString();
  const bugunGun = bugun.slice(0, 10);
  const depo = await oku();
  const set = new Set(hayvanIds);
  let n = 0;
  for (const d of depo.durumlar) {
    if (!set.has(d.animalId) || d.yapildi) continue;
    d.yapildi = true;
    d.yapildiAt = bugun;
    d.planlananAt = d.planlananAt || bugunGun;
    n += 1;
  }
  // Eksik kalemleri de bugün tamamlanmış olarak ekle (geçmiş)
  for (const animalId of hayvanIds) {
    for (const y of HIZLI_BESI_YEM_TAKVIM) {
      const varMi = depo.durumlar.some((d) => d.animalId === animalId && d.yemId === y.id);
      if (varMi) continue;
      depo.durumlar.push({
        animalId,
        yemId: y.id,
        yapildi: true,
        yapildiAt: bugun,
        planlananAt: bugunGun,
      });
      n += 1;
    }
  }
  depo.eskiKapatSurum = YEM_ESKI_KAPAT_SURUM;
  await yaz(depo);
  return n;
}

export async function yemTopluGorevleri(): Promise<Gorev[]> {
  const depo = await oku();
  const animals = await getAnimals();
  const byId = new Map(animals.map((a) => [a.id, a]));
  const bugun = bugunTarih();

  type Ozet = {
    yem: YemTakvimSatir;
    hayvanlar: Map<string, YemGorevHayvan>;
    enYakin?: string;
  };
  const map = new Map<string, Ozet>();

  for (const d of depo.durumlar) {
    if (d.yapildi) continue;
    const a = byId.get(d.animalId);
    if (!a || a.status === 'sold' || a.status === 'dead') continue;
    const y = satirBul(d.yemId);
    if (!y) continue;
    let o = map.get(y.id);
    if (!o) {
      o = { yem: y, hayvanlar: new Map() };
      map.set(y.id, o);
    }
    o.hayvanlar.set(d.animalId, {
      animalId: d.animalId,
      etiket: hayvanAnaEtiket(a),
      altEtiket: hayvanAltEtiket(a),
      paddock: a.paddock,
      planlananAt: d.planlananAt,
      durum: d.planlananAt > bugun ? 'planli' : 'yapilacak',
    });
    if (!o.enYakin || d.planlananAt < o.enYakin) o.enYakin = d.planlananAt;
  }

  const out: Gorev[] = [];
  for (const o of map.values()) {
    const n = o.hayvanlar.size;
    if (n === 0) continue;
    const tarih = o.enYakin ?? bugun;
    const kalan = Math.ceil(
      (new Date(tarih + 'T12:00:00').getTime() - Date.now()) / 86400000,
    );
    out.push({
      id: `yem-ozet-${o.yem.id}`,
      seviye: kalan <= 0 ? 'uyari' : kalan <= 7 ? 'sira' : 'plan',
      kaynak: 'yem',
      baslik: o.yem.koruma,
      baslikIgne: o.yem.urun,
      baslikMl: gunEtiket(o.yem.gun),
      aciklama: `${n} kuzu`,
      href: `/gorevler/yem/${o.yem.id}`,
      cta: 'Kuzuları gör',
      tarih,
      planGun: o.yem.gun,
    });
  }
  return out;
}

export async function getYemGorevDetay(yemId: string): Promise<YemGorevDetay | null> {
  const y = satirBul(yemId);
  if (!y) return null;
  const depo = await oku();
  const animals = await getAnimals();
  const byId = new Map(animals.map((a) => [a.id, a]));
  const bugun = bugunTarih();
  const hayvanlar: YemGorevHayvan[] = [];

  for (const d of depo.durumlar) {
    if (d.yemId !== yemId || d.yapildi) continue;
    const a = byId.get(d.animalId);
    if (!a || a.status === 'sold' || a.status === 'dead') continue;
    hayvanlar.push({
      animalId: d.animalId,
      etiket: hayvanAnaEtiket(a),
      altEtiket: hayvanAltEtiket(a),
      paddock: a.paddock,
      planlananAt: d.planlananAt,
      durum: d.planlananAt > bugun ? 'planli' : 'yapilacak',
    });
  }
  if (hayvanlar.length === 0) return null;
  hayvanlar.sort((a, b) => {
    const pa = a.paddock.localeCompare(b.paddock, 'tr');
    if (pa !== 0) return pa;
    return a.etiket.localeCompare(b.etiket, 'tr', { numeric: true });
  });
  const tarihler = hayvanlar.map((h) => h.planlananAt).sort();
  return {
    yemId,
    koruma: y.koruma,
    urun: y.urun,
    gun: y.gun,
    gunBaslik: gunEtiket(y.gun),
    hayvanSayisi: hayvanlar.length,
    hayvanlar,
    planlananAt: tarihler[0],
  };
}

/** Aktif moddaki açık yem planı olan hayvan sayısı (özet) */
export async function yemAcikHayvanSayisi(): Promise<number> {
  const depo = await oku();
  const animals = await getAnimals();
  const aktif = new Set(
    animals.filter((a) => a.status !== 'sold' && a.status !== 'dead').map((a) => a.id),
  );
  const ids = new Set<string>();
  for (const d of depo.durumlar) {
    if (!d.yapildi && aktif.has(d.animalId)) ids.add(d.animalId);
  }
  return ids.size;
}

export function yemBaslikMetin(koruma: string, urun: string): string {
  return asiGorunumBaslik(koruma, urun);
}

/** Demo: gözlem padok hayvanlarına da plan yaz (seed sonrası) */
export async function yemPlaniModHayvanlarinaKur(opts?: {
  sadeceGozlemVeA?: boolean;
}): Promise<number> {
  const modId = await getAktifModId();
  const animals = (await getAnimals()).filter((a) => {
    if (a.status === 'sold' || a.status === 'dead') return false;
    if ((a.modId ?? null) !== modId && a.modId != null) return false;
    if (opts?.sadeceGozlemVeA) {
      return gozlemPadokMu(a.paddock) || a.paddock === 'Padok A';
    }
    return true;
  });
  return yemPlaniHayvanlaraEkle(animals.map((a) => a.id));
}
