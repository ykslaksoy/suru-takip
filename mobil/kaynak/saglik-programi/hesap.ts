/**
 * Bölge + ırk + mod'a göre varsayılan sağlık programı (aşı / ilaç / vitamin rutini). Saf mantık.
 *
 * Yalnızca ASI_PROGRAMI ve VITAMIN_PROGRAMI kataloğundaki kalemler kullanılır (yeni aşı uydurulmaz).
 * Bölgesel/ırk farkları yalnız belgeli olduğu yerde uygulanır; diğer her şey geneldir.
 *
 * Kaynaklar (2026-10 doğrulandı):
 *  [K1] T.C. Tarım ve Orman Bakanlığı HAYGEM Genelge 2025/9 — Trakya (Edirne, Kırklareli, Tekirdağ,
 *       İstanbul ve Çanakkale Avrupa yakası) 27.05.2010'dan beri WOAH “şaptan aşılı ari” korunmuş bölge.
 *  [K2] Bakanlık Genelge 2021/04 — Trakya'da PPR (koyun keçi vebası) aşılaması 2021'de durduruldu
 *       (PPR'dan ari statü için); Anadolu'da PPR aşılaması sürüyor.
 *  [K3] GKGM 2024 aşılama sayıları — küçükbaşta resmi çiçek, PPR, brusella, şap, şarbon aşılamaları.
 *  [K4] Sağlık Bakanlığı HSGM, “Türkiye'de Şarbon Mevcut Durum Raporu” (2007–2019): hayvan şarbonu en çok
 *       Erzurum, Kars, Ankara, Ağrı; insan olguları Doğu ve İç Anadolu'da yoğun.
 *  [K5] Fasciola hepatica: Orta Karadeniz (Samsun/Sinop/Tokat) koyunda %31,4 seroprevalans
 *       (J Microbiol Immunol Infect 2015); Kars %93 (Helminthologia 2014); Van/Tatvan mezbaha çalışmaları.
 *  [K6] Kuzularda beyaz kas hastalığı (Se + E vit. eksikliği) Türkiye'de Güneydoğu, Doğu ve Orta Anadolu'da sık
 *       (Türkiye Klinikleri); Kars toprak/ot selenyumu düşük (Vet J 2002). Özcan & Aytuğ, AÜ Vet Fak.
 *  [K7] Bulaşıcı agalaksi (M. agalactiae) Türkiye'de endemik, Doğu/Güneydoğu'da yoğun, Marmara'da da saptanmış
 *       (Tjvr 2025; Kafkas Univ Vet Fak Derg 2015); Türkiye'de canlı aşı kullanılıyor.
 *  [K8] Kütahya İl Müdürlüğü: kurban sevki öncesi küçükbaşın şap aşısıyla aşılanması.
 */
import { ASI_PROGRAMI, asiKategori } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI } from '@/kaynak/akilli-veteriner/vitamin-programi';

export type Bolge =
  | 'marmara' | 'ege' | 'akdeniz' | 'ic-anadolu' | 'karadeniz' | 'dogu-anadolu' | 'guneydogu-anadolu';
export const BOLGELER: { id: Bolge; ad: string }[] = [
  { id: 'marmara', ad: 'Marmara' },
  { id: 'ege', ad: 'Ege' },
  { id: 'akdeniz', ad: 'Akdeniz' },
  { id: 'ic-anadolu', ad: 'İç Anadolu' },
  { id: 'karadeniz', ad: 'Karadeniz' },
  { id: 'dogu-anadolu', ad: 'Doğu Anadolu' },
  { id: 'guneydogu-anadolu', ad: 'Güneydoğu Anadolu' },
];

export type Irk =
  | 'karacabey-merinosu' | 'kivircik' | 'akkaraman' | 'morkaraman' | 'ivesi' | 'daglic' | 'sakiz'
  | 'karayaka' | 'romanov' | 'melez' | 'diger';
export const IRKLAR: { id: Irk; ad: string; sut?: boolean }[] = [
  { id: 'karacabey-merinosu', ad: 'Karacabey Merinosu' },
  { id: 'kivircik', ad: 'Kıvırcık' },
  { id: 'akkaraman', ad: 'Akkaraman' },
  { id: 'morkaraman', ad: 'Morkaraman' },
  { id: 'ivesi', ad: 'İvesi', sut: true },
  { id: 'daglic', ad: 'Dağlıç' },
  { id: 'sakiz', ad: 'Sakız', sut: true },
  { id: 'karayaka', ad: 'Karayaka' },
  { id: 'romanov', ad: 'Romanov' },
  { id: 'melez', ad: 'Melez' },
  { id: 'diger', ad: 'Diğer' },
];

export const ONERI_ETIKETI = 'Öneridir; bölge veterinerinize danışın';

export type ProgramBolum = 'asi' | 'parazit' | 'vitamin';
export type ProgramAdim = {
  /** = katalog id (programda her kalem bir kez) */
  programId: string;
  bolum: ProgramBolum;
  gunSonra: number;
  tekrarGun: number | null;
  /** Doz kuralı (çoban dili) */
  doz: string;
  neden: string;
  kaynak?: string;
  /** Doluysa yalnız bu padoklardaki kuzulara (parti ırkı) */
  padoklar?: string[];
};

export type UretimAyari = {
  modId: string;
  bolge: Bolge | null;
  il?: string;
  irk: Irk | null;
  /** padok → ırk (parti ırkı çiftlik ırkını ezer) */
  partiIrk?: Record<string, Irk>;
};

const TRAKYA_KESIN = ['edirne', 'kirklareli', 'tekirdag'];
const TRAKYA_YAKA = ['istanbul', 'canakkale'];
const SUT_MODLARI = ['mod4', 'mod5', 'mod6'];
const BESI_MODLARI = ['mod1', 'mod2', 'mod5'];

export const ASI_ONCELIK = ['karma', 'cicek', 'ppr', 'pasteurella', 'sarbon', 'brusella', 'sap'];

export function normIl(s?: string): string {
  return (s ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .trim();
}

export function trakyaDurumu(bolge: Bolge | null, il?: string): 'trakya' | 'belirsiz' | 'degil' {
  if (bolge !== 'marmara') return 'degil';
  const n = normIl(il);
  if (TRAKYA_KESIN.includes(n)) return 'trakya';
  if (TRAKYA_YAKA.includes(n)) return 'belirsiz';
  return 'degil';
}

export function katalogBolum(id: string): ProgramBolum | null {
  const p = ASI_PROGRAMI.find((x) => x.id === id);
  if (p) return asiKategori(p) === 'parazit' ? 'parazit' : 'asi';
  if (VITAMIN_PROGRAMI.some((v) => v.id === id)) return 'vitamin';
  return null;
}

export function katalogAd(id: string): string {
  return ASI_PROGRAMI.find((x) => x.id === id)?.ad ?? VITAMIN_PROGRAMI.find((v) => v.id === id)?.ad ?? id;
}

export function varsayilanDoz(id: string): string {
  const p = ASI_PROGRAMI.find((x) => x.id === id);
  if (p) {
    const yer = p.uygulamaYeri ? ` · ${p.uygulamaYeri}` : '';
    return p.mlHayvan ? `Her kuzuya ${String(p.mlHayvan).replace('.', ',')} ml${yer}` : `Prospektüse göre${yer}`;
  }
  return 'Prospektüse göre';
}

function katalogTekrar(id: string): number | null {
  const p = ASI_PROGRAMI.find((x) => x.id === id);
  return p && p.tekrarGun > 0 ? p.tekrarGun : null;
}

/** Mera çıkışı / iç-dış parazit ilkbahar dozu — iklime göre YAKLAŞIK ay (genel uygulama, bölge verisi değil). */
export function ilkbaharParazitAyi(bolge: Bolge | null): string {
  if (bolge === 'akdeniz' || bolge === 'ege' || bolge === 'guneydogu-anadolu') return 'Mart';
  if (bolge === 'karadeniz' || bolge === 'dogu-anadolu') return 'Mayıs';
  return 'Nisan';
}

function irkSut(irk: Irk | null | undefined): boolean {
  return !!IRKLAR.find((i) => i.id === irk)?.sut;
}

function adim(programId: string, gunSonra: number, neden: string, ek?: Partial<ProgramAdim>): ProgramAdim {
  const bolum = katalogBolum(programId);
  if (!bolum) throw new Error(`Katalogda yok: ${programId}`);
  return { programId, bolum, gunSonra, tekrarGun: katalogTekrar(programId), doz: varsayilanDoz(programId), neden, ...ek };
}

/** Bir ırk/bölge/mod için varsayılan adımlar (padok filtresi yok). */
function cekirdek(a: { modId: string; bolge: Bolge | null; il?: string; irk: Irk | null }): ProgramAdim[] {
  const out: ProgramAdim[] = [];
  const besi = BESI_MODLARI.includes(a.modId);
  const sut = SUT_MODLARI.includes(a.modId);
  const damizlik = a.modId !== 'mod1';
  const ay = ilkbaharParazitAyi(a.bolge);
  const parazitTekrar = damizlik ? 180 : null;
  const parazitNeden = damizlik
    ? `İç/dış parazit: ilkbahar (mera çıkışı, ~${ay}) ve sonbahar — yılda 2 kez`
    : 'Girişte iç/dış parazit — Gün 1 paketi';

  // Gün 1 paketi (tüm modlar)
  out.push(adim('ivermektin', 0, parazitNeden, { tekrarGun: parazitTekrar }));
  out.push(adim('albendazol', 0, damizlik ? parazitNeden.replace('İç/dış', 'İç') : 'Girişte iç parazit — Gün 1 paketi', { tekrarGun: parazitTekrar }));
  out.push(adim('karma', 1, 'Birinci öncelik: klostridiyal + pastörella (çelertme, solunum)'));

  // Resmi programlar [K3]
  out.push(adim('cicek', 7, 'Resmi programdaki koyun çiçeği aşısı', { kaynak: 'K3' }));
  const trakya = trakyaDurumu(a.bolge, a.il);
  if (trakya !== 'trakya') {
    out.push(
      adim(
        'ppr',
        7,
        trakya === 'belirsiz'
          ? 'Anadolu yakasında PPR aşısı uygulanır; Avrupa yakasındaysanız (Trakya) PPR aşılaması 2021’de durduruldu — çıkarın'
          : 'Resmi programdaki PPR (koyun keçi vebası) aşısı',
        { kaynak: trakya === 'belirsiz' ? 'K2' : 'K3' },
      ),
    );
  }

  // Şarbon: Doğu ve İç Anadolu [K4]
  if (a.bolge === 'dogu-anadolu' || a.bolge === 'ic-anadolu') {
    out.push(adim('sarbon', 14, 'Şarbon vakalarının yoğun olduğu bölge (Erzurum, Kars, Ağrı, Ankara, Sivas)', { kaynak: 'K4' }));
  }

  // Brusella: damızlık dişiler (resmi program) [K3]
  if (damizlik) {
    out.push(adim('brusella', 90, 'Damızlık dişi kuzular — resmi brusella aşılaması (il müdürlüğü takvimi)', { kaynak: 'K3' }));
  }

  // Şap [K1][K8]
  if (besi) {
    out.push(
      adim(
        'sap',
        21,
        trakya === 'trakya'
          ? 'Trakya şaptan aşılı ari bölge — resmi kampanya takvimine uyun'
          : 'Kurban/sevk öncesi şap aşısı şartı; resmi kampanyaya göre',
        { kaynak: trakya === 'trakya' ? 'K1' : 'K8' },
      ),
    );
  } else {
    out.push(adim('sap', 21, 'Resmi şap kampanyasına göre (il/ilçe müdürlüğü)', { kaynak: trakya === 'trakya' ? 'K1' : 'K3' }));
  }

  // Karaciğer kelebeği: Karadeniz + Doğu Anadolu [K5]
  if (a.bolge === 'karadeniz' || a.bolge === 'dogu-anadolu') {
    out.push(
      adim('triklabendazol', 14, 'Karaciğer kelebeği (Fasciola) yaygın — sulak meralarda sonbahar dozu önemli', {
        kaynak: 'K5',
        tekrarGun: damizlik ? 180 : null,
      }),
    );
  }

  // Selenyum + E vit. [K6]
  const seBolge = a.bolge === 'dogu-anadolu' || a.bolge === 'guneydogu-anadolu' || a.bolge === 'ic-anadolu';
  out.push(
    adim(
      'selen-e',
      0,
      seBolge
        ? 'Beyaz kas hastalığının sık görüldüğü bölge (Se/E vit. eksikliği) — Gün 1, doğumdan önce de tekrar'
        : 'Beyaz kas hastalığı önlemi — Gün 1',
      { kaynak: seBolge ? 'K6' : undefined, tekrarGun: seBolge && damizlik ? 180 : null },
    ),
  );

  // Agalaksi: süt modu veya süt ırkı (damızlık) [K7]
  if (sut || (damizlik && irkSut(a.irk))) {
    out.push(adim('agalaksi', 30, 'Süt veriminde bulaşıcı agalaksi (meme) riski — süt koyunu/ırkı', { kaynak: 'K7' }));
  }
  return out;
}

export function siralaAdimlar(adimlar: ProgramAdim[]): ProgramAdim[] {
  const bolumSira: Record<ProgramBolum, number> = { asi: 1, parazit: 0, vitamin: 2 };
  const asiSira = (id: string) => {
    const i = ASI_ONCELIK.indexOf(id);
    return i < 0 ? ASI_ONCELIK.length : i;
  };
  return [...adimlar].sort(
    (x, y) => bolumSira[x.bolum] - bolumSira[y.bolum] || asiSira(x.programId) - asiSira(y.programId) || x.gunSonra - y.gunSonra,
  );
}

/** Varsayılan program: çiftlik ırkı + farklı ırktaki partiler için ek (padok sınırlı) adımlar. */
export function varsayilanProgram(a: UretimAyari): ProgramAdim[] {
  const ana = cekirdek(a);
  const ids = new Set(ana.map((x) => x.programId));
  const ek = new Map<string, ProgramAdim>();
  for (const [padok, irk] of Object.entries(a.partiIrk ?? {})) {
    if (!irk || irk === a.irk) continue;
    for (const s of cekirdek({ ...a, irk })) {
      if (ids.has(s.programId)) continue;
      const v = ek.get(s.programId);
      if (v) v.padoklar = [...(v.padoklar ?? []), padok];
      else ek.set(s.programId, { ...s, padoklar: [padok], neden: `${s.neden} (parti ırkı)` });
    }
  }
  return siralaAdimlar([...ana, ...ek.values()]);
}

/** Kullanıcı düzenlemeleri */
export type AdimDuzenleme = Partial<Pick<ProgramAdim, 'programId' | 'gunSonra' | 'tekrarGun' | 'doz'>>;
export type ProgramDuzenleme = {
  /** anahtar = varsayılan adımın programId'si */
  degisen: Record<string, AdimDuzenleme>;
  silinen: string[];
  eklenen: ProgramAdim[];
};

export function bosDuzenleme(): ProgramDuzenleme {
  return { degisen: {}, silinen: [], eklenen: [] };
}

export type EtkinAdim = ProgramAdim & { anahtar: string; degisti: boolean; eklendi: boolean; varsayilan: ProgramAdim | null };

/** Varsayılan + düzenlemeler → etkin program. Değişiklikler yeni varsayılana da (bölge/ırk değişince) uygulanır. */
export function etkinProgram(varsayilan: ProgramAdim[], d: ProgramDuzenleme): EtkinAdim[] {
  const out: EtkinAdim[] = [];
  const kullanilan = new Set<string>();
  for (const v of varsayilan) {
    if (d.silinen.includes(v.programId)) continue;
    const deg = d.degisen[v.programId];
    const yeni: ProgramAdim = { ...v, ...(deg ?? {}) };
    if (deg?.programId && deg.programId !== v.programId) {
      const b = katalogBolum(deg.programId);
      if (!b) continue;
      yeni.bolum = b;
    }
    if (kullanilan.has(yeni.programId)) continue;
    kullanilan.add(yeni.programId);
    const degisti = !!deg && (Object.keys(deg) as (keyof AdimDuzenleme)[]).some((k) => deg[k] !== v[k]);
    out.push({ ...yeni, anahtar: v.programId, degisti, eklendi: false, varsayilan: v });
  }
  for (const e of d.eklenen) {
    if (kullanilan.has(e.programId) || !katalogBolum(e.programId)) continue;
    kullanilan.add(e.programId);
    out.push({ ...e, anahtar: `+${e.programId}`, degisti: true, eklendi: true, varsayilan: null });
  }
  return siralaAdimlar(out) as EtkinAdim[];
}

export function adimDuzenle(d: ProgramDuzenleme, a: EtkinAdim, yama: AdimDuzenleme): ProgramDuzenleme {
  if (a.eklendi) {
    return { ...d, eklenen: d.eklenen.map((e) => (`+${e.programId}` === a.anahtar ? { ...e, ...yama, bolum: katalogBolum(yama.programId ?? e.programId) ?? e.bolum } : e)) };
  }
  const onceki = d.degisen[a.anahtar] ?? {};
  const birlesik: AdimDuzenleme = { ...onceki, ...yama };
  if (yama.programId && yama.programId !== a.programId && !('doz' in yama)) birlesik.doz = varsayilanDoz(yama.programId);
  // Varsayılana eşit alanları at
  const v = a.varsayilan!;
  for (const k of Object.keys(birlesik) as (keyof AdimDuzenleme)[]) if (birlesik[k] === v[k]) delete birlesik[k];
  const degisen = { ...d.degisen };
  if (Object.keys(birlesik).length) degisen[a.anahtar] = birlesik;
  else delete degisen[a.anahtar];
  return { ...d, degisen };
}

export function adimVarsayilanaDon(d: ProgramDuzenleme, anahtar: string): ProgramDuzenleme {
  const degisen = { ...d.degisen };
  delete degisen[anahtar];
  return { ...d, degisen, silinen: d.silinen.filter((x) => x !== anahtar) };
}

export function adimSil(d: ProgramDuzenleme, a: EtkinAdim): ProgramDuzenleme {
  if (a.eklendi) return { ...d, eklenen: d.eklenen.filter((e) => `+${e.programId}` !== a.anahtar) };
  return { ...d, silinen: [...new Set([...d.silinen, a.anahtar])] };
}

export function adimEkle(d: ProgramDuzenleme, programId: string, varsayilan: ProgramAdim[]): ProgramDuzenleme {
  // Silinmiş bir varsayılan adımsa geri getir
  if (varsayilan.some((v) => v.programId === programId) && d.silinen.includes(programId)) {
    return { ...d, silinen: d.silinen.filter((x) => x !== programId) };
  }
  const bolum = katalogBolum(programId);
  if (!bolum) return d;
  const yeni: ProgramAdim = { programId, bolum, gunSonra: 0, tekrarGun: katalogTekrar(programId), doz: varsayilanDoz(programId), neden: 'Kendi eklediğin adım' };
  return { ...d, eklenen: [...d.eklenen.filter((e) => e.programId !== programId), yeni] };
}

/** Değiştirilen adım sayısı (silinen + eklenen + değişen) */
export function degisiklikSayisi(d: ProgramDuzenleme): number {
  return Object.keys(d.degisen).length + d.silinen.length + d.eklenen.length;
}

/** Etkin program → mevcut sağlık planı (kalem id'leri) + zamanlama. Takvim/alarmlar bunu okur. */
export function plandanAktar(adimlar: ProgramAdim[]): {
  plan: Record<ProgramBolum, string[]>;
  zaman: Record<string, { gunSonra: number; tekrarGun: number | null; padoklar?: string[] }>;
} {
  const plan: Record<ProgramBolum, string[]> = { asi: [], parazit: [], vitamin: [] };
  const zaman: Record<string, { gunSonra: number; tekrarGun: number | null; padoklar?: string[] }> = {};
  for (const a of adimlar) {
    plan[a.bolum].push(a.programId);
    zaman[a.programId] = { gunSonra: a.gunSonra, tekrarGun: a.tekrarGun, ...(a.padoklar?.length ? { padoklar: a.padoklar } : {}) };
  }
  return { plan, zaman };
}

/** Giriş günü (gün 0–1) adımlarından kayıt şablonu adımları */
export function girisSablonAdimlari(adimlar: ProgramAdim[]): ({ tur: 'tartim' } | { tur: 'asi' | 'vitamin'; programId: string })[] {
  const gun = adimlar.filter((a) => a.gunSonra <= 1 && !a.padoklar?.length);
  return [
    { tur: 'tartim' },
    ...gun.filter((a) => a.bolum !== 'vitamin').map((a) => ({ tur: 'asi' as const, programId: a.programId })),
    ...gun.filter((a) => a.bolum === 'vitamin').map((a) => ({ tur: 'vitamin' as const, programId: a.programId })),
  ];
}

export function ayarFarkli(x: UretimAyari, y: UretimAyari): boolean {
  return (
    x.modId !== y.modId || x.bolge !== y.bolge || normIl(x.il) !== normIl(y.il) || x.irk !== y.irk ||
    JSON.stringify(x.partiIrk ?? {}) !== JSON.stringify(y.partiIrk ?? {})
  );
}
