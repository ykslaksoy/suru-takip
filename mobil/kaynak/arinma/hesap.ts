/**
 * İlaç arınma süresi (et — kesim yasağı) — saf hesap.
 * Her katalog ilacı / aşısı için et arınma günü. Katalogda prospektüs değeri yok;
 * varsayılanlar tipik prospektüs değerlerine göre "tahmini"dir, kullanıcı düzeltebilir.
 * Kayıttaki elle girilen bekletme günü (withdrawalDays) ile tablo değerinin BÜYÜĞÜ esas alınır.
 */

export type ArinmaKaynak = 'tahmini' | 'kullanici';

export type ArinmaTanim = {
  id: string;
  ad: string;
  grup: 'ilac' | 'asi' | 'takviye';
  /** Normalize edilmiş eşleşme anahtarları (ilaç adı, etken madde, ticari ad) */
  anahtarlar: string[];
  /** Varsayılan et arınma günü (tahmini) */
  gun: number;
};

const t = (id: string, ad: string, grup: ArinmaTanim['grup'], gun: number, anahtarlar: string[] = []): ArinmaTanim => ({
  id,
  ad,
  grup,
  gun,
  anahtarlar: [ad, ...anahtarlar].map(norm),
});

export function norm(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .trim();
}

/** Varsayılan tablo — stok kataloğundaki ilaç / aşı / enjeksiyon takviyeleri */
export const ARINMA_TABLOSU: ArinmaTanim[] = [
  t('albendazol', 'Albendazol', 'ilac', 10, ['valbazen']),
  t('ivermectin', 'İvermektin', 'ilac', 42, ['ivermectin', 'ivomec']),
  t('doramectin', 'Doramektin', 'ilac', 70, ['doramectin', 'dectomax']),
  t('levamizol', 'Levamizol', 'ilac', 10, ['levamisol']),
  t('oksiklozanid', 'Oksiklozanid', 'ilac', 14, ['oxyclozanide', 'zanil']),
  t('triklabendazol', 'Triklabendazol', 'ilac', 56, ['triclabendazol', 'fasinex']),
  t('oksiteirasiklin', 'Oksitetrasiklin', 'ilac', 28, ['oksiteirasiklin', 'oxytetracycline', 'terramycin']),
  t('penisilin', 'Penisilin', 'ilac', 21, ['penicillin', 'pen-strep', 'penstrep']),
  t('enrofloksasin', 'Enrofloksasin', 'ilac', 14, ['enrofloxacin', 'baytril']),
  t('florfenikol', 'Florfenikol', 'ilac', 39, ['florfenicol', 'nuflor']),
  t('meloksikam', 'Meloksikam', 'ilac', 11, ['meloxicam']),
  t('fluniksin', 'Fluniksin meglumin', 'ilac', 28, ['fluniksin', 'flunixin']),
  t('deksametazon', 'Deksametazon', 'ilac', 8, ['dexamethasone']),
  t('oksitosin', 'Oksitosin', 'ilac', 0, ['oxytocin']),
  t('kalsiyum-boroglukonat', 'Kalsiyum boroglukonat', 'ilac', 0),
  t('glukoz', 'Glukoz solüsyonu', 'ilac', 0),
  t('yara-spreyi', 'Yara spreyi / antiseptik', 'ilac', 0),
  t('goz-merhemi', 'Göz merhemi', 'ilac', 0),
  t('ayak-banyosu', 'Ayak banyosu solüsyonu', 'ilac', 0),
  t('diyare', 'İshal destek (elektrolit)', 'ilac', 0),
  t('karma', 'Karma aşı', 'asi', 0),
  t('pasteurella', 'Pastörella aşısı', 'asi', 0, ['pastorella', 'pasteurella']),
  t('clostridial', 'Klostridiyal aşı', 'asi', 0, ['clostridial']),
  t('enterotoksemi', 'Enterotoksemi aşısı', 'asi', 0, ['enterotoksemi', 'celertme']),
  t('septisemi', 'Septisemi aşısı', 'asi', 0, ['septisemi']),
  t('ektima', 'Ektima (ORF) aşısı', 'asi', 0, ['ektima', 'orf']),
  t('tetanos', 'Tetanoz aşısı', 'asi', 0, ['tetanoz']),
  t('ppr', 'Veba (PPR) aşısı', 'asi', 0, ['ppr']),
  t('cicek', 'Çiçek aşısı', 'asi', 0),
  t('sap', 'Şap aşısı', 'asi', 0),
  t('brusella', 'Brusella aşısı', 'asi', 0, ['brusella']),
  t('sarbon', 'Şarbon aşısı', 'asi', 0),
  t('agalaksi', 'Agalaksi aşısı', 'asi', 0, ['agalaksi']),
  t('topallik', 'Ayak (topallık) aşısı', 'asi', 0, ['topallik']),
  t('selen-e', 'Selenyum + E vitamini', 'takviye', 0, ['selenyum', 'selen-e']),
  t('vitamin-ad3e', 'Vitamin A-D3-E', 'takviye', 0, ['ad3e']),
  t('vitamin-b', 'B kompleks vitamin', 'takviye', 0, ['b kompleks']),
];

/** Kullanıcı düzeltmeleri: ilaç id → gün */
export type ArinmaAyar = Record<string, number>;

export function ilacGunu(tanim: ArinmaTanim, ayar: ArinmaAyar = {}): { gun: number; kaynak: ArinmaKaynak } {
  const k = ayar[tanim.id];
  if (typeof k === 'number' && k >= 0) return { gun: k, kaynak: 'kullanici' };
  return { gun: tanim.gun, kaynak: 'tahmini' };
}

export type IlacEslesme = { tanim: ArinmaTanim; gun: number; kaynak: ArinmaKaynak };

/** Metindeki (ilaç adı / tedavi) tüm eşleşen ilaçlar; en uzun arınma önce */
export function metindenIlaclar(metin: string, ayar: ArinmaAyar = {}): IlacEslesme[] {
  const n = norm(metin);
  if (!n) return [];
  const out: IlacEslesme[] = [];
  for (const tanim of ARINMA_TABLOSU) {
    if (tanim.anahtarlar.some((a) => a.length >= 3 && n.includes(a))) out.push({ tanim, ...ilacGunu(tanim, ayar) });
  }
  return out.sort((a, b) => b.gun - a.gun);
}

export type ArinmaKaydi = {
  id: string;
  animalId: string;
  recordedAt: string;
  medicine: string;
  treatment: string;
  withdrawalDays: number;
};

export type KayitArinma = { gun: number; ilac: string; kaynak: ArinmaKaynak | 'kayit' };

/** Tek kaydın etkin arınma günü: kayıttaki elle gün ile tablo değerinin büyüğü */
export function kayitArinmasi(r: ArinmaKaydi, ayar: ArinmaAyar = {}): KayitArinma | null {
  const eslesme = metindenIlaclar(`${r.medicine} ${r.treatment}`, ayar)[0];
  const elle = Number(r.withdrawalDays) || 0;
  if (eslesme && eslesme.gun >= elle && eslesme.gun > 0) return { gun: eslesme.gun, ilac: eslesme.tanim.ad, kaynak: eslesme.kaynak };
  if (elle > 0) return { gun: elle, ilac: eslesme?.tanim.ad ?? (r.medicine || r.treatment || 'İlaç'), kaynak: 'kayit' };
  return null;
}

/** YYYY-MM-DD (yerel tarih kısmı) */
export function gunKismi(tarih: string): string {
  return tarih.slice(0, 10);
}

export function gunEkle(tarih: string, gun: number): string {
  const [y, m, d] = gunKismi(tarih).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + gun));
  return dt.toISOString().slice(0, 10);
}

export function gunFarki(a: string, b: string): number {
  const ta = Date.parse(`${gunKismi(a)}T00:00:00Z`);
  const tb = Date.parse(`${gunKismi(b)}T00:00:00Z`);
  return Math.round((tb - ta) / 86400000);
}

export type HayvanArinma = {
  animalId: string;
  /** Bu tarihe kadar (dahil değil) kesilemez — bu tarihten itibaren serbest */
  bitis: string;
  ilac: string;
  gun: number;
  kaynak: ArinmaKaynak | 'kayit';
  kayitId: string;
  uygulama: string;
  kalanGun: number;
};

/**
 * Hayvan başına en geç biten arınma. `tarih` gününde hâlâ süren arınmalar döner
 * (bitis > tarih). Satılan / ölen hayvanlar hariç tutulabilir (aktifIds).
 */
export function hayvanArinmalari(
  kayitlar: ArinmaKaydi[],
  tarih: string,
  ayar: ArinmaAyar = {},
  aktifIds?: Set<string>,
): HayvanArinma[] {
  const enGec = new Map<string, HayvanArinma>();
  for (const r of kayitlar) {
    if (aktifIds && !aktifIds.has(r.animalId)) continue;
    const a = kayitArinmasi(r, ayar);
    if (!a) continue;
    const bitis = gunEkle(r.recordedAt, a.gun);
    if (bitis <= gunKismi(tarih)) continue;
    const onceki = enGec.get(r.animalId);
    if (!onceki || bitis > onceki.bitis) {
      enGec.set(r.animalId, {
        animalId: r.animalId,
        bitis,
        ilac: a.ilac,
        gun: a.gun,
        kaynak: a.kaynak,
        kayitId: r.id,
        uygulama: gunKismi(r.recordedAt),
        kalanGun: gunFarki(tarih, bitis),
      });
    }
  }
  return [...enGec.values()].sort((a, b) => a.bitis.localeCompare(b.bitis));
}

/** Satış / kesim kontrolü: seçilenlerden çıkış gününde arınmada olanlar */
export function satistaArinmadakiler(seciliIds: Iterable<string>, arinmalar: HayvanArinma[]): HayvanArinma[] {
  const s = new Set(seciliIds);
  return arinmalar.filter((a) => s.has(a.animalId));
}

export function tarihTR(iso: string): string {
  const [y, m, d] = gunKismi(iso).split('-');
  return `${d}.${m}.${y}`;
}

export function kesilemezMetni(a: Pick<HayvanArinma, 'bitis' | 'ilac' | 'kalanGun'>): string {
  return `🚫 ${tarihTR(a.bitis)} tarihine kadar kesilemez · ${a.ilac} · ${a.kalanGun} gün`;
}
