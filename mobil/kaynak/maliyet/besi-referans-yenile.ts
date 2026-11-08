/**
 * t366u/t368u — sunucu proxy + istemci depo; otomatik katman ayrı.
 */
import type { PiyasaDepoDurum, PiyasaFiyatKaydi } from './besi-piyasa-kayit';
import { gomuluPiyasaKayitlari, piyasaKayitOku } from './besi-piyasa-kayit';
import type { FiyatReferansTablosu } from './fiyat-referans';
import { FIYAT_REFERANS_TABLOSU } from './fiyat-referans';
import { fiyatReferansDepoOku, fiyatReferansDepoYaz } from './fiyat-referans-depo';
import {
  parseTobbOtKuzusuHtml,
  parseUkonKuzuHtml,
  parseUskYemHtml,
} from './besi-referans-parse';
import { referansSyncMetaYaz, referansSyncMetaOku } from './besi-referans-sync-meta';
import type { ReferansSenkronNeden } from './besi-referans-sync-meta';

export type ReferansYenileApiGovde = {
  ok: boolean;
  alinmaTarihi: string;
  yenilemeSonuc: string;
  parse: {
    tobb: ReturnType<typeof parseTobbOtKuzusuHtml>;
    ukon: ReturnType<typeof parseUkonKuzuHtml>;
    usk: ReturnType<typeof parseUskYemHtml>;
  };
  uyari: string[];
  iz: string[];
  otomatik: Record<string, boolean>;
  kaynaklar: Record<string, string>;
  kaynakIslemTarihleri?: Record<string, string | null>;
  zamanlama?: Record<string, unknown>;
};

const PIYASA_KEY = 'sy_besi_piyasa_kayit_v1';

export function besiReferansApiUrl(): string | null {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/besi/referans-yenile`;
  }
  return null;
}

function piyasaKaydiGuncelle(map: Map<string, PiyasaFiyatKaydi>, id: string, g: Partial<PiyasaFiyatKaydi>): void {
  const base = map.get(id) ?? gomuluPiyasaKayitlari().find((k) => k.id === id);
  if (!base) return;
  map.set(id, {
    ...base,
    ...g,
    id,
    durum: g.durum ?? 'önbellek',
    alinmaTarihi: g.alinmaTarihi ?? base.alinmaTarihi,
    gelecekGarantiYok: true,
  });
}

export function piyasaKayitlariniParseIleGuncelle(
  kayitlar: PiyasaFiyatKaydi[],
  api: ReferansYenileApiGovde,
  alinma: string,
): PiyasaFiyatKaydi[] {
  const gomulu = gomuluPiyasaKayitlari();
  const map = new Map<string, PiyasaFiyatKaydi>();
  for (const k of gomulu) map.set(k.id, { ...k });
  for (const k of kayitlar) {
    const mevcut = map.get(k.id);
    if (mevcut && k.durum === 'manuel') map.set(k.id, k);
    else if (mevcut && k.alinmaTarihi > mevcut.alinmaTarihi) map.set(k.id, { ...mevcut, ...k });
  }

  const tobb = api.parse.tobb;
  if (tobb.ok) {
    for (const s of tobb.veri) {
      const id = s.borsaKod === 'edirne' ? 'tobb-edirne-kasaplik-kuzu' : 'tobb-gaziantep-kasaplik-kuzu';
      if (s.ortalama == null) continue;
      piyasaKaydiGuncelle(map, id, {
        deger: s.ortalama,
        min: s.min,
        max: s.max,
        islemTarihi: s.islemTarihi,
        alinmaTarihi: alinma,
        durum: 'önbellek',
        not: `TOBB canlı parse · ${s.borsaAd}`,
      });
    }
  }

  const ukon = api.parse.ukon;
  if (ukon.ok) {
    const tarih = ukon.veri.islemTarihi;
    for (const b of ukon.veri.bolgeler) {
      const base = map.get(b.bolgeId) ?? gomulu.find((x) => x.id === b.bolgeId);
      piyasaKaydiGuncelle(map, b.bolgeId, {
        etiket: base?.etiket ?? `UKON ${b.bolge}`,
        kategori: 'karkas_kg',
        bolge: 'ukon',
        deger: b.kuzuKg,
        min: b.kuzuKg,
        max: b.kuzuKg,
        islemTarihi: tarih,
        alinmaTarihi: alinma,
        durum: 'önbellek',
        birim: 'TL/kg',
        kaynakAd: 'UKON haftalık fiyat',
        kaynakUrl: api.kaynaklar?.ukon ?? 'https://www.ukon.org.tr/fiyatlar',
        not: 'Yağsız kuzu karkas — canlı kg değil',
      });
    }
  }

  return [...map.values()];
}

export function yemTablosunuParseIleGuncelle(
  tablo: FiyatReferansTablosu,
  api: ReferansYenileApiGovde,
  alinma: string,
): FiyatReferansTablosu {
  const usk = api.parse.usk;
  if (!usk.ok) return tablo;
  const kalemler = tablo.kalemler.map((k) => {
    const hit = usk.veri.find((u) => u.id === k.id || (u.id === 'saman-bugday' && k.id === 'saman-bugday'));
    if (!hit || hit.fiyat == null) return k;
    const veriTarihi =
      hit.veriAyi && hit.veriYili ? `${hit.veriYili}-${ayIndeks(hit.veriAyi)}-01` : k.veriTarihi;
    return {
      ...k,
      fiyat: hit.fiyat,
      kaynakAd: 'Ulusal Süt Konseyi (USK) aylık ort.',
      kaynakUrl: api.kaynaklar?.usk ?? k.kaynakUrl,
      veriTarihi,
      not: `USK ${hit.veriAyi ?? ''} ${hit.veriYili} — besi yemi ayrı kaynak`,
    };
  });
  return { ...tablo, surum: alinma, alinmaTarihi: alinma, kalemler };
}

function ayIndeks(ay: string): string {
  const map: Record<string, string> = {
    Ocak: '01',
    Şubat: '02',
    Mart: '03',
    Nisan: '04',
    Mayıs: '05',
    Haziran: '06',
    Temmuz: '07',
    Ağustos: '08',
    Eylül: '09',
    Ekim: '10',
    Kasım: '11',
    Aralık: '12',
  };
  return map[ay] ?? '09';
}

async function apiYenile(force: boolean): Promise<ReferansYenileApiGovde | null> {
  const base = besiReferansApiUrl();
  if (!base) return null;
  const url = force ? `${base}?force=1` : base;
  try {
    const r = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    return (await r.json()) as ReferansYenileApiGovde;
  } catch {
    return null;
  }
}

export type ReferansYenileSonuc = {
  piyasa: { kayitlar: PiyasaFiyatKaydi[]; depo: PiyasaDepoDurum };
  yemTablo: FiyatReferansTablosu;
  iz: string[];
  kaynakDurum: string;
};

function syncMetaFromApi(api: ReferansYenileApiGovde | null, basarili: boolean, durum: string): void {
  const onceki = referansSyncMetaOku();
  const now = new Date().toISOString();
  referansSyncMetaYaz({
    ...onceki,
    sonDenemeIso: now,
    sonBasariliIso: basarili ? now : onceki.sonBasariliIso,
    sonCekimIso: basarili ? now : onceki.sonCekimIso,
    sonSonuc: basarili ? 'ok' : 'bayat',
    kaynakIslemTarihleri: { ...onceki.kaynakIslemTarihleri, ...(api?.kaynakIslemTarihleri ?? {}) },
    hataMesaji: basarili ? null : durum,
    atlanmaNedeni: null,
    sonNeden: onceki.sonNeden,
  });
}

/** Gerçek ağ + depo yazımı (TTL kontrolü yok). */
export async function besiReferanslariYenileAg(opts?: { force?: boolean }): Promise<ReferansYenileSonuc> {
  const { kayitlar: onceki, depo: eskiDepo } = piyasaKayitOku();
  const yemOnce = fiyatReferansDepoOku();
  const api = await apiYenile(opts?.force === true);
  const now = new Date().toISOString().slice(0, 10);
  const iz: string[] = [];

  if (!api || !api.ok) {
    const uyari = [
      ...(eskiDepo.uyari ?? []),
      api
        ? `Kısmi/başarısız yenileme: ${(api.uyari ?? []).join('; ') || 'parse hatası'}`
        : 'Sunucu proxy erişilemedi — son önbellek/gömülü kullanılıyor (bayat olabilir).',
    ];
    const depo: PiyasaDepoDurum = {
      sonYenileme: eskiDepo.sonYenileme ?? now,
      yenilemeSonuc: 'bayat',
      uyari,
    };
    const durum = 'Son iyi veri korundu; otomatik yenileme başarısız.';
    syncMetaFromApi(api, false, durum);
    return {
      piyasa: { kayitlar: onceki, depo },
      yemTablo: yemOnce,
      iz: api?.iz ?? ['api:fail'],
      kaynakDurum: durum,
    };
  }

  iz.push(...(api.iz ?? []));
  if (api.zamanlama?.sunucuCacheHit) iz.push('sunucu:cache_hit');
  const piyasaKayit = piyasaKayitlariniParseIleGuncelle(onceki, api, api.alinmaTarihi || now);
  const yemTablo = yemTablosunuParseIleGuncelle(yemOnce, api, api.alinmaTarihi || now);

  const sonuc: PiyasaDepoDurum['yenilemeSonuc'] =
    api.yenilemeSonuc === 'ag_ok' ? 'önbellek_ok' : api.yenilemeSonuc === 'kısmi' ? 'bayat' : 'hata';

  const depo: PiyasaDepoDurum = {
    sonYenileme: now,
    yenilemeSonuc: sonuc,
    uyari: [
      ...(api.uyari ?? []),
      'Balıkesir PDF otomatik değil — Ağu/Eyl bülteni bayat kalır.',
      'Besi yemi: TZOB/gömülü; USK yalnız yonca/saman.',
    ],
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PIYASA_KEY, JSON.stringify({ kayitlar: piyasaKayit, depo }));
  }
  fiyatReferansDepoYaz(yemTablo, { sonYenileme: now, yenilemeSonuc: sonuc, iz });

  const kaynakDurum = `Yenilendi ${now} · ${sonuc}`;
  syncMetaFromApi(api, sonuc === 'önbellek_ok', kaynakDurum);

  return {
    piyasa: { kayitlar: piyasaKayit, depo },
    yemTablo,
    iz,
    kaynakDurum,
  };
}

/** Manuel veya sarmalayıcı: TTL + dedup. */
export async function besiReferanslariYenile(opts?: {
  force?: boolean;
  neden?: ReferansSenkronNeden;
}): Promise<ReferansYenileSonuc> {
  const { besiReferansOtomatikSenkron } = await import('./besi-referans-otomatik');
  const s = await besiReferansOtomatikSenkron({
    force: opts?.force === true,
    neden: opts?.neden ?? 'manuel',
  });
  return s;
}

export function besiReferanslariFixtureIle(
  tobbHtml: string,
  ukonHtml: string,
  uskHtml: string,
): ReferansYenileSonuc {
  const alinma = new Date().toISOString().slice(0, 10);
  const api: ReferansYenileApiGovde = {
    ok: true,
    alinmaTarihi: alinma,
    yenilemeSonuc: 'ag_ok',
    parse: {
      tobb: parseTobbOtKuzusuHtml(tobbHtml),
      ukon: parseUkonKuzuHtml(ukonHtml),
      usk: parseUskYemHtml(uskHtml),
    },
    uyari: [],
    iz: [],
    otomatik: { tobb: true, ukon: true, usk_yonca_saman: true, balikesir_pdf: false },
    kaynaklar: { tobb: 'fixture', ukon: 'fixture', usk: 'fixture' },
    kaynakIslemTarihleri: {},
  };
  const { kayitlar: onceki } = piyasaKayitOku();
  const piyasaKayit = piyasaKayitlariniParseIleGuncelle(onceki, api, alinma);
  const yemTablo = yemTablosunuParseIleGuncelle(FIYAT_REFERANS_TABLOSU, api, alinma);
  const depo: PiyasaDepoDurum = { sonYenileme: alinma, yenilemeSonuc: 'önbellek_ok', uyari: [] };
  return { piyasa: { kayitlar: piyasaKayit, depo }, yemTablo, iz: [], kaynakDurum: 'fixture' };
}
