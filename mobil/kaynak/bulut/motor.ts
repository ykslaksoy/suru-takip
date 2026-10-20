/**
 * Senkron motoru — saf mantık + enjekte edilen depo/taşıyıcı (testlenebilir).
 * Model: her senkronlanan yerel anahtar = bir belge. Last-write-wins (updated_at), soft delete.
 * Çevrimdışı: yerel değişiklikler "bekleyen" listesinde kalıcı tutulur; bağlantı gelince gönderilir.
 */
import { finansMi, senkronlanirMi } from './siniflama';

export type UzakBelge = {
  anahtar: string;
  deger: unknown;
  finans: boolean;
  silindi: boolean;
  updated_at: string;
  sunucu_zamani?: string;
};

export type YerelDepo = {
  anahtarlar(): Promise<string[]>;
  oku(k: string): Promise<string | null>;
  yaz(k: string, v: string): Promise<void>;
  sil(k: string): Promise<void>;
};

export type Tasiyici = {
  gonder(belgeler: UzakBelge[]): Promise<void>;
  cek(imlec: string | null): Promise<UzakBelge[]>;
};

/** Cihazda tutulan senkron meta verisi */
export type SenkronMeta = {
  ozet: Record<string, string>; // anahtar -> son bilinen içerik özeti
  zaman: Record<string, string>; // anahtar -> yerel son değişiklik ISO
  bekleyen: string[]; // gönderilmeyi bekleyen anahtarlar (çevrimdışı kuyruk)
  imlec: string | null; // son çekilen sunucu_zamani
  ilkYukleme: boolean; // tek seferlik göç yapıldı mı
};

export const META_ANAHTAR = 'sy_bulut_meta_v1';

export function bosMeta(): SenkronMeta {
  return { ozet: {}, zaman: {}, bekleyen: [], imlec: null, ilkYukleme: false };
}

/** Hızlı, deterministik içerik özeti (FNV-1a) */
export function ozetle(s: string | null): string {
  if (s == null) return '∅';
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${s.length}:${h.toString(16)}`;
}

/** Yerel değişiklikleri bul, zaman damgala, bekleyen kuyruğuna ekle */
export async function yerelDegisiklikleriTara(depo: YerelDepo, meta: SenkronMeta, simdi: string): Promise<SenkronMeta> {
  const m: SenkronMeta = { ...meta, ozet: { ...meta.ozet }, zaman: { ...meta.zaman }, bekleyen: [...meta.bekleyen] };
  const mevcut = (await depo.anahtarlar()).filter(senkronlanirMi);
  const gorulen = new Set<string>();
  for (const k of mevcut) {
    gorulen.add(k);
    const o = ozetle(await depo.oku(k));
    if (m.ozet[k] !== o) {
      m.ozet[k] = o;
      m.zaman[k] = simdi;
      if (!m.bekleyen.includes(k)) m.bekleyen.push(k);
    }
  }
  // Silinen anahtarlar → soft delete
  for (const k of Object.keys(m.ozet)) {
    if (!gorulen.has(k) && m.ozet[k] !== '∅') {
      m.ozet[k] = '∅';
      m.zaman[k] = simdi;
      if (!m.bekleyen.includes(k)) m.bekleyen.push(k);
    }
  }
  return m;
}

function jsonCoz(s: string | null): unknown {
  if (s == null) return null;
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export async function bekleyenBelgeler(depo: YerelDepo, meta: SenkronMeta, finansYetkisi: boolean): Promise<UzakBelge[]> {
  const out: UzakBelge[] = [];
  for (const k of meta.bekleyen) {
    const finans = finansMi(k);
    if (finans && !finansYetkisi) continue; // yetkisiz kullanıcı finans yazamaz (sunucu da reddeder)
    const raw = await depo.oku(k);
    out.push({ anahtar: k, deger: jsonCoz(raw), finans, silindi: raw == null, updated_at: meta.zaman[k] ?? new Date(0).toISOString() });
  }
  return out;
}

/** LWW: uzak belge yerelden yeniyse ve yerelde gönderilmemiş daha yeni değişiklik yoksa uygula */
export function uzakKazanirMi(u: UzakBelge, meta: SenkronMeta): boolean {
  const yerelZ = meta.zaman[u.anahtar];
  if (!yerelZ) return true;
  return u.updated_at > yerelZ;
}

export type SenkronRapor = { gonderilen: number; alinan: number; bekleyen: number; hata?: string };

export async function senkronEt(
  depo: YerelDepo,
  tasiyici: Tasiyici,
  meta0: SenkronMeta,
  opts: { finansYetkisi: boolean; simdi?: () => string },
): Promise<{ meta: SenkronMeta; rapor: SenkronRapor }> {
  const simdi = opts.simdi ?? (() => new Date().toISOString());
  let meta = await yerelDegisiklikleriTara(depo, meta0, simdi());
  if (!opts.finansYetkisi) meta.bekleyen = meta.bekleyen.filter((k) => !finansMi(k));
  let gonderilen = 0;
  let alinan = 0;
  try {
    // 1) Çek (önce çekmek, yerelde daha eski değişikliklerin üstüne yazılmasını LWW ile çözer)
    const uzak = await tasiyici.cek(meta.imlec);
    for (const u of uzak) {
      if (!senkronlanirMi(u.anahtar)) continue;
      if (u.sunucu_zamani && (!meta.imlec || u.sunucu_zamani > meta.imlec)) meta.imlec = u.sunucu_zamani;
      if (!uzakKazanirMi(u, meta)) continue;
      if (u.silindi) {
        await depo.sil(u.anahtar);
        meta.ozet[u.anahtar] = '∅';
      } else {
        const s = typeof u.deger === 'string' ? u.deger : JSON.stringify(u.deger);
        await depo.yaz(u.anahtar, s);
        meta.ozet[u.anahtar] = ozetle(s);
      }
      meta.zaman[u.anahtar] = u.updated_at;
      meta.bekleyen = meta.bekleyen.filter((k) => k !== u.anahtar);
      alinan++;
    }
    // 2) Gönder
    const giden = await bekleyenBelgeler(depo, meta, opts.finansYetkisi);
    if (giden.length) await tasiyici.gonder(giden);
    gonderilen = giden.length;
    meta = { ...meta, bekleyen: [], ilkYukleme: true };
    return { meta, rapor: { gonderilen, alinan, bekleyen: 0 } };
  } catch (e) {
    // Çevrimdışı / hata: bekleyenler korunur, sonraki denemede gönderilir
    return { meta, rapor: { gonderilen: 0, alinan, bekleyen: meta.bekleyen.length, hata: e instanceof Error ? e.message : String(e) } };
  }
}
