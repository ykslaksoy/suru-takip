import { ASI_PROGRAMI, asiDozEtiketi, asiKategori, hesaplaAsiStokDurumu } from '@/kaynak/cekirdek/asi-programi';
import { hayvanAltEtiket, hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { getAnimals, getAllHealthRecordsForAsi, getStockItems } from '@/kaynak/cekirdek/veritabani';
import { asiBuHaftaListesi } from '@/kaynak/saglik/asi-hatirlatma';
import { getAktifModId } from '@/sabitler/Modlar';
import { aktifPlanOku, takviyeTipEtiket, type HayvanKalemDurum } from '@/kaynak/akilli-veteriner/mod-takviye';
import type { Gorev, GorevSeviye } from '@/kaynak/gorevler/liste';

export type AsiGorevHayvan = {
  animalId: string;
  etiket: string;
  altEtiket: string;
  paddock: string;
  durum: 'yapilacak' | 'yaklasiyor' | 'planli';
  kalanGun: number | null;
  planlananAt?: string;
};

export type AsiGorevDetay = {
  programId: string;
  koruma: string;
  asiAdi: string;
  mlEtiket: string;
  tip: 'asi' | 'parazit';
  hayvanSayisi: number;
  hayvanlar: AsiGorevHayvan[];
  planlananAt?: string;
};

type ProgramOzet = {
  programId: string;
  koruma: string;
  asiAdi: string;
  mlEtiket: string;
  tip: 'asi' | 'parazit';
  hayvanlar: Map<string, AsiGorevHayvan>;
  enYakinTarih?: string;
};

function programMeta(programId: string): {
  koruma: string;
  asiAdi: string;
  mlEtiket: string;
  tip: 'asi' | 'parazit';
} | null {
  const p = ASI_PROGRAMI.find((x) => x.id === programId);
  if (!p) return null;
  return {
    koruma: p.koruma,
    asiAdi: p.ad,
    mlEtiket: asiDozEtiketi(p),
    tip: asiKategori(p) === 'parazit' ? 'parazit' : 'asi',
  };
}

function kalanGunTarih(tarih: string): number {
  return Math.ceil((new Date(tarih).getTime() - Date.now()) / 86400000);
}

function seviyeBelirle(kalan: number | null, planliMi: boolean): GorevSeviye {
  if (planliMi && kalan != null && kalan > 7) return 'plan';
  if (kalan == null || kalan <= 0) return 'uyari';
  if (kalan <= 7) return 'sira';
  return 'plan';
}

function zamanMetni(kalan: number | null, tarih?: string): string {
  if (tarih && kalan != null) {
    if (kalan <= 0) return `zamanı geldi · ${tarih}`;
    if (kalan === 1) return `yarın · ${tarih}`;
    return `${kalan} gün sonra · ${tarih}`;
  }
  if (kalan == null) return 'aşı zamanı geldi';
  if (kalan <= 0) return 'aşı zamanı geldi';
  if (kalan <= 7) return `${kalan} gün içinde`;
  return `${kalan} gün sonra`;
}

/** Mod plan + takvim — program bazında bekleyen hayvanlar (hayvan görevi değil). */
export async function asiGorevProgramHaritasi(): Promise<Map<string, ProgramOzet>> {
  const modId = await getAktifModId();
  const plan = await aktifPlanOku(modId);
  const animals = await getAnimals();
  const byId = new Map(animals.map((a) => [a.id, a]));
  const health = await getAllHealthRecordsForAsi();
  const stock = await getStockItems();
  const asiDurum = hesaplaAsiStokDurumu(animals, health, stock);

  const modPlanProgramIds = new Set<string>();
  if (plan) {
    for (const k of plan.kalemler) {
      if (k.tip === 'asi' || k.tip === 'parazit') modPlanProgramIds.add(k.programId);
    }
  }

  const map = new Map<string, ProgramOzet>();

  const ensure = (programId: string, meta?: ReturnType<typeof programMeta>): ProgramOzet | null => {
    let o = map.get(programId);
    if (!o) {
      const m = meta ?? programMeta(programId);
      if (!m) return null;
      o = {
        programId,
        koruma: m.koruma,
        asiAdi: m.asiAdi,
        mlEtiket: m.mlEtiket,
        tip: m.tip,
        hayvanlar: new Map(),
      };
      map.set(programId, o);
    }
    return o;
  };

  const planDurumEkle = (d: HayvanKalemDurum, kalem: { ad: string; detay: string; mlEtiket: string }) => {
    if (d.yapildi) return;
    const a = byId.get(d.animalId);
    if (!a || a.status === 'sold' || a.status === 'dead') return;

    const o = ensure(d.programId, {
      koruma: kalem.ad,
      asiAdi: kalem.detay,
      mlEtiket: kalem.mlEtiket,
      tip: d.tip === 'parazit' ? 'parazit' : 'asi',
    });
    if (!o) return;

    const planTarih = d.planlananAt?.slice(0, 10);
    const kalan = planTarih ? kalanGunTarih(planTarih) : null;
    o.hayvanlar.set(d.animalId, {
      animalId: d.animalId,
      etiket: hayvanAnaEtiket(a),
      altEtiket: hayvanAltEtiket(a),
      paddock: a.paddock,
      durum: planTarih && kalan != null && kalan > 0 ? 'planli' : 'yapilacak',
      kalanGun: kalan,
      planlananAt: planTarih,
    });
    if (planTarih && (!o.enYakinTarih || planTarih < o.enYakinTarih)) o.enYakinTarih = planTarih;
  };

  if (plan) {
    for (const k of plan.kalemler) {
      if (k.tip !== 'asi' && k.tip !== 'parazit') continue;
      for (const d of plan.durumlar) {
        if (d.tip !== k.tip || d.programId !== k.programId) continue;
        planDurumEkle(d, k);
      }
    }
  }

  // Takvim: mod planda olmayan programlar veya planda olmayan hayvanlar
  for (const s of asiBuHaftaListesi(asiDurum)) {
    if (modPlanProgramIds.has(s.programId)) {
      const o = map.get(s.programId);
      if (o?.hayvanlar.has(s.animalId)) continue;
    }
    const a = byId.get(s.animalId);
    if (!a) continue;
    const d = asiDurum.find((x) => x.programId === s.programId);
    const o = ensure(s.programId, d ? {
      koruma: d.koruma,
      asiAdi: d.asiAdi,
      mlEtiket: d.mlEtiket,
      tip: programMeta(s.programId)?.tip ?? 'asi',
    } : undefined);
    if (!o) continue;
    o.hayvanlar.set(s.animalId, {
      animalId: s.animalId,
      etiket: hayvanAnaEtiket(a),
      altEtiket: hayvanAltEtiket(a),
      paddock: a.paddock,
      durum: s.durum,
      kalanGun: s.kalanGun,
    });
  }

  return map;
}

/** Aşı kategorisi — program başına tek görev; listede yalnızca kuzu sayısı. */
export async function asiTopluGorevleri(): Promise<Gorev[]> {
  const map = await asiGorevProgramHaritasi();
  const out: Gorev[] = [];

  for (const o of map.values()) {
    if (o.hayvanlar.size === 0) continue;

    const hayvanlar = [...o.hayvanlar.values()];
    const planli = hayvanlar.every((h) => h.durum === 'planli' && h.planlananAt);
    const tarihler = hayvanlar
      .map((h) => h.planlananAt)
      .filter((t): t is string => !!t)
      .sort();
    const enYakinTarih = tarihler[0] ?? o.enYakinTarih;
    const kalan =
      enYakinTarih != null
        ? kalanGunTarih(enYakinTarih)
        : hayvanlar.reduce<number | null>((min, h) => {
            if (h.kalanGun == null) return min;
            if (min == null) return h.kalanGun;
            return Math.min(min, h.kalanGun);
          }, null);

    const n = hayvanlar.length;
    const seviye = seviyeBelirle(kalan, !!planli);

    out.push({
      id: `asi-ozet-${o.programId}`,
      seviye,
      kaynak: 'asi',
      baslik: `${o.koruma} (${o.asiAdi}) ${o.mlEtiket}`,
      aciklama: `${n} kuzu · ${zamanMetni(kalan, enYakinTarih)} · ${takviyeTipEtiket(o.tip)}`,
      href: `/gorevler/asi/${o.programId}`,
      cta: 'Kuzuları gör',
      tarih: enYakinTarih,
    });
  }

  const sira: Record<GorevSeviye, number> = { uyari: 0, sira: 1, plan: 2, bilgi: 3 };
  out.sort((a, b) => {
    const ds = sira[a.seviye] - sira[b.seviye];
    if (ds !== 0) return ds;
    return (a.tarih ?? '9999').localeCompare(b.tarih ?? '9999');
  });

  return out;
}

export async function getAsiGorevDetay(programId: string): Promise<AsiGorevDetay | null> {
  const map = await asiGorevProgramHaritasi();
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
    planlananAt: tarihler[0],
  };
}
