/**
 * Toplu görevler: aşı / parazit / vitamin / tartım.
 * Listede: tarih · ne · N kuzu — detayda kuzular.
 */

import { ASI_PROGRAMI, asiDozEtiketi, asiGorevOncelikliMi, asiKategori, hesaplaAsiStokDurumu } from '@/kaynak/cekirdek/asi-programi';
import { hayvanAltEtiket, hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { getAnimals, getAllHealthRecordsForAsi, getStockItems } from '@/kaynak/cekirdek/veritabani';
import { asiBuHaftaListesi } from '@/kaynak/saglik/asi-hatirlatma';
import { getAktifModId } from '@/sabitler/Modlar';
import {
  aktifPlanOku,
  TARTIM_15_PROGRAM_ID,
  type HayvanKalemDurum,
  type TakviyeTip,
} from '@/kaynak/akilli-veteriner/mod-takviye';
import {
  VITAMIN_PROGRAMI,
  vitaminDozEtiketi,
  vitaminGorevOncelikliMi,
} from '@/kaynak/akilli-veteriner/vitamin-programi';
import {
  ENTEROTOKSEMI_RAPEL_PROGRAM_ID,
  takviyeGorevOncelikSira,
} from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import type { Gorev, GorevKaynak, GorevSeviye } from '@/kaynak/gorevler/liste';

export type TakviyeGorevHayvan = {
  animalId: string;
  etiket: string;
  altEtiket: string;
  paddock: string;
  durum: 'yapilacak' | 'yaklasiyor' | 'planli';
  kalanGun: number | null;
  planlananAt?: string;
};

export type TakviyeGorevDetay = {
  programId: string;
  koruma: string;
  asiAdi: string;
  mlEtiket: string;
  tip: TakviyeTip;
  hayvanSayisi: number;
  hayvanlar: TakviyeGorevHayvan[];
  planlananAt?: string;
};

/** @deprecated — AsiGorev* adları geriye uyum */
export type AsiGorevHayvan = TakviyeGorevHayvan;
export type AsiGorevDetay = TakviyeGorevDetay;

type ProgramOzet = {
  programId: string;
  koruma: string;
  asiAdi: string;
  mlEtiket: string;
  tip: TakviyeTip;
  hayvanlar: Map<string, TakviyeGorevHayvan>;
  enYakinTarih?: string;
};

/** takviye-ozet id’sinden öncelik sırası (tarih eşitse) */
export function gorevTakviyeOncelikSira(id: string): number {
  const m = id.match(/^takviye-ozet-(asi|parazit|vitamin|tartim)-(.+)$/);
  if (!m) return 50;
  return takviyeGorevOncelikSira(m[1] as TakviyeTip, m[2]);
}

function kalanGunTarih(tarih: string): number {
  return Math.ceil((new Date(tarih).getTime() - Date.now()) / 86400000);
}

function takviyeGorevOncelikliMi(programId: string, tip: TakviyeTip): boolean {
  if (tip === 'vitamin') return vitaminGorevOncelikliMi(programId);
  if (tip === 'asi' || tip === 'parazit') return asiGorevOncelikliMi(programId);
  return true;
}

function seviyeBelirle(
  kalan: number | null,
  planliMi: boolean,
  programId?: string,
  tip?: TakviyeTip,
): GorevSeviye {
  // Tartım: sağlık işleri bitene kadar rozette öne çıkmasın
  if (tip === 'tartim') return 'plan';
  if (programId && tip && !takviyeGorevOncelikliMi(programId, tip)) return 'plan';
  if (planliMi && kalan != null && kalan > 7) return 'plan';
  if (kalan == null || kalan <= 0) return 'uyari';
  if (kalan <= 7) return 'sira';
  return 'plan';
}

function hesaplaPlanTarihi(kalan: number | null, mevcut?: string): string {
  if (mevcut) return mevcut;
  const bugun = new Date();
  if (kalan == null || kalan <= 0) return bugun.toISOString().slice(0, 10);
  bugun.setDate(bugun.getDate() + kalan);
  return bugun.toISOString().slice(0, 10);
}

function asiMeta(programId: string): Omit<ProgramOzet, 'hayvanlar' | 'enYakinTarih'> | null {
  if (programId === ENTEROTOKSEMI_RAPEL_PROGRAM_ID) {
    const p = ASI_PROGRAMI.find((x) => x.id === 'enterotoksemi');
    if (!p) return null;
    return {
      programId,
      koruma: 'Çelertme pekiştirme',
      asiAdi: 'Enterotoksemi 2. doz',
      mlEtiket: asiDozEtiketi(p),
      tip: 'asi',
    };
  }
  const p = ASI_PROGRAMI.find((x) => x.id === programId);
  if (!p) return null;
  return {
    programId,
    koruma: p.koruma,
    asiAdi: p.ad,
    mlEtiket: asiDozEtiketi(p),
    tip: asiKategori(p) === 'parazit' ? 'parazit' : 'asi',
  };
}

function vitaminMeta(programId: string): Omit<ProgramOzet, 'hayvanlar' | 'enYakinTarih'> | null {
  const v = VITAMIN_PROGRAMI.find((x) => x.id === programId);
  if (!v) return null;
  return {
    programId,
    koruma: v.detay,
    asiAdi: v.ad,
    mlEtiket: vitaminDozEtiketi(v),
    tip: 'vitamin',
  };
}

function kaynakIcin(tip: TakviyeTip): GorevKaynak {
  if (tip === 'tartim') return 'tartim';
  if (tip === 'vitamin') return 'saglik';
  return 'asi';
}

function ozettenGorev(o: ProgramOzet): Gorev | null {
  if (o.hayvanlar.size === 0) return null;
  const hayvanlar = [...o.hayvanlar.values()];
  const planli = hayvanlar.every((h) => h.durum === 'planli' && h.planlananAt);
  const tarihler = hayvanlar
    .map((h) => h.planlananAt)
    .filter((t): t is string => !!t)
    .sort();
  const hamTarih = tarihler[0] ?? o.enYakinTarih;
  const kalan =
    hamTarih != null
      ? kalanGunTarih(hamTarih)
      : hayvanlar.reduce<number | null>((min, h) => {
          if (h.kalanGun == null) return min;
          if (min == null) return h.kalanGun;
          return Math.min(min, h.kalanGun);
        }, null);
  const enYakinTarih = hesaplaPlanTarihi(kalan, hamTarih);
  const n = hayvanlar.length;
  const baslik = o.tip === 'tartim' ? o.koruma : o.koruma;

  return {
    id: `takviye-ozet-${o.tip}-${o.programId}`,
    seviye: seviyeBelirle(kalan, !!planli, o.programId, o.tip),
    kaynak: kaynakIcin(o.tip),
    baslik,
    baslikIgne: o.tip === 'tartim' ? undefined : o.asiAdi,
    baslikMl: o.tip === 'tartim' ? undefined : o.mlEtiket,
    aciklama: `${n} kuzu`,
    href: `/gorevler/asi/${o.programId}`,
    cta: 'Kuzuları gör',
    tarih: enYakinTarih,
  };
}

function hayvanEkle(
  o: ProgramOzet,
  d: {
    animalId: string;
    etiket: string;
    altEtiket: string;
    paddock: string;
    planlananAt?: string;
    kalanGun: number | null;
    durum: TakviyeGorevHayvan['durum'];
  },
) {
  o.hayvanlar.set(d.animalId, {
    animalId: d.animalId,
    etiket: d.etiket,
    altEtiket: d.altEtiket,
    paddock: d.paddock,
    durum: d.durum,
    kalanGun: d.kalanGun,
    planlananAt: d.planlananAt,
  });
  if (d.planlananAt && (!o.enYakinTarih || d.planlananAt < o.enYakinTarih)) {
    o.enYakinTarih = d.planlananAt;
  }
}

/** Tüm bekleyen takviye kalemleri (aşı, parazit, vitamin, tartım). */
export async function takviyeGorevProgramHaritasi(): Promise<Map<string, ProgramOzet>> {
  const modId = await getAktifModId();
  const plan = await aktifPlanOku(modId);
  const animals = await getAnimals();
  const byId = new Map(animals.map((a) => [a.id, a]));
  const health = await getAllHealthRecordsForAsi();
  const stock = await getStockItems();
  const asiDurum = hesaplaAsiStokDurumu(animals, health, stock);

  const map = new Map<string, ProgramOzet>();

  const ensure = (
    programId: string,
    tip: TakviyeTip,
    meta?: { koruma: string; asiAdi: string; mlEtiket: string },
  ): ProgramOzet | null => {
    let o = map.get(programId);
    if (o) return o;
    if (meta) {
      o = { programId, ...meta, tip, hayvanlar: new Map() };
      map.set(programId, o);
      return o;
    }
    if (tip === 'vitamin') {
      const m = vitaminMeta(programId);
      if (!m) return null;
      o = { ...m, hayvanlar: new Map() };
      map.set(programId, o);
      return o;
    }
    if (tip === 'tartim') {
      o = {
        programId,
        koruma: '15 günde bir tartım',
        asiAdi: 'Kontrol tartımı',
        mlEtiket: '15 gün',
        tip: 'tartim',
        hayvanlar: new Map(),
      };
      map.set(programId, o);
      return o;
    }
    const m = asiMeta(programId);
    if (!m) return null;
    o = { ...m, hayvanlar: new Map() };
    map.set(programId, o);
    return o;
  };

  const planDurumEkle = (d: HayvanKalemDurum, kalem: { ad: string; detay: string; mlEtiket: string }) => {
    if (d.yapildi) return;
    const a = byId.get(d.animalId);
    if (!a || a.status === 'sold' || a.status === 'dead') return;

    const o = ensure(d.programId, d.tip, {
      koruma: kalem.ad,
      asiAdi: kalem.detay,
      mlEtiket: kalem.mlEtiket,
    });
    if (!o) return;

    const planTarih = d.planlananAt?.slice(0, 10);
    const kalan = planTarih ? kalanGunTarih(planTarih) : null;
    hayvanEkle(o, {
      animalId: d.animalId,
      etiket: hayvanAnaEtiket(a),
      altEtiket: hayvanAltEtiket(a),
      paddock: a.paddock,
      planlananAt: planTarih,
      kalanGun: kalan,
      durum: planTarih && kalan != null && kalan > 0 ? 'planli' : 'yapilacak',
    });
  };

  if (plan) {
    for (const k of plan.kalemler) {
      for (const d of plan.durumlar) {
        if (d.tip !== k.tip || d.programId !== k.programId) continue;
        planDurumEkle(d, k);
      }
    }
  }

  // Takvim aşıları — planda olmayan / farklı hayvanlar
  const modPlanAsiIds = new Set(
    plan?.kalemler.filter((k) => k.tip === 'asi' || k.tip === 'parazit').map((k) => k.programId) ?? [],
  );
  for (const s of asiBuHaftaListesi(asiDurum)) {
    if (modPlanAsiIds.has(s.programId) && map.get(s.programId)?.hayvanlar.has(s.animalId)) continue;
    const a = byId.get(s.animalId);
    if (!a) continue;
    const d = asiDurum.find((x) => x.programId === s.programId);
    const o = ensure(
      s.programId,
      asiMeta(s.programId)?.tip ?? 'asi',
      d
        ? { koruma: d.koruma, asiAdi: d.asiAdi, mlEtiket: d.mlEtiket }
        : undefined,
    );
    if (!o || o.hayvanlar.has(s.animalId)) continue;
    hayvanEkle(o, {
      animalId: s.animalId,
      etiket: hayvanAnaEtiket(a),
      altEtiket: hayvanAltEtiket(a),
      paddock: a.paddock,
      kalanGun: s.kalanGun,
      durum: s.durum,
    });
  }

  // Tartım id sabit
  if (!map.has(TARTIM_15_PROGRAM_ID) && plan) {
    // plan'da yoksa ekleme
  }

  return map;
}

/** @deprecated — eski ad */
export const asiGorevProgramHaritasi = takviyeGorevProgramHaritasi;

export async function takviyeTopluGorevleri(): Promise<Gorev[]> {
  const map = await takviyeGorevProgramHaritasi();
  const out: Gorev[] = [];
  for (const o of map.values()) {
    const g = ozettenGorev(o);
    if (g) out.push(g);
  }
  return out;
}

/** @deprecated */
export async function asiTopluGorevleri(): Promise<Gorev[]> {
  return (await takviyeTopluGorevleri()).filter((g) => g.kaynak === 'asi');
}

export async function getTakviyeGorevDetay(programId: string): Promise<TakviyeGorevDetay | null> {
  const map = await takviyeGorevProgramHaritasi();
  const o = map.get(programId);
  if (!o || o.hayvanlar.size === 0) return null;

  const hayvanlar = [...o.hayvanlar.values()].sort((a, b) => {
    const pa = a.paddock.localeCompare(b.paddock, 'tr');
    if (pa !== 0) return pa;
    return a.etiket.localeCompare(b.etiket, 'tr', { numeric: true });
  });
  const tarihler = hayvanlar.map((h) => h.planlananAt).filter((t): t is string => !!t).sort();

  return {
    programId: o.programId,
    koruma: o.koruma,
    asiAdi: o.asiAdi,
    mlEtiket: o.mlEtiket,
    tip: o.tip,
    hayvanSayisi: hayvanlar.length,
    hayvanlar,
    planlananAt: tarihler[0] ?? o.enYakinTarih,
  };
}

/** @deprecated */
export const getAsiGorevDetay = getTakviyeGorevDetay;
