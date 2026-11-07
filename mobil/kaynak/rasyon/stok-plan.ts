/**
 * Hazır şablon ↔ stok ayrımı (saf mantık).
 * Şablon besin kontrolü referanstır; stokta olmayan kalemler uygulanabilir karışımdan çıkarılmaz,
 * yeniden oranlanmaz ve “dengeli” diye gösterilmez.
 */
import type { StockItem } from '@/kaynak/cekirdek/tipler';
import { besinKontrol, karisimKg, malzemeOlustur, type Gereksinim, type KontrolSatiri } from '@/kaynak/rasyon/formul';
import { standartYem } from '@/kaynak/rasyon/yem-besin';

export function yemStokEsle(
  ad: string,
  yemler: Pick<StockItem, 'id' | 'name' | 'quantity'>[],
): Pick<StockItem, 'id' | 'name' | 'quantity'> | undefined {
  const norm = (s: string) => s.trim().toLocaleLowerCase('tr');
  const direct = yemler.find((y) => norm(y.name) === norm(ad));
  if (direct) return direct;
  const st = standartYem(ad)?.ad;
  if (!st) return undefined;
  return yemler.find((y) => standartYem(y.name)?.ad === st);
}

export type StokPlanKalemi = {
  ad: string;
  stockId: string;
  kgBasGunSablon: number;
  kgBasGunPlan: number;
  stokKg: number;
  gunlukPadokKg: number;
  yeterGun: number | null;
};

export type HazirStokOzeti = {
  sablon: { ad: string; kgBasGun: number }[];
  stokta: StokPlanKalemi[];
  eksik: { ad: string; kgBasGun: number; gunlukPadokKg: number }[];
  referansKontrol: KontrolSatiri[];
  stokKontrol: KontrolSatiri[] | null;
  uygulanabilir: boolean;
  kismiKayit: boolean;
  uyarilar: string[];
};

export function hazirSablonStokPlani(
  karisim: { ad: string; yuzde: number }[],
  gunlukKg: number,
  g: Gereksinim,
  yemler: Pick<StockItem, 'id' | 'name' | 'quantity'>[],
  bas: number,
  gun = 1,
): HazirStokOzeti {
  const sablon = karisimKg(karisim, gunlukKg);
  const stokta: StokPlanKalemi[] = [];
  const eksik: { ad: string; kgBasGun: number; gunlukPadokKg: number }[] = [];

  for (const k of sablon) {
    const y = yemStokEsle(k.ad, yemler);
    const padokGunluk = Math.round(k.kgBasGun * bas * 100) / 100;
    if (y && y.quantity > 0) {
      const yeterGun = padokGunluk > 0 ? Math.floor(y.quantity / padokGunluk) : null;
      stokta.push({
        ad: k.ad,
        stockId: y.id,
        kgBasGunSablon: k.kgBasGun,
        kgBasGunPlan: k.kgBasGun,
        stokKg: y.quantity,
        gunlukPadokKg: padokGunluk,
        yeterGun,
      });
    } else {
      eksik.push({ ad: k.ad, kgBasGun: k.kgBasGun, gunlukPadokKg: padokGunluk });
    }
  }

  const referansKontrol = besinKontrol(
    sablon.map((k) => ({ m: malzemeOlustur(k.ad, 0), kg: k.kgBasGun })),
    g,
  );
  const stokKontrol =
    stokta.length > 0
      ? besinKontrol(
          stokta.map((k) => ({ m: malzemeOlustur(k.ad, 0), kg: k.kgBasGunPlan })),
          g,
        )
      : null;

  const uyarilar: string[] = [];
  if (eksik.length) {
    uyarilar.push(
      `${eksik.length} kalem stokta yok. Şablon referanstır; eksikler alış listesindedir — silinip yeniden oranlanmaz.`,
    );
  }
  if (!stokta.length) {
    uyarilar.push('Şablondaki yemlerden hiçbiri stokta yok. Önce alım girin veya «Stokla plan» kullanın.');
  }
  const besinTam = stokKontrol?.every((r) => r.tamam) ?? false;
  if (stokta.length && !besinTam) {
    uyarilar.push('Eldeki miktarlarla besin hedefleri karşılanmıyor; eksik yem almadan dengeli rasyon iddiası yok.');
  }
  const stokSure =
    gun <= 0 || stokta.every((k) => k.yeterGun == null || k.yeterGun >= gun);
  if (stokta.length && !stokSure) {
    uyarilar.push(`Seçilen ${gun} gün için bazı kalemlerde stok yetersiz.`);
  }

  const uygulanabilir = eksik.length === 0 && stokta.length > 0 && besinTam && stokSure;
  const kismiKayit = stokta.length > 0 && !uygulanabilir;

  return { sablon, stokta, eksik, referansKontrol, stokKontrol, uygulanabilir, kismiKayit, uyarilar };
}

export function rasyonKalemleriStokDogrula(
  kalemler: { stockId: string; kgBasGun: number }[],
  yemler: Pick<StockItem, 'id' | 'name' | 'quantity'>[],
  bas: number,
  gun = 1,
): { tamam: boolean; eksikler: string[] } {
  const eksikler: string[] = [];
  for (const k of kalemler) {
    if (!(k.kgBasGun > 0)) continue;
    const y = yemler.find((i) => i.id === k.stockId);
    const gereken = Math.round(k.kgBasGun * bas * gun * 1000) / 1000;
    if (!y) eksikler.push(`Stokta kayıt yok (${k.stockId})`);
    else if (y.quantity <= 0) eksikler.push(`${y.name}: stok 0 kg`);
    else if (y.quantity + 1e-6 < gereken) {
      eksikler.push(`${y.name}: ${y.quantity} kg stok · ${gereken} kg gerekli (${gun} gün × ${bas} baş)`);
    }
  }
  return { tamam: eksikler.length === 0, eksikler };
}
