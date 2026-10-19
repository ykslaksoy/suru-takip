/**
 * Çiftleşme / doğum — saf hesap (DB / RN yok).
 * Akış: (süngerleme →) koç katımı → ultrason → beklenen doğum (~150 gün) → doğum (tek/ikiz/üçüz).
 */

export type CiftlesmeYontem = 'koc' | 'sunger' | 'suni';
export type UltrasonSonuc = 'gebe' | 'bos';

export type CiftlesmeKaydi = {
  id: string;
  koyunId: string;
  kocId: string | null;
  yontem: CiftlesmeYontem;
  /** Süngerlemede sünger takma günü (YYYY-MM-DD) */
  sungerTakma?: string | null;
  /** Sünger kaç gün kalır (12–14) */
  sungerGun?: number;
  /** Koç katımı / tohumlama günü (YYYY-MM-DD) */
  katimTarih: string;
  /** Gebelik süresi gün (varsayılan 150, düzenlenebilir) */
  gebelikGun: number;
  ultrason?: { tarih: string; sonuc: UltrasonSonuc; yavruSayisi?: number } | null;
  dogum?: { tarih: string; kuzuIds: string[]; canli: number; olu: number } | null;
  not?: string;
  olusturma: string;
  silindi?: string | null;
};

export const VARSAYILAN_GEBELIK_GUN = 150;
export const VARSAYILAN_SUNGER_GUN = 14;
/** Sünger çıkışından kızgınlığa (koç katımı) — PMSG ile ~48 saat */
export const SUNGER_KIZGINLIK_GUN = 2;
/** Ultrason için ideal gün: katımdan 40–60 gün sonra */
export const ULTRASON_GUN = 45;
export const ULTRASON_EN_ERKEN = 30;
/** Doğuma bu kadar gün kala görev açılır */
export const DOGUM_HAZIRLIK_GUN = 14;
/** Beklenenden bu kadar gün sonra hâlâ doğum yoksa gecikti */
export const DOGUM_GECIKME_GUN = 7;

export const YONTEM_ETIKET: Record<CiftlesmeYontem, string> = {
  koc: 'Koç katımı',
  sunger: 'Süngerleme + koç',
  suni: 'Suni tohumlama',
};

export function gunEkle(iso: string, gun: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + gun);
  return d.toISOString().slice(0, 10);
}

export function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
}

export function sungerCikis(k: Pick<CiftlesmeKaydi, 'sungerTakma' | 'sungerGun'>): string | null {
  return k.sungerTakma ? gunEkle(k.sungerTakma, k.sungerGun ?? VARSAYILAN_SUNGER_GUN) : null;
}

/** Süngerlemede katım tarihi: takma + sünger günü + 2 */
export function sungerdenKatim(takma: string, sungerGun = VARSAYILAN_SUNGER_GUN): string {
  return gunEkle(takma, sungerGun + SUNGER_KIZGINLIK_GUN);
}

export function beklenenDogum(k: Pick<CiftlesmeKaydi, 'katimTarih' | 'gebelikGun'>): string {
  return gunEkle(k.katimTarih, k.gebelikGun || VARSAYILAN_GEBELIK_GUN);
}

export function ultrasonTarihi(k: Pick<CiftlesmeKaydi, 'katimTarih'>): string {
  return gunEkle(k.katimTarih, ULTRASON_GUN);
}

export type CiftlesmeDurum = 'sunger' | 'bekleniyor' | 'gebe' | 'bos' | 'dogurdu' | 'gecikti';

export const DURUM_ETIKET: Record<CiftlesmeDurum, string> = {
  sunger: 'Sünger takılı',
  bekleniyor: 'Katım yapıldı',
  gebe: 'Gebe',
  bos: 'Boş',
  dogurdu: 'Doğurdu',
  gecikti: 'Doğum gecikti',
};

export function durum(k: CiftlesmeKaydi, bugun: string): CiftlesmeDurum {
  if (k.dogum) return 'dogurdu';
  if (k.ultrason?.sonuc === 'bos') return 'bos';
  if (k.yontem === 'sunger' && bugun < k.katimTarih) return 'sunger';
  if (gunFarki(beklenenDogum(k), bugun) > DOGUM_GECIKME_GUN) return 'gecikti';
  if (k.ultrason?.sonuc === 'gebe') return 'gebe';
  return 'bekleniyor';
}

/** Sonuçlanmamış (doğum yok, boş değil) */
export function aktifMi(k: CiftlesmeKaydi): boolean {
  return !k.silindi && !k.dogum && k.ultrason?.sonuc !== 'bos';
}

export function gorunenler(l: CiftlesmeKaydi[]): CiftlesmeKaydi[] {
  return l.filter((k) => !k.silindi);
}

/** Bir koyunun son (aktif varsa aktif) kaydı */
export function koyunKaydi(l: CiftlesmeKaydi[], koyunId: string): CiftlesmeKaydi | null {
  const k = gorunenler(l)
    .filter((x) => x.koyunId === koyunId)
    .sort((a, b) => b.katimTarih.localeCompare(a.katimTarih) || b.olusturma.localeCompare(a.olusturma));
  return k.find(aktifMi) ?? k[0] ?? null;
}

export type KatimGirdi = {
  koyunIds: string[];
  kocId: string | null;
  yontem: CiftlesmeYontem;
  /** koç / suni: katım günü; sünger: takma günü */
  tarih: string;
  sungerGun?: number;
  gebelikGun?: number;
  not?: string;
};

const TARIH_RE = /^\d{4}-\d{2}-\d{2}$/;

export function katimDogrula(g: KatimGirdi, bugun: string): string | null {
  if (!g.koyunIds.length) return 'En az bir koyun seç';
  if (!TARIH_RE.test(g.tarih)) return 'Tarih YYYY-MM-DD olmalı';
  if (g.yontem !== 'sunger' && g.tarih > bugun) return 'Katım tarihi ileride olamaz';
  if (gunFarki(g.tarih, bugun) > 200) return 'Tarih 200 günden eski';
  const gg = g.gebelikGun ?? VARSAYILAN_GEBELIK_GUN;
  if (gg < 140 || gg > 160) return 'Gebelik süresi 140–160 gün olmalı';
  if (g.yontem === 'sunger') {
    const sg = g.sungerGun ?? VARSAYILAN_SUNGER_GUN;
    if (sg < 9 || sg > 16) return 'Sünger süresi 9–16 gün olmalı';
  }
  if (g.yontem === 'koc' && !g.kocId) return 'Koç seç';
  return null;
}

/** Toplu katım → kayıtlar. Aktif kaydı olan koyunlar atlanır. */
export function katimKayitlari(
  g: KatimGirdi,
  mevcut: CiftlesmeKaydi[],
  yeniId: () => string,
  simdi: string,
): { kayitlar: CiftlesmeKaydi[]; atlanan: string[] } {
  const aktif = new Set(gorunenler(mevcut).filter(aktifMi).map((k) => k.koyunId));
  const atlanan: string[] = [];
  const kayitlar: CiftlesmeKaydi[] = [];
  const sg = g.sungerGun ?? VARSAYILAN_SUNGER_GUN;
  for (const koyunId of [...new Set(g.koyunIds)]) {
    if (aktif.has(koyunId)) {
      atlanan.push(koyunId);
      continue;
    }
    kayitlar.push({
      id: yeniId(),
      koyunId,
      kocId: g.kocId,
      yontem: g.yontem,
      sungerTakma: g.yontem === 'sunger' ? g.tarih : null,
      sungerGun: g.yontem === 'sunger' ? sg : undefined,
      katimTarih: g.yontem === 'sunger' ? sungerdenKatim(g.tarih, sg) : g.tarih,
      gebelikGun: g.gebelikGun ?? VARSAYILAN_GEBELIK_GUN,
      ultrason: null,
      dogum: null,
      not: g.not?.trim() || undefined,
      olusturma: simdi,
    });
  }
  return { kayitlar, atlanan };
}

export type Hatirlatma = {
  tur: 'sunger-cikar' | 'ultrason' | 'dogum' | 'gecikti';
  tarih: string;
  kayitId: string;
  koyunId: string;
};

/** Kayıtlardan tarihli hatırlatmalar (takvim tümünü, görevler yakın olanları gösterir) */
export function hatirlatmalar(l: CiftlesmeKaydi[], bugun: string): Hatirlatma[] {
  const out: Hatirlatma[] = [];
  for (const k of gorunenler(l)) {
    if (!aktifMi(k)) continue;
    const cikis = sungerCikis(k);
    if (k.yontem === 'sunger' && cikis && bugun <= k.katimTarih) out.push({ tur: 'sunger-cikar', tarih: cikis, kayitId: k.id, koyunId: k.koyunId });
    if (!k.ultrason) out.push({ tur: 'ultrason', tarih: ultrasonTarihi(k), kayitId: k.id, koyunId: k.koyunId });
    const bd = beklenenDogum(k);
    out.push({ tur: gunFarki(bd, bugun) > DOGUM_GECIKME_GUN ? 'gecikti' : 'dogum', tarih: bd, kayitId: k.id, koyunId: k.koyunId });
  }
  return out.sort((a, b) => a.tarih.localeCompare(b.tarih));
}

/** Görev listesine girecek olanlar: tarihi gelmiş/geçmiş ya da doğuma ≤14 gün */
export function gorevHatirlatmalari(l: CiftlesmeKaydi[], bugun: string): Hatirlatma[] {
  return hatirlatmalar(l, bugun).filter((h) => {
    const kalan = gunFarki(bugun, h.tarih);
    if (h.tur === 'dogum') return kalan <= DOGUM_HAZIRLIK_GUN;
    if (h.tur === 'ultrason') return kalan <= 0 && kalan > -60;
    if (h.tur === 'sunger-cikar') return kalan <= 1;
    return true;
  });
}

/** Aynı gün + aynı tür hatırlatmaları grupla (toplu katım 30 koyun → 1 satır) */
export function grupla(l: Hatirlatma[]): { tur: Hatirlatma['tur']; tarih: string; koyunIds: string[] }[] {
  const m = new Map<string, { tur: Hatirlatma['tur']; tarih: string; koyunIds: string[] }>();
  for (const h of l) {
    const key = `${h.tur}|${h.tarih}`;
    const g = m.get(key) ?? { tur: h.tur, tarih: h.tarih, koyunIds: [] };
    g.koyunIds.push(h.koyunId);
    m.set(key, g);
  }
  return [...m.values()].sort((a, b) => a.tarih.localeCompare(b.tarih));
}

export const HATIRLATMA_ETIKET: Record<Hatirlatma['tur'], string> = {
  'sunger-cikar': 'Sünger çıkar',
  ultrason: 'Ultrason (gebelik kontrolü)',
  dogum: 'Beklenen doğum',
  gecikti: 'Doğum gecikti',
};

export type UremeOzeti = Record<CiftlesmeDurum, number> & {
  /** gebe / ultrasonu yapılan */
  gebelikOrani: number | null;
  /** doğan kuzu (canlı + ölü) / doğuran koyun */
  kuzuVerimi: number | null;
  canliKuzu: number;
  oluKuzu: number;
};

export function ozet(l: CiftlesmeKaydi[], bugun: string): UremeOzeti {
  const o: UremeOzeti = { sunger: 0, bekleniyor: 0, gebe: 0, bos: 0, dogurdu: 0, gecikti: 0, gebelikOrani: null, kuzuVerimi: null, canliKuzu: 0, oluKuzu: 0 };
  let us = 0;
  let usGebe = 0;
  for (const k of gorunenler(l)) {
    o[durum(k, bugun)] += 1;
    if (k.ultrason) {
      us += 1;
      if (k.ultrason.sonuc === 'gebe') usGebe += 1;
    }
    if (k.dogum) {
      o.canliKuzu += k.dogum.canli;
      o.oluKuzu += k.dogum.olu;
    }
  }
  o.gebelikOrani = us ? usGebe / us : null;
  o.kuzuVerimi = o.dogurdu ? (o.canliKuzu + o.oluKuzu) / o.dogurdu : null;
  return o;
}

/** Doğum formunda ön doldurulacak kuzu sayısı (ultrason ikiz/üçüz dediyse) */
export function beklenenKuzuSayisi(k: CiftlesmeKaydi | null): number {
  const n = k?.ultrason?.sonuc === 'gebe' ? k.ultrason.yavruSayisi ?? 1 : 1;
  return Math.max(1, Math.min(4, n));
}

export function trTarih(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
