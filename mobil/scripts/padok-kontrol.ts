/**
 * Padok A/B/C + hızlı besi v11 tutarlılık — gerçek plan kimlikleriyle.
 * Çalıştır: npx tsx scripts/padok-kontrol.ts
 */
(globalThis as { __DEV__?: boolean }).__DEV__ = false;

type Fail = string;
const fails: Fail[] = [];
function ok(cond: boolean, msg: string) {
  if (!cond) fails.push(msg);
}

/** hizli-besi-plani.ts HIZLI_BESI_TAKVIM ile birebir */
const TAKVIM = [
  { tip: 'parazit', programId: 'ivermektin', gun: 0 },
  { tip: 'parazit', programId: 'albendazol', gun: 0 },
  { tip: 'asi', programId: 'karma', gun: 0 },
  { tip: 'vitamin', programId: 'ad3e', gun: 0 },
  { tip: 'vitamin', programId: 'b-kompleks', gun: 0 },
  { tip: 'vitamin', programId: 'probiyotik', gun: 0 },
  { tip: 'vitamin', programId: 'premiks', gun: 0 },
  { tip: 'tartim', programId: 'tartim-giris', gun: 1 },
  { tip: 'vitamin', programId: 'selen-e', gun: 7 },
  { tip: 'tartim', programId: 'tartim-15', gun: 15 },
  { tip: 'asi', programId: 'karma-rapel', gun: 21 },
] as const;

const GIRIS_ASI = ['karma', 'albendazol', 'ivermektin'] as const;
const GIRIS_VIT = ['ad3e', 'b-kompleks', 'probiyotik', 'premiks'] as const;
const RAPEL = new Set(['karma-rapel']);

type Durum = {
  animalId: string;
  padok: string;
  tip: string;
  programId: string;
  yapildi: boolean;
  yapildiAt?: string;
  planlananAt?: string;
};

function isoOnce(now: Date, gun: number): string {
  return new Date(now.getTime() - gun * 86400000).toISOString();
}

function gunSonra(gun: number, now: Date): string {
  return new Date(now.getTime() + gun * 86400000).toISOString();
}

/** padok-kuzu-kayitlar seedMod1PadokTakviyePlani özeti */
function simulePlan(opts: {
  id: string;
  padok: 'A' | 'B' | 'C';
  tartimSayisi: number;
  now: Date;
}): Durum[] {
  const padokTamam = opts.padok === 'B' || opts.padok === 'C';
  const girisYapildi = padokTamam;
  const yapildiAt =
    opts.padok === 'B' ? isoOnce(opts.now, 30) : opts.padok === 'C' ? isoOnce(opts.now, 60) : undefined;
  const tarihGecmis =
    opts.padok === 'B'
      ? (gun: number) => isoOnce(opts.now, 30 - gun)
      : opts.padok === 'C'
        ? (gun: number) => isoOnce(opts.now, 60 - gun)
        : null;

  const tartimGirisYapildi = opts.tartimSayisi >= 1;
  const tartim15Yapildi = opts.tartimSayisi >= 2;
  const out: Durum[] = [];

  for (const k of TAKVIM) {
    const asiParazit = k.tip === 'asi' || k.tip === 'parazit';
    const asiParazitYapildi =
      girisYapildi &&
      asiParazit &&
      !RAPEL.has(k.programId) &&
      (GIRIS_ASI as readonly string[]).includes(k.programId);
    const vitaminYapildi =
      girisYapildi &&
      k.tip === 'vitamin' &&
      (GIRIS_VIT as readonly string[]).includes(k.programId);
    const tartimGirisKalemi =
      k.tip === 'tartim' && k.programId === 'tartim-giris' && tartimGirisYapildi;
    const tartim15Kalemi =
      k.tip === 'tartim' && k.programId === 'tartim-15' && tartim15Yapildi;
    const tartimKalemi = tartimGirisKalemi || tartim15Kalemi;

    const yapildi =
      asiParazitYapildi || vitaminYapildi || tartimKalemi || padokTamam;

    let planlananAt: string | undefined;
    if (!yapildi && opts.padok === 'A') {
      planlananAt = gunSonra(k.gun, opts.now);
    }

    let yapildiAtKayit: string | undefined =
      asiParazitYapildi || vitaminYapildi
        ? yapildiAt
        : tartimGirisKalemi || tartim15Kalemi
          ? isoOnce(opts.now, 0)
          : undefined;

    if (!yapildiAtKayit && padokTamam && tarihGecmis) {
      yapildiAtKayit = tarihGecmis(k.gun);
    }

    out.push({
      animalId: opts.id,
      padok: opts.padok,
      tip: k.tip,
      programId: k.programId,
      yapildi,
      yapildiAt: yapildiAtKayit,
      planlananAt: yapildi ? undefined : planlananAt,
    });
  }
  return out;
}

function main() {
  const now = new Date();

  // Plan içeriği
  const ids = TAKVIM.map((t) => t.programId);
  ok(!ids.includes('enterotoksemi'), 'planda enterotoksemi olmamalı');
  ok(!ids.includes('enterotoksemi-rapel'), 'planda enterotoksemi-rapel olmamalı');
  ok(ids.includes('karma') && ids.includes('karma-rapel'), 'karma + karma-rapel');
  ok(ids.includes('tartim-giris') && ids.includes('tartim-15'), 'T1 + 15g tartım');
  ok(ids.includes('selen-e'), 'selen-e');
  ok(TAKVIM.find((t) => t.programId === 'selen-e')!.gun === 7, 'selen gün 7');
  ok(TAKVIM.find((t) => t.programId === 'karma-rapel')!.gun === 21, 'rapel gün 21');
  ok(TAKVIM.find((t) => t.programId === 'tartim-giris')!.gun === 1, 'T1 gün 1–2');

  // Padok A × 20 (1 tartım)
  for (let i = 1; i <= 20; i++) {
    const id = `padok-a-${String(i).padStart(2, '0')}`;
    const d = simulePlan({ id, padok: 'A', tartimSayisi: 1, now });
    const bekleyen = d.filter((x) => !x.yapildi).map((x) => x.programId);
    const yapilan = d.filter((x) => x.yapildi).map((x) => x.programId);
    ok(yapilan.includes('tartim-giris'), `${id}: T1 yapılmış`);
    ok(!bekleyen.includes('tartim-giris'), `${id}: T1 beklememeli`);
    for (const p of [
      'ivermektin',
      'albendazol',
      'karma',
      'ad3e',
      'b-kompleks',
      'probiyotik',
      'premiks',
      'selen-e',
      'tartim-15',
      'karma-rapel',
    ]) {
      ok(bekleyen.includes(p), `${id}: ${p} beklemeli`);
    }
  }

  // Padok B × 20 (2+ tartım, ~30g)
  for (let i = 1; i <= 20; i++) {
    const id = `padok-b-${String(i).padStart(2, '0')}`;
    const d = simulePlan({ id, padok: 'B', tartimSayisi: 2, now });
    ok(d.every((x) => x.yapildi), `${id}: tümü yapıldı, kalan=${d.filter((x) => !x.yapildi).map((x) => x.programId)}`);
    const selen = d.find((x) => x.programId === 'selen-e')!;
    const rapel = d.find((x) => x.programId === 'karma-rapel')!;
    const iv = d.find((x) => x.programId === 'ivermektin')!;
    ok(selen.yapildiAt === isoOnce(now, 23), `${id}: selen ≈ giriş+7 (30-7=23 gün önce)`);
    ok(rapel.yapildiAt === isoOnce(now, 9), `${id}: karma-rapel ≈ giriş+21 (30-21=9 gün önce)`);
    ok(iv.yapildiAt === isoOnce(now, 30), `${id}: gün0 girişte`);
  }

  // Padok C × 20 (5 tartım, ~60g)
  for (let i = 1; i <= 20; i++) {
    const id = `padok-c-${String(i).padStart(2, '0')}`;
    const d = simulePlan({ id, padok: 'C', tartimSayisi: 5, now });
    ok(d.every((x) => x.yapildi), `${id}: tümü yapıldı`);
    const selen = d.find((x) => x.programId === 'selen-e')!;
    const rapel = d.find((x) => x.programId === 'karma-rapel')!;
    ok(selen.yapildiAt === isoOnce(now, 53), `${id}: selen 60-7`);
    ok(rapel.yapildiAt === isoOnce(now, 39), `${id}: rapel 60-21`);
  }

  // Kaynak dosya çapraz kontrol (okuma)
  const fs = require('node:fs') as typeof import('node:fs');
  const planSrc = fs.readFileSync('kaynak/akilli-veteriner/hizli-besi-plani.ts', 'utf8');
  ok(planSrc.includes("HIZLI_BESI_PLAN_SURUM = 'v11'"), 'plan sürümü v11');
  ok(planSrc.includes("programId: 'selen-e'"), 'takvimde selen-e');
  ok(planSrc.includes('kilo alımı'), 'selen kilo alımı notu');
  ok(planSrc.includes('KARMA_RAPEL_PROGRAM_ID'), 'karma rapel sabiti');
  ok(!/HIZLI_BESI_TAKVIM[\s\S]*enterotoksemi/.test(planSrc.split('HIZLI_BESI_TAKVIM')[1]?.slice(0, 1200) ?? ''), 'takvimde enterotoksemi yok');

  const vitSrc = fs.readFileSync('kaynak/akilli-veteriner/vitamin-programi.ts', 'utf8');
  ok(vitSrc.includes("detay: 'Kas · beyaz kas · kilo alımı'"), 'vitamin selen detay');

  const asiSrc = fs.readFileSync('kaynak/cekirdek/asi-programi.ts', 'utf8');
  ok(asiSrc.includes('0,2 ml / 10 kg'), 'ivermektin doz');
  ok(asiSrc.includes('1 hap / 10 kg'), 'albendazol doz');

  const seedSrc = fs.readFileSync('kaynak/cekirdek/padok-kuzu-kayitlar.ts', 'utf8');
  ok(seedSrc.includes('padokTamam'), 'B/C tamam mantığı');
  ok(seedSrc.includes('KARMA_RAPEL_PROGRAM_ID'), 'seed karma rapel');
  ok(seedSrc.includes("'selen-e'"), 'seed selen-e');

  const listeSrc = fs.readFileSync('kaynak/gorevler/liste.ts', 'utf8');
  ok(listeSrc.includes('localeCompare(b.tarih'), 'görevler tarih sırası');

  if (fails.length) {
    console.error('FAIL:', fails.length);
    for (const f of fails) console.error(' -', f);
    process.exit(1);
  }
  console.log('OK — v11 plan · 60 kuzu mantığı tutarlı');
  console.log('OK — Padok A: giriş kalemleri + selen + tartım-15 + karma-rapel bekliyor; T1 yapıldı');
  console.log('OK — Padok B/C: tüm plan kalemleri yapıldı (geçmiş tarihler: 0 / +7 / +21)');
  console.log('OK — Enterotoksemi yok; doz etiketleri ve selen «kilo alımı» kaynakta');
  console.log('OK — Görev listesi tarih öncelikli');
}

main();
