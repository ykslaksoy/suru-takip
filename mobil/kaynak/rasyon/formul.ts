/**
 * En düşük maliyetli rasyon (elimdeki malzemeler) + besin kontrolü + hazır rasyonlar.
 * Gereksinim: calculateRation (kuru madde, hedef ham protein) + dönem başına enerji yoğunluğu ve kaba yem payı.
 * Enerji yoğunlukları NRC (2007) küçükbaş gereksinim tablolarının yaklaşık değerleridir.
 */
import { calculateRation, type RationPhase } from './hesapla';
import { simpleks, type Kisit } from './simpleks';
import { standartYem, OZEL_YEM, type YemBesin } from './yem-besin';

export type Gereksinim = { kmKg: number; meMJkg: number; hpYuzde: number; kabaMin: number; kabaMaks: number; caPMin: number; caPMaks: number; yemKg: number };

/** ME yoğunluğu, MJ/kg KM */
const ME: Record<RationPhase, number> = { lamb_fattening: 11.0, maintenance: 8.8, pregnant: 9.6, lactating: 10.5, dry: 8.5 };
const KABA: Record<RationPhase, [number, number]> = { lamb_fattening: [0.15, 0.45], maintenance: [0.5, 1], pregnant: [0.4, 0.9], lactating: [0.35, 0.8], dry: [0.6, 1] };

export function gereksinim(ortKg: number, faz: RationPhase): Gereksinim {
  const r = calculateRation({ liveWeightKg: ortKg, count: 1, phase: faz, forageQuality: 'medium' });
  const [kabaMin, kabaMaks] = KABA[faz];
  return { kmKg: r.dmRequirementKg, meMJkg: ME[faz], hpYuzde: r.proteinPercent, kabaMin, kabaMaks, caPMin: 1.5, caPMaks: 2.5, yemKg: r.dailyFeedKg };
}

export type Malzeme = YemBesin & { fiyatKg: number; stockId?: string; tahmini?: boolean };
export type FormulKalemi = { ad: string; stockId?: string; kgBasGun: number; kmKg: number; tlBasGun: number };
export type KontrolSatiri = { ad: string; hedef: string; deger: string; tamam: boolean };
export type FormulSonuc = { kalemler: FormulKalemi[]; tlBasGun: number; kontrol: KontrolSatiri[]; uyarilar: string[]; uygun: boolean };

const y2 = (n: number) => Math.round(n * 100) / 100;

export function malzemeOlustur(ad: string, fiyatKg: number, stockId?: string): Malzeme {
  const s = standartYem(ad);
  const tahmini = !(fiyatKg > 0) && !!s?.tahminiFiyat;
  return { ...(s ?? { ...OZEL_YEM, ad }), ad, fiyatKg: tahmini ? s!.tahminiFiyat! : fiyatKg, stockId, tahmini };
}

/** Kalemlerin (yedirilen kg) besin kontrolü */
export function besinKontrol(kalemler: { m: YemBesin; kg: number }[], g: Gereksinim): KontrolSatiri[] {
  let km = 0, me = 0, hp = 0, kaba = 0, ca = 0, p = 0;
  for (const { m, kg } of kalemler) {
    const x = (kg * m.km) / 100;
    km += x; me += m.me * x; hp += (m.hp / 100) * x; ca += (m.ca / 100) * x; p += (m.p / 100) * x;
    if (m.kaba) kaba += x;
  }
  const meD = km ? me / km : 0;
  const hpY = km ? (100 * hp) / km : 0;
  const kp = km ? kaba / km : 0;
  const cap = p ? ca / p : ca > 0 ? Infinity : 0;
  const tol = 0.97;
  return [
    { ad: 'Kuru madde', hedef: `${y2(g.kmKg)} kg`, deger: `${y2(km)} kg`, tamam: km >= g.kmKg * tol && km <= g.kmKg * 1.1 },
    { ad: 'Enerji (ME)', hedef: `≥ ${g.meMJkg} MJ/kg KM`, deger: `${y2(meD)} MJ/kg KM`, tamam: meD >= g.meMJkg * tol },
    { ad: 'Ham protein', hedef: `≥ %${g.hpYuzde}`, deger: `%${y2(hpY)}`, tamam: hpY >= g.hpYuzde * tol },
    { ad: 'Kaba yem oranı', hedef: `%${Math.round(g.kabaMin * 100)}–${Math.round(g.kabaMaks * 100)}`, deger: `%${Math.round(kp * 100)}`, tamam: kp >= g.kabaMin - 0.01 && kp <= g.kabaMaks + 0.01 },
    { ad: 'Ca:P', hedef: `${g.caPMin}–${g.caPMaks} : 1`, deger: Number.isFinite(cap) ? `${y2(cap)} : 1` : '—', tamam: cap >= g.caPMin - 0.05 && cap <= g.caPMaks + 0.05 },
  ];
}

const CEZA = 1e4;

/** En düşük maliyetli formül. Karşılanamayan kısıt cezalı açık değişkenle gevşetilir ve uyarı olarak döner. */
export function enUcuzRasyon(malz: Malzeme[], g: Gereksinim): FormulSonuc {
  const n = malz.length;
  if (!n) return { kalemler: [], tlBasGun: 0, kontrol: [], uyarilar: ['En az bir yem seç'], uygun: false };
  // değişkenler: x_j (kg KM), sonra açıklar: dME, dHP, dKabaMin, dKabaMaks, dCaPmin, dCaPmaks
  const N = n + 6;
  const c = new Array(N).fill(0);
  malz.forEach((m, j) => (c[j] = m.km > 0 ? m.fiyatKg / (m.km / 100) : 0));
  for (let k = n; k < N; k++) c[k] = CEZA;
  const sat = (f: (m: Malzeme) => number, ek: Record<number, number> = {}) => {
    const a = malz.map(f).concat(new Array(6).fill(0));
    for (const [k, v] of Object.entries(ek)) a[n + +k] = v;
    return a;
  };
  const D = g.kmKg;
  const K: Kisit[] = [
    { a: sat(() => 1), tip: '=', b: D },
    { a: sat((m) => m.me, { 0: 1 }), tip: '>=', b: g.meMJkg * D },
    { a: sat((m) => m.hp / 100, { 1: 1 }), tip: '>=', b: (g.hpYuzde / 100) * D },
    { a: sat((m) => (m.kaba ? 1 : 0), { 2: 1 }), tip: '>=', b: g.kabaMin * D },
    { a: sat((m) => (m.kaba ? 1 : 0), { 3: -1 }), tip: '<=', b: g.kabaMaks * D },
    { a: sat((m) => (m.ca - g.caPMin * m.p) / 100, { 4: 1 }), tip: '>=', b: 0 },
    { a: sat((m) => (g.caPMaks * m.p - m.ca) / 100, { 5: 1 }), tip: '>=', b: 0 },
  ];
  malz.forEach((m, j) => {
    const e = new Array(N).fill(0);
    e[j] = 1;
    if (m.sabitPay != null) K.push({ a: e, tip: '=', b: m.sabitPay * D });
    else if (m.maksPay != null) K.push({ a: e, tip: '<=', b: m.maksPay * D });
  });
  const r = simpleks(c, K);
  if (r.durum !== 'optimal') return { kalemler: [], tlBasGun: 0, kontrol: [], uyarilar: ['Seçilen yemlerle rasyon kurulamadı'], uygun: false };
  const kalemler: FormulKalemi[] = [];
  malz.forEach((m, j) => {
    const km = r.x[j];
    if (km < 1e-4) return;
    const kg = m.km > 0 ? km / (m.km / 100) : 0;
    kalemler.push({ ad: m.ad, stockId: m.stockId, kgBasGun: Math.round(kg * 1000) / 1000, kmKg: y2(km), tlBasGun: y2(kg * m.fiyatKg) });
  });
  const kontrol = besinKontrol(kalemler.map((k) => ({ m: malz.find((x) => x.ad === k.ad)!, kg: k.kgBasGun })), g);
  const uyarilar: string[] = [];
  const acik = r.x.slice(n);
  if (acik[0] > 1e-4) uyarilar.push('Enerji hedefi karşılanamıyor — arpa/mısır gibi enerji yemi ekle.');
  if (acik[1] > 1e-5) uyarilar.push('Protein hedefi karşılanamıyor — soya/ayçiçeği küspesi ekle.');
  if (acik[2] > 1e-4) uyarilar.push('Kaba yem yetersiz — yonca, saman ya da silaj ekle.');
  if (acik[3] > 1e-4) uyarilar.push('Kaba yem oranı fazla — kesif yem ekle.');
  if (acik[4] > 1e-6) uyarilar.push('Ca:P düşük — mermer tozu (kireçtaşı) ekle.');
  if (acik[5] > 1e-6) uyarilar.push('Ca:P yüksek — fosforlu yem (kepek) ekle.');
  return { kalemler, tlBasGun: y2(kalemler.reduce((s, k) => s + k.tlBasGun, 0)), kontrol, uyarilar, uygun: uyarilar.length === 0 && kontrol.every((k) => k.tamam) };
}

/** Hazır rasyonlar — yedirilen hâliyle % karışım (yaygın Türkiye besi uygulaması) */
export type HazirRasyon = { id: string; ad: string; faz: RationPhase; aciklama: string; karisim: { ad: string; yuzde: number }[] };

export const HAZIR_RASYONLAR: HazirRasyon[] = [
  { id: 'besi-baslangic', ad: 'Besi başlangıç', faz: 'lamb_fattening', aciklama: '15–25 kg, ilk 2–3 hafta',
    karisim: [{ ad: 'Arpa', yuzde: 30 }, { ad: 'Mısır', yuzde: 15 }, { ad: 'Soya küspesi', yuzde: 12 }, { ad: 'Ayçiçeği küspesi', yuzde: 8 }, { ad: 'Buğday kepeği', yuzde: 5 }, { ad: 'Yonca kuru otu', yuzde: 28 }, { ad: 'Mermer tozu (kireçtaşı)', yuzde: 1.2 }, { ad: 'Tuz', yuzde: 0.5 }, { ad: 'Vitamin-mineral premiksi', yuzde: 0.3 }] },
  { id: 'besi-buyutme', ad: 'Besi büyütme', faz: 'lamb_fattening', aciklama: '25–35 kg',
    karisim: [{ ad: 'Arpa', yuzde: 35 }, { ad: 'Mısır', yuzde: 15 }, { ad: 'Ayçiçeği küspesi', yuzde: 12 }, { ad: 'Soya küspesi', yuzde: 5 }, { ad: 'Buğday kepeği', yuzde: 5 }, { ad: 'Yonca kuru otu', yuzde: 18 }, { ad: 'Buğday samanı', yuzde: 8 }, { ad: 'Mermer tozu (kireçtaşı)', yuzde: 1.2 }, { ad: 'Tuz', yuzde: 0.5 }, { ad: 'Vitamin-mineral premiksi', yuzde: 0.3 }] },
  { id: 'besi-bitirme', ad: 'Besi bitirme', faz: 'lamb_fattening', aciklama: '35 kg üstü, kesime kadar',
    karisim: [{ ad: 'Arpa', yuzde: 40 }, { ad: 'Mısır', yuzde: 20 }, { ad: 'Ayçiçeği küspesi', yuzde: 10 }, { ad: 'Buğday kepeği', yuzde: 5 }, { ad: 'Yonca kuru otu', yuzde: 10 }, { ad: 'Buğday samanı', yuzde: 13 }, { ad: 'Mermer tozu (kireçtaşı)', yuzde: 1.2 }, { ad: 'Tuz', yuzde: 0.5 }, { ad: 'Vitamin-mineral premiksi', yuzde: 0.3 }] },
  { id: 'bakim', ad: 'Bakım', faz: 'maintenance', aciklama: 'Yetişkin, verim yok',
    karisim: [{ ad: 'Arpa', yuzde: 15 }, { ad: 'Ayçiçeği küspesi', yuzde: 5 }, { ad: 'Yonca kuru otu', yuzde: 35 }, { ad: 'Buğday samanı', yuzde: 44.2 }, { ad: 'Tuz', yuzde: 0.5 }, { ad: 'Vitamin-mineral premiksi', yuzde: 0.3 }] },
];

/** Ağırlığa göre önerilen hazır besi rasyonu */
export function hazirSec(ortKg: number): string {
  return ortKg < 25 ? 'besi-baslangic' : ortKg < 35 ? 'besi-buyutme' : 'besi-bitirme';
}

/** % karışımı günlük yem miktarına (kg/baş) çevir */
export function karisimKg(karisim: { ad: string; yuzde: number }[], gunlukKg: number): { ad: string; kgBasGun: number }[] {
  const top = karisim.reduce((s, k) => s + (k.yuzde > 0 ? k.yuzde : 0), 0) || 1;
  return karisim.filter((k) => k.yuzde > 0).map((k) => ({ ad: k.ad, kgBasGun: Math.round(((gunlukKg * k.yuzde) / top) * 1000) / 1000 }));
}
