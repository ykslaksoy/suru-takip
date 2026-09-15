import { test, type TestModul } from '../cerceve';

const TAKVIM = [
  { tip: 'tartim', programId: 'tartim-giris', gun: 1 },
  { tip: 'parazit', programId: 'ivermektin', gun: 1 },
  { tip: 'parazit', programId: 'albendazol', gun: 1 },
  { tip: 'asi', programId: 'karma', gun: 1 },
  { tip: 'vitamin', programId: 'ad3e', gun: 1 },
  { tip: 'vitamin', programId: 'b-kompleks', gun: 1 },
  { tip: 'vitamin', programId: 'selen-e', gun: 1 },
  { tip: 'vitamin', programId: 'probiyotik', gun: 1 },
  { tip: 'vitamin', programId: 'premiks', gun: 1 },
  { tip: 'tartim', programId: 'tartim-15', gun: 15 },
  { tip: 'asi', programId: 'karma-rapel', gun: 21 },
] as const;

const GIRIS_ASI = ['karma', 'albendazol', 'ivermektin'] as const;
const GIRIS_VIT = ['ad3e', 'b-kompleks', 'selen-e', 'probiyotik', 'premiks'] as const;
const RAPEL = new Set(['karma-rapel']);

type Durum = { yapildi: boolean; programId: string };

function simule(padok: 'A' | 'B' | 'C', tartimSayisi: number, now: Date): Durum[] {
  const padokTamam = padok === 'B' || padok === 'C';
  const girisYapildi = padokTamam;
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
    const tartimGiris = k.programId === 'tartim-giris' && tartimSayisi >= 1;
    const tartim15 = k.programId === 'tartim-15' && tartimSayisi >= 2;
    const yapildi =
      asiParazitYapildi || vitaminYapildi || tartimGiris || tartim15 || padokTamam;
    out.push({ yapildi, programId: k.programId });
  }
  return out;
}

export const padokModul: TestModul = {
  grup: 'Padok A/B/C',
  calistir() {
    const now = new Date();
    const a = simule('A', 1, now);
    const b = simule('B', 2, now);
    const c = simule('C', 5, now);
    const aBekleyen = a.filter((x) => !x.yapildi).map((x) => x.programId);
    const bTamam = b.every((x) => x.yapildi);
    const cTamam = c.every((x) => x.yapildi);

    return [
      test('Padok A/B/C', 'Padok A: T1 yapıldı', a.find((x) => x.programId === 'tartim-giris')!.yapildi),
      test(
        'Padok A/B/C',
        'Padok A: giriş ivermektin bekliyor',
        aBekleyen.includes('ivermektin'),
      ),
      test('Padok A/B/C', 'Padok A: karma rapel bekliyor', aBekleyen.includes('karma-rapel')),
      test('Padok A/B/C', 'Padok A: selen bekliyor', aBekleyen.includes('selen-e')),
      test('Padok A/B/C', 'Padok B: tüm plan yapıldı', bTamam),
      test('Padok A/B/C', 'Padok C: tüm plan yapıldı', cTamam),
      test(
        'Padok A/B/C',
        'Padok B/C giriş kalemleri yapıldı',
        b.filter((x) => GIRIS_ASI.includes(x.programId as (typeof GIRIS_ASI)[number])).every(
          (x) => x.yapildi,
        ),
      ),
    ];
  },
};
