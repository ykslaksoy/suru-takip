/**
 * Önleyici Sağlık Planı → kuzu bazlı otomatik takvim (saf mantık).
 * Her kalem: girişten `gunSonra` gün sonra ilk doz; `tekrarGun` doluysa son dozdan sonra tekrar.
 * Son doz, hayvanın sağlık kayıtlarından (ilaç / tedavi / tanı metni eşleşmesi) bulunur;
 * böylece "yapıldı" işaretlenince bir sonraki tekrar kendiliğinden planlanır.
 */
import { ASI_PROGRAMI, asiKategori } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI } from '@/kaynak/akilli-veteriner/vitamin-programi';
import type { Animal, HealthRecord } from '@/kaynak/cekirdek/tipler';
import type { SaglikPlani, SaglikPlaniBolum } from './saglik-plani';

/** padoklar: doluysa kalem yalnız bu padoklardaki kuzulara planlanır (sağlık programı, parti ırkı). */
export type KalemZaman = { gunSonra: number; tekrarGun: number | null; padoklar?: string[] };
export type PlanZaman = Record<string, KalemZaman>;

const GUN = 86400000;

/** Varsayılan zamanlama — kullanıcı her kalemde değiştirebilir */
export function varsayilanZaman(id: string): KalemZaman {
  const p = ASI_PROGRAMI.find((x) => x.id === id);
  if (p) {
    const parazit = asiKategori(p) === 'parazit';
    return { gunSonra: parazit ? 0 : 1, tekrarGun: p.tekrarGun > 0 ? p.tekrarGun : null };
  }
  if (VITAMIN_PROGRAMI.some((v) => v.id === id)) return { gunSonra: 0, tekrarGun: null };
  return { gunSonra: 0, tekrarGun: null };
}

export function kalemZamani(zaman: PlanZaman, id: string): KalemZaman {
  return zaman[id] ?? varsayilanZaman(id);
}

export function zamanEtiketi(z: KalemZaman): string {
  const ilk = z.gunSonra === 0 ? 'Girişte' : `Girişten ${z.gunSonra} gün sonra`;
  return z.tekrarGun ? `${ilk} · her ${z.tekrarGun} günde tekrar` : `${ilk} · tek doz`;
}

function norm(s: string): string {
  return s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
}

export function kalemAnahtarlari(id: string): string[] {
  const p = ASI_PROGRAMI.find((x) => x.id === id);
  if (p) return [p.koruma, p.ad, ...p.stokAnahtarlar];
  const v = VITAMIN_PROGRAMI.find((x) => x.id === id);
  if (v) return [v.ad, ...v.stokAnahtarlar];
  return [id];
}

export function sonKayit(animalId: string, id: string, health: HealthRecord[]): HealthRecord | null {
  return kayitlar(animalId, id, health).son;
}

function kayitlar(animalId: string, id: string, health: HealthRecord[]): { son: HealthRecord | null; sayi: number } {
  const anahtar = kalemAnahtarlari(id).map(norm).filter((k) => k.length >= 3);
  let enSon: HealthRecord | null = null;
  let sayi = 0;
  for (const h of health) {
    if (h.animalId !== animalId || h.recordType === 'illness' || h.recordType === 'checkup') continue;
    const metin = norm(`${h.medicine} ${h.treatment} ${h.diagnosis}`);
    if (!anahtar.some((k) => metin.includes(k))) continue;
    sayi += 1;
    if (!enSon || h.recordedAt > enSon.recordedAt) enSon = h;
  }
  return { son: enSon, sayi };
}

export type PlanVade = {
  animalId: string;
  programId: string;
  bolum: SaglikPlaniBolum;
  /** YYYY-MM-DD */
  vade: string;
  /** <0 gecikti, 0 bugün, >0 kalan gün */
  kalanGun: number;
  dozNo: number;
};

function gunBasi(t: number): number {
  const d = new Date(t);
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

function tarihStr(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

/** Her aktif kuzu × plan kalemi için sıradaki doz. Tek dozu yapılmış kalem listelenmez. */
export function planVadeleri(opts: {
  animals: Animal[];
  health: HealthRecord[];
  plan: SaglikPlani;
  zaman: PlanZaman;
  now?: number;
}): PlanVade[] {
  const bugun = gunBasi(opts.now ?? Date.now());
  const out: PlanVade[] = [];
  const bolumler: SaglikPlaniBolum[] = ['asi', 'parazit', 'vitamin'];
  for (const a of opts.animals) {
    if (a.status === 'sold' || a.status === 'dead') continue;
    const girisRaw = a.createdAt || a.birthDate;
    const giris = girisRaw ? gunBasi(new Date(girisRaw).getTime()) : bugun;
    for (const b of bolumler) {
      for (const id of opts.plan[b]) {
        const z = kalemZamani(opts.zaman, id);
        if (z.padoklar?.length && !z.padoklar.includes(a.paddock)) continue;
        const { son, sayi: dozSayisi } = kayitlar(a.id, id, opts.health);
        let vade: number;
        if (!son) vade = giris + z.gunSonra * GUN;
        else if (z.tekrarGun) vade = gunBasi(new Date(son.recordedAt).getTime()) + z.tekrarGun * GUN;
        else continue;
        out.push({
          animalId: a.id,
          programId: id,
          bolum: b,
          vade: tarihStr(vade),
          kalanGun: Math.round((vade - bugun) / GUN),
          dozNo: son ? dozSayisi + 1 : 1,
        });
      }
    }
  }
  return out.sort((x, y) => x.vade.localeCompare(y.vade));
}

/** Ekran özeti: kalem başına bugün/gecikmiş ve yaklaşan sayıları */
export function vadeOzeti(vadeler: PlanVade[], yaklasanGun = 7) {
  const harita = new Map<string, { bugun: number; geciken: number; yaklasan: number; enYakin: string | null }>();
  for (const v of vadeler) {
    const o = harita.get(v.programId) ?? { bugun: 0, geciken: 0, yaklasan: 0, enYakin: null };
    if (v.kalanGun < 0) o.geciken += 1;
    else if (v.kalanGun === 0) o.bugun += 1;
    else if (v.kalanGun <= yaklasanGun) o.yaklasan += 1;
    if (!o.enYakin || v.vade < o.enYakin) o.enYakin = v.vade;
    harita.set(v.programId, o);
  }
  return harita;
}
