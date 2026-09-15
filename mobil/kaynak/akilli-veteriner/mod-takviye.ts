/**
 * Mod bazlı aşı + vitamin takviye planı.
 * Her ürün modundaki kayıtlı hayvanlar plana dahil edilir;
 * hayvan × kalem bazında yapıldı / bekliyor denetimi tutulur.
 */

import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { v4 as uuidv4 } from 'uuid';
import { ASI_PROGRAMI, asiDozEtiketi, asiMlDozYerEtiketi, asiKategori } from '@/kaynak/cekirdek/asi-programi';
import type { Animal, AnimalModId, HealthRecord, StockItem } from '@/kaynak/cekirdek/tipler';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import {
  addHealthRecord,
  adjustStock,
  getAnimals,
  getAllHealthRecordsForAsi,
  getStockItems,
  getWeightRecords,
  upsertAnimal,
} from '@/kaynak/cekirdek/veritabani';
import { kaydetKatalogKullanim } from '@/kaynak/stok/kullanim';
import { getAktifModId, getMod, type UrunModId } from '@/sabitler/Modlar';
import { VITAMIN_PROGRAMI, vitaminDozEtiketi, vitaminMlDozYerEtiketi } from './vitamin-programi';
import { hizliBesiTakviyeSablonu, HIZLI_BESI_PLAN_BASLIK, hizliBesiPlanGun, rapelAnaProgramId } from './hizli-besi-plani';
import {
  TARTIM_GIRIS_PROGRAM_ID,
  TARTIM_15_PROGRAM_ID,
  type ModTakviyeKalemi,
  type TakviyeTip,
} from './takviye-tipler';

export {
  TARTIM_GIRIS_PROGRAM_ID,
  TARTIM_15_PROGRAM_ID,
  type ModTakviyeKalemi,
  type TakviyeTip,
} from './takviye-tipler';

const PLAN_KEY = 'sy_mod_takviye_plan_v1';

export type HayvanKalemDurum = {
  animalId: string;
  earTag: string;
  tip: TakviyeTip;
  programId: string;
  yapildi: boolean;
  yapildiAt?: string;
  /** Planlanan uygulama tarihi (ISO) — örn. 21 gün sonra aşı */
  planlananAt?: string;
};

export type ModTakviyePlani = {
  id: string;
  modId: UrunModId;
  baslik: string;
  tarih: string;
  kalemler: ModTakviyeKalemi[];
  hayvanIds: string[];
  durumlar: HayvanKalemDurum[];
  olusturuldu: string;
};

export type ModTakviyeOzet = {
  plan: ModTakviyePlani;
  hayvanSayisi: number;
  kalemSayisi: number;
  toplamIs: number;
  yapilan: number;
  bekleyen: number;
  yuzde: number;
  tamamlandi: boolean;
};

function kalemAnahtar(tip: TakviyeTip, programId: string): string {
  return `${tip}:${programId}`;
}

/** Bugünden N gün sonrası (YYYY-MM-DD) */
export function gunSonraTarih(gun: number, now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + gun);
  return d.toISOString().slice(0, 10);
}

/** Aşı/parazit için varsayılan plan gecikmesi (karantina / ilk doz) */
export const ASI_PLAN_GUN = 21;

export function takviyeTipEtiket(tip: TakviyeTip): string {
  if (tip === 'asi') return 'aşı';
  if (tip === 'parazit') return 'parazit';
  if (tip === 'tartim') return 'tartım';
  return 'vitamin';
}

/** Mod başına önerilen aşı + vitamin + 15 günde bir tartım şablonu */
export function modTakviyeSablonu(modId: UrunModId): ModTakviyeKalemi[] {
  const asi = (id: string): ModTakviyeKalemi | null => {
    const p = ASI_PROGRAMI.find((x) => x.id === id);
    if (!p) return null;
    const kat = asiKategori(p);
    return {
      tip: kat === 'parazit' ? 'parazit' : 'asi',
      programId: p.id,
      ad: p.koruma,
      detay: p.ad,
      mlEtiket: asiMlDozYerEtiketi(p, { dozNo: 1, toplamDoz: 1 }),
    };
  };
  const vit = (id: string): ModTakviyeKalemi | null => {
    const v = VITAMIN_PROGRAMI.find((x) => x.id === id);
    if (!v) return null;
    return {
      tip: 'vitamin',
      programId: v.id,
      ad: v.detay,
      detay: v.ad,
      mlEtiket: vitaminMlDozYerEtiketi(v, { dozNo: 1, toplamDoz: 1 }),
    };
  };

  const tartim: ModTakviyeKalemi = {
    tip: 'tartim',
    programId: TARTIM_15_PROGRAM_ID,
    ad: '15 günde bir tartım',
    detay: 'Kontrol tartımı',
    mlEtiket: '15 gün',
  };

  const ids: Record<UrunModId, { asilar: string[]; vitaminler: string[] }> = {
    mod1: {
      // Hızlı besi — ayrı şablon: hizliBesiTakviyeSablonu()
      asilar: [],
      vitaminler: [],
    },
    mod2: {
      asilar: ['karma', 'pasteurella', 'clostridial', 'ppr', 'cicek', 'albendazol', 'ivermektin'],
      vitaminler: ['ad3e', 'b-kompleks', 'kolostrum', 'selen-e'],
    },
    mod3: {
      asilar: ['karma', 'brusella', 'tetanos', 'pasteurella', 'clostridial', 'albendazol'],
      vitaminler: ['ad3e', 'b-kompleks', 'premiks', 'selen-e'],
    },
    mod4: {
      asilar: ['agalaksi', 'karma', 'pasteurella', 'clostridial', 'albendazol', 'triklabendazol'],
      vitaminler: ['ad3e', 'kalsiyum', 'b-kompleks', 'mineral-yalama', 'premiks'],
    },
  };

  if (modId === 'mod1') {
    return hizliBesiTakviyeSablonu();
  }

  const s = ids[modId];
  return [tartim, ...s.asilar.map(asi), ...s.vitaminler.map(vit)].filter(
    (x): x is ModTakviyeKalemi => x != null,
  );
}

/** Moddaki aktif hayvanlar (satılmış/ölü hariç) */
export async function getHayvanlarByMod(modId: UrunModId): Promise<Animal[]> {
  const animals = await getAnimals();
  return animals.filter((a) => {
    if (a.status === 'sold' || a.status === 'dead') return false;
    return (a.modId ?? null) === modId;
  });
}

/**
 * Modu atanmamış hayvanları aktif moda bağla (eski kayıtlar).
 * Plan oluştururken çağrılır.
 */
export async function atanmamisHayvanlariModaBagla(modId: UrunModId): Promise<number> {
  const animals = await getAnimals();
  let n = 0;
  for (const a of animals) {
    if (a.status === 'sold' || a.status === 'dead') continue;
    if (a.modId != null) continue;
    await upsertAnimal({ ...a, modId: modId as AnimalModId });
    n += 1;
  }
  return n;
}

export async function planlariOku(): Promise<ModTakviyePlani[]> {
  const raw = await kaliciGetItem(PLAN_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ModTakviyePlani[];
  } catch {
    return [];
  }
}

async function planlariYaz(list: ModTakviyePlani[]): Promise<void> {
  await kaliciSetItem(PLAN_KEY, JSON.stringify(list.slice(0, 30)));
}

export async function planKaydet(plan: ModTakviyePlani): Promise<void> {
  const list = await planlariOku();
  list.unshift(plan);
  await planlariYaz(list);
}

export async function planGuncelle(plan: ModTakviyePlani): Promise<void> {
  const list = await planlariOku();
  const idx = list.findIndex((p) => p.id === plan.id);
  if (idx >= 0) list[idx] = plan;
  else list.unshift(plan);
  await planlariYaz(list);
}

export async function planSil(planId: string): Promise<void> {
  const list = await planlariOku();
  await planlariYaz(list.filter((p) => p.id !== planId));
}

export async function aktifPlanOku(modId: UrunModId): Promise<ModTakviyePlani | null> {
  const list = await planlariOku();
  const adaylar = list.filter((p) => p.modId === modId);
  if (adaylar.length === 0) return null;
  // En yeni plan
  return adaylar.sort((a, b) => b.olusturuldu.localeCompare(a.olusturuldu))[0] ?? null;
}

export function planOzeti(plan: ModTakviyePlani): ModTakviyeOzet {
  const toplamIs = plan.durumlar.length;
  const yapilan = plan.durumlar.filter((d) => d.yapildi).length;
  const bekleyen = toplamIs - yapilan;
  const yuzde = toplamIs === 0 ? 0 : Math.round((yapilan / toplamIs) * 100);
  return {
    plan,
    hayvanSayisi: plan.hayvanIds.length,
    kalemSayisi: plan.kalemler.length,
    toplamIs,
    yapilan,
    bekleyen,
    yuzde,
    tamamlandi: toplamIs > 0 && bekleyen === 0,
  };
}

function durumMatrisi(
  hayvanlar: Animal[],
  kalemler: ModTakviyeKalemi[],
  onceki?: HayvanKalemDurum[],
  opts?: { asiPlanGun?: number; modId?: UrunModId },
): HayvanKalemDurum[] {
  const asiPlanGun = opts?.asiPlanGun ?? ASI_PLAN_GUN;
  const mod1 = opts?.modId === 'mod1';
  const map = new Map(
    (onceki ?? []).map((d) => [`${d.animalId}|${kalemAnahtar(d.tip, d.programId)}`, d]),
  );
  const out: HayvanKalemDurum[] = [];
  for (const h of hayvanlar) {
    for (const k of kalemler) {
      const key = `${h.id}|${kalemAnahtar(k.tip, k.programId)}`;
      const eski = map.get(key);
      const etiket = hayvanAnaEtiket(h);
      const gun = mod1 ? hizliBesiPlanGun(k.tip, k.programId) : asiPlanGun;
      const planlanan = gunSonraTarih(gun);
      const planlanabilir =
        k.tip === 'asi' || k.tip === 'parazit' || k.tip === 'vitamin' || k.tip === 'tartim';
      if (eski) {
        out.push({
          ...eski,
          earTag: etiket,
          planlananAt:
            eski.yapildi || !planlanabilir
              ? eski.planlananAt
              : eski.planlananAt ?? planlanan,
        });
      } else {
        out.push({
          animalId: h.id,
          earTag: etiket,
          tip: k.tip,
          programId: k.programId,
          yapildi: false,
          planlananAt: planlanabilir ? planlanan : undefined,
        });
      }
    }
  }
  return out;
}

function normalize(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');
}

function eslesir(metin: string, anahtarlar: string[]): boolean {
  const n = normalize(metin);
  return anahtarlar.some((k) => n.includes(normalize(k)));
}

/** Sağlık + tartım kayıtlarından yapıldı bilgisini birleştir */
async function durumlariKayitlarlaBirlestir(
  durumlar: HayvanKalemDurum[],
  health: HealthRecord[],
): Promise<HayvanKalemDurum[]> {
  const tartimCache = new Map<string, { adet: number; sonAt: string | null }>();

  const out: HayvanKalemDurum[] = [];
  for (const d of durumlar) {
    if (d.yapildi) {
      out.push(d);
      continue;
    }

    if (d.tip === 'tartim') {
      let info = tartimCache.get(d.animalId);
      if (!info) {
        const wr = await getWeightRecords(d.animalId);
        const sorted = [...wr].sort(
          (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
        );
        info = { adet: wr.length, sonAt: sorted[0]?.recordedAt ?? null };
        tartimCache.set(d.animalId, info);
      }
      // Giriş tartımı: ≥1 kayıt · 15g kontrol: ≥2 kayıt
      const esik = d.programId === TARTIM_GIRIS_PROGRAM_ID ? 1 : 2;
      if (info.adet >= esik) {
        out.push({ ...d, yapildi: true, yapildiAt: info.sonAt ?? undefined });
      } else {
        out.push(d);
      }
      continue;
    }

    if (d.tip === 'vitamin') {
      out.push(d);
      continue;
    }

    const program = ASI_PROGRAMI.find((p) => p.id === d.programId);
    if (!program) {
      const anaId = rapelAnaProgramId(d.programId);
      const base = anaId ? ASI_PROGRAMI.find((p) => p.id === anaId) : null;
      if (!base) {
        out.push(d);
        continue;
      }
      const related = health
        .filter((h) => h.animalId === d.animalId && h.recordType === 'vaccine')
        .filter((h) =>
          eslesir(`${h.medicine} ${h.treatment} ${h.diagnosis}`, [
            base.koruma,
            base.ad,
            ...base.stokAnahtarlar,
          ]),
        )
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
      if (related.length >= 2) {
        out.push({ ...d, yapildi: true, yapildiAt: related[0].recordedAt });
      } else {
        out.push(d);
      }
      continue;
    }
    const kategori = asiKategori(program);
    const related = health
      .filter((h) => {
        if (h.animalId !== d.animalId) return false;
        if (kategori === 'parazit') {
          return h.recordType === 'vaccine' || h.recordType === 'treatment';
        }
        return h.recordType === 'vaccine';
      })
      .filter((h) =>
        eslesir(`${h.medicine} ${h.treatment} ${h.diagnosis}`, [
          program.koruma,
          program.ad,
          ...program.stokAnahtarlar,
        ]),
      )
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    const last = related[0];
    if (!last) {
      out.push(d);
      continue;
    }
    out.push({ ...d, yapildi: true, yapildiAt: last.recordedAt });
  }
  return out;
}

/**
 * Aktif (veya verilen) mod için aşı+vitamin planı oluştur / yenile.
 * Mevcut planın yapıldı durumları + sağlık kayıtları korunur.
 */
export async function olusturModTakviyePlani(opts?: {
  modId?: UrunModId;
  tarih?: string;
  kalemler?: ModTakviyeKalemi[];
}): Promise<{ plan: ModTakviyePlani; baglanan: number; message: string }> {
  const modId = opts?.modId ?? (await getAktifModId());
  const baglanan = await atanmamisHayvanlariModaBagla(modId);
  const hayvanlar = await getHayvanlarByMod(modId);
  const kalemler = opts?.kalemler ?? modTakviyeSablonu(modId);
  const mod = getMod(modId);
  const planTarih = opts?.tarih ?? gunSonraTarih(ASI_PLAN_GUN);
  const mevcut = await aktifPlanOku(modId);
  const health = await getAllHealthRecordsForAsi();

  const baslik =
    modId === 'mod1' ? HIZLI_BESI_PLAN_BASLIK : `${mod.baslik} — aşı (21g), tartım, parazit & vitamin`;

  if (hayvanlar.length === 0) {
    const plan: ModTakviyePlani = {
      id: mevcut?.id ?? uuidv4(),
      modId,
      baslik,
      tarih: planTarih,
      kalemler,
      hayvanIds: [],
      durumlar: [],
      olusturuldu: mevcut?.olusturuldu ?? new Date().toISOString(),
    };
    if (mevcut) await planGuncelle(plan);
    else await planKaydet(plan);
    return {
      plan,
      baglanan,
      message: `${mod.baslik} planı oluşturuldu ama bu moda kayıtlı hayvan yok. Hayvan eklerken bu modu seçin.`,
    };
  }

  const durumlar = await durumlariKayitlarlaBirlestir(
    durumMatrisi(hayvanlar, kalemler, mevcut?.durumlar, { modId }),
    health,
  );

  const plan: ModTakviyePlani = {
    id: mevcut?.id ?? uuidv4(),
    modId,
    baslik,
    tarih: planTarih,
    kalemler,
    hayvanIds: hayvanlar.map((h) => h.id),
    durumlar,
    olusturuldu: mevcut?.olusturuldu ?? new Date().toISOString(),
  };
  if (mevcut) await planGuncelle(plan);
  else await planKaydet(plan);

  const ozet = planOzeti(plan);
  return {
    plan,
    baglanan,
    message: `${hayvanlar.length} hayvan · ${kalemler.length} kalem · ${ozet.yapilan}/${ozet.toplamIs} yapıldı${
      baglanan > 0 ? ` · ${baglanan} eski kayıt bu moda bağlandı` : ''
    }.`,
  };
}

/** Yeni kayıtlı hayvanları mevcut plana ekle (yapılmadı olarak) */
export async function planaYeniHayvanlariEkle(planId: string): Promise<{ eklenen: number; plan: ModTakviyePlani | null }> {
  const list = await planlariOku();
  const plan = list.find((p) => p.id === planId);
  if (!plan) return { eklenen: 0, plan: null };

  const hayvanlar = await getHayvanlarByMod(plan.modId);
  const oncekiIds = new Set(plan.hayvanIds);
  const yeniler = hayvanlar.filter((h) => !oncekiIds.has(h.id));
  if (yeniler.length === 0) return { eklenen: 0, plan };

  const mevcutHayvanlar = hayvanlar.filter((h) => oncekiIds.has(h.id) || yeniler.some((y) => y.id === h.id));

  const guncel: ModTakviyePlani = {
    ...plan,
    hayvanIds: mevcutHayvanlar.map((h) => h.id),
    durumlar: durumMatrisi(mevcutHayvanlar, plan.kalemler, plan.durumlar, {
      modId: plan.modId,
    }),
  };
  await planGuncelle(guncel);
  return { eklenen: yeniler.length, plan: guncel };
}

async function stokDusTakviye(opts: {
  tip: TakviyeTip;
  programId: string;
  earTag: string;
}): Promise<{ dusum: number; uyari: string | null; ad: string | null }> {
  if (opts.tip === 'tartim') {
    return { dusum: 0, uyari: null, ad: null };
  }
  const stock = await getStockItems();
  let item: StockItem | null = null;
  let doz = 1;
  let ad = opts.programId;

  if (opts.tip === 'asi' || opts.tip === 'parazit') {
    const asiId = rapelAnaProgramId(opts.programId) ?? opts.programId;
    const program = ASI_PROGRAMI.find((p) => p.id === asiId);
    if (!program) return { dusum: 0, uyari: 'Program yok — stok düşülmedi', ad: null };
    ad = program.koruma;
    doz = program.dozHayvan;
    const anahtarlar = [program.koruma, program.ad, ...program.stokAnahtarlar];
    if (asiKategori(program) === 'parazit') {
      const medicines = stock.filter((s) => s.type === 'medicine');
      item =
        medicines.find((s) => eslesir(s.name, anahtarlar)) ??
        stock.find((s) => eslesir(s.name, anahtarlar)) ??
        null;
    } else {
      const vaccines = stock.filter((s) => s.type === 'vaccine');
      item =
        vaccines.find((s) => eslesir(s.name, anahtarlar)) ??
        stock.find((s) => eslesir(s.name, anahtarlar)) ??
        null;
    }
  } else {
    const vit = VITAMIN_PROGRAMI.find((v) => v.id === opts.programId);
    if (!vit) return { dusum: 0, uyari: 'Vitamin yok — stok düşülmedi', ad: null };
    ad = vit.ad;
    doz = 1;
    const anahtarlar = [vit.ad, vit.detay, ...vit.stokAnahtarlar];
    const supplements = stock.filter((s) => s.type === 'supplement' || s.type === 'medicine');
    item =
      supplements.find((s) => eslesir(s.name, anahtarlar)) ??
      stock.find((s) => eslesir(s.name, anahtarlar)) ??
      null;
  }

  if (!item) {
    return { dusum: 0, uyari: `Stokta "${ad}" yok — kayıt yazıldı`, ad: null };
  }
  if (item.quantity < doz) {
    const dusulecek = Math.max(0, item.quantity);
    if (dusulecek > 0) {
      await adjustStock(item.id, 'out', dusulecek, `Mod plan · ${opts.earTag} · ${ad}`);
      await kaydetKatalogKullanim(opts.programId, dusulecek);
    }
    return {
      dusum: dusulecek,
      uyari: `Stok yetersiz (${item.name}: ${item.quantity}) — ${dusulecek} düşüldü`,
      ad: item.name,
    };
  }
  await adjustStock(item.id, 'out', doz, `Mod plan · ${opts.earTag} · ${ad}`);
  await kaydetKatalogKullanim(opts.programId, doz);
  return { dusum: doz, uyari: null, ad: item.name };
}

/** Tek hayvan × tek kalem — yapıldı işaretle + sağlık kaydı + stok */
export async function isaretleYapildi(opts: {
  planId: string;
  animalId: string;
  tip: TakviyeTip;
  programId: string;
}): Promise<{
  ok: boolean;
  message: string;
  plan?: ModTakviyePlani;
  stokDusum?: number;
  stokUyari?: string | null;
}> {
  const list = await planlariOku();
  const plan = list.find((p) => p.id === opts.planId);
  if (!plan) return { ok: false, message: 'Plan bulunamadı' };

  const kalem = plan.kalemler.find((k) => k.tip === opts.tip && k.programId === opts.programId);
  if (!kalem) return { ok: false, message: 'Kalem yok' };

  const hayvanlar = await getAnimals();
  const hayvan = hayvanlar.find((a) => a.id === opts.animalId);
  if (!hayvan) return { ok: false, message: 'Hayvan yok' };

  const idx = plan.durumlar.findIndex(
    (d) =>
      d.animalId === opts.animalId &&
      d.tip === opts.tip &&
      d.programId === opts.programId,
  );
  if (idx < 0) return { ok: false, message: 'Takip kaydı yok' };
  if (plan.durumlar[idx].yapildi) {
    return { ok: true, message: 'Zaten işaretli', plan };
  }

  const now = new Date().toISOString();

  if (opts.tip === 'tartim') {
    const durumlar = [...plan.durumlar];
    durumlar[idx] = {
      ...durumlar[idx],
      yapildi: true,
      yapildiAt: now,
      earTag: hayvanAnaEtiket(hayvan),
    };
    const guncel: ModTakviyePlani = { ...plan, durumlar };
    await planGuncelle(guncel);
    return {
      ok: true,
      message: `${hayvanAnaEtiket(hayvan)} · ${kalem.ad} işaretlendi (tartım kaydı için Kilo Takibi’ne gidin)`,
      plan: guncel,
      stokDusum: 0,
      stokUyari: null,
    };
  }

  await addHealthRecord({
    id: uuidv4(),
    animalId: hayvan.id,
    recordType: opts.tip === 'asi' ? 'vaccine' : 'treatment',
    symptoms: '',
    diagnosis: kalem.ad,
    treatment: `${kalem.detay} · ${kalem.mlEtiket}`,
    medicine: `${kalem.ad} (${kalem.detay})`,
    withdrawalDays: 0,
    vetName: 'Mod takviye planı',
    recordedAt: now,
    notes: [
      `ModPlan:${plan.id.slice(0, 8)}`,
      `${opts.tip}:${opts.programId}`,
      `Küpe: ${hayvan.earTag}`,
      getMod(plan.modId).baslik,
    ].join(' · '),
  });

  const stok = await stokDusTakviye({
    tip: opts.tip,
    programId: opts.programId,
    earTag: hayvan.earTag,
  });

  const durumlar = [...plan.durumlar];
  durumlar[idx] = {
    ...durumlar[idx],
    yapildi: true,
    yapildiAt: now,
    earTag: hayvanAnaEtiket(hayvan),
  };
  const guncel: ModTakviyePlani = { ...plan, durumlar };
  await planGuncelle(guncel);

  return {
    ok: true,
    message: `${hayvanAnaEtiket(hayvan)} · ${kalem.ad} yapıldı${stok.uyari ? ` · ${stok.uyari}` : stok.dusum ? ` · stok −${stok.dusum}` : ''}`,
    plan: guncel,
    stokDusum: stok.dusum,
    stokUyari: stok.uyari,
  };
}

/** Bir kalemi tüm hayvanlara uygula */
export async function kalemiTumuneUygula(opts: {
  planId: string;
  tip: TakviyeTip;
  programId: string;
}): Promise<{ ok: boolean; sayi: number; message: string; plan?: ModTakviyePlani }> {
  const list = await planlariOku();
  let plan = list.find((p) => p.id === opts.planId);
  if (!plan) return { ok: false, sayi: 0, message: 'Plan yok' };

  const bekleyen = plan.durumlar.filter(
    (d) => d.tip === opts.tip && d.programId === opts.programId && !d.yapildi,
  );
  let sayi = 0;
  let stokToplam = 0;
  const uyarilar: string[] = [];
  for (const d of bekleyen) {
    const r = await isaretleYapildi({
      planId: opts.planId,
      animalId: d.animalId,
      tip: opts.tip,
      programId: opts.programId,
    });
    if (r.ok && r.plan) {
      plan = r.plan;
      sayi += 1;
      stokToplam += r.stokDusum ?? 0;
      if (r.stokUyari && !uyarilar.includes(r.stokUyari)) uyarilar.push(r.stokUyari);
    }
  }
  return {
    ok: true,
    sayi,
    message: `${sayi} hayvana uygulandı · stok −${stokToplam}${uyarilar.length ? ` · ${uyarilar[0]}` : ''}`,
    plan: plan ?? undefined,
  };
}

export function bekleyenSatirlar(plan: ModTakviyePlani): HayvanKalemDurum[] {
  return plan.durumlar.filter((d) => !d.yapildi);
}

