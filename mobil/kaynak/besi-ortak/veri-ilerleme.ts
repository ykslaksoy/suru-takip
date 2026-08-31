import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAnimals,
  getAllHealthRecordsForAsi,
  getStockMovements,
  getStockItems,
  getWeightRecords,
} from '@/kaynak/cekirdek/veritabani';
import type { BesiAdimId } from './adim-kilidi';

const RATION_KEY = 'sy_animal_ration_plans';
const KARANTINA_GUN = 5;

export type AdimKanit = {
  id: BesiAdimId;
  tamam: boolean;
  kanit: string;
};

export type Mod1VeriDurum = {
  kanitlar: AdimKanit[];
  otomatikTamamlanan: BesiAdimId[];
  ozet: {
    hayvan: number;
    asi: number;
    t0: number;
    rasyon: number;
    araTartim: number;
    karantinaGun: number | null;
  };
};

function aktifHayvanlar<T extends { status: string }>(list: T[]): T[] {
  return list.filter((a) => a.status !== 'sold' && a.status !== 'dead');
}

function gunFarki(iso: string, now = Date.now()): number {
  return Math.floor((now - new Date(iso).getTime()) / 86400000);
}

async function rasyonPlanliIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(RATION_KEY);
  if (!raw) return new Set();
  try {
    const plans = JSON.parse(raw) as { animalId: string }[];
    return new Set(plans.map((p) => p.animalId));
  } catch {
    return new Set();
  }
}

/**
 * Canlı kayıtlardan Mod 1 adım tamamlanma tespiti.
 * Karantina: en eski hayvanın sistemde kalış günü ≥ 5 veya aşı yapılmışsa tamam.
 */
export async function tespitMod1VeriDurumu(): Promise<Mod1VeriDurum> {
  const animals = aktifHayvanlar(await getAnimals());
  const n = animals.length;
  const health = await getAllHealthRecordsForAsi();
  const stock = await getStockItems('feed');
  const feedIds = new Set(stock.map((s) => s.id));
  const movements = await getStockMovements();
  const yemCikisVar = movements.some((m) => m.movementType === 'out' && feedIds.has(m.stockId));
  const rasyonIds = await rasyonPlanliIds();

  const asiAnimalIds = new Set(
    health.filter((h) => h.recordType === 'vaccine').map((h) => h.animalId)
  );

  let t0 = 0;
  let araTartim = 0;
  for (const a of animals) {
    const weights = await getWeightRecords(a.id);
    if (weights.length >= 1) t0 += 1;
    if (weights.length >= 2) araTartim += 1;
  }

  const asi = animals.filter((a) => asiAnimalIds.has(a.id)).length;
  const rasyon = animals.filter((a) => rasyonIds.has(a.id)).length;

  const enEski = animals
    .map((a) => gunFarki(a.createdAt))
    .reduce((max, g) => Math.max(max, g), -1);
  const karantinaGun = n > 0 ? Math.max(0, enEski) : null;
  const karantinaNot =
    animals.some((a) => /karantina/i.test(`${a.notes} ${a.paddock}`)) ||
    health.some((h) => /karantina/i.test(`${h.notes} ${h.diagnosis} ${h.treatment}`));

  const esik = Math.max(1, Math.floor(n / 2));

  const kanitlar: AdimKanit[] = [];

  const alimTamam = n >= 1;
  kanitlar.push({
    id: 'alim',
    tamam: alimTamam,
    kanit: alimTamam ? `${n} hayvan kayıtlı` : 'Henüz hayvan yok — ekleyin',
  });

  const asiTamam = n > 0 && asi >= esik;
  const karantinaTamam =
    alimTamam &&
    ((karantinaGun != null && karantinaGun >= KARANTINA_GUN) || karantinaNot || asiTamam);
  kanitlar.push({
    id: 'karantina',
    tamam: karantinaTamam,
    kanit: !alimTamam
      ? 'Önce alım'
      : asiTamam
        ? 'Aşı kaydı var — karantina geçilmiş sayılır'
        : karantinaGun != null && karantinaGun >= KARANTINA_GUN
          ? `${karantinaGun}. gün tamam (≥${KARANTINA_GUN})`
          : karantinaNot
            ? 'Karantina notu / padok işaretli'
            : `Karantina gün ${karantinaGun ?? 0}/${KARANTINA_GUN} — veya manuel onay`,
  });

  kanitlar.push({
    id: 'asi',
    tamam: asiTamam,
    kanit: asiTamam
      ? `${asi}/${n} hayvanda aşı kaydı`
      : n === 0
        ? 'Önce alım'
        : `Aşı kaydı ${asi}/${esik} (hedef ≥ yarısı)`,
  });

  const t0Tamam = n > 0 && t0 >= esik;
  kanitlar.push({
    id: 't0',
    tamam: t0Tamam,
    kanit: t0Tamam
      ? `${t0}/${n} hayvanda tartım (T1)`
      : n === 0
        ? 'Önce alım'
        : `Tartım ${t0}/${esik}`,
  });

  const rasyonTamam = n > 0 && rasyon >= esik;
  kanitlar.push({
    id: 'rasyon',
    tamam: rasyonTamam,
    kanit: rasyonTamam
      ? `${rasyon}/${n} hayvanda rasyon planı`
      : `Rasyon planı ${rasyon}/${esik} — tartım sonrası oluşur`,
  });

  const besiTamam = rasyonTamam && (yemCikisVar || (karantinaGun != null && karantinaGun >= 7));
  kanitlar.push({
    id: 'besi',
    tamam: besiTamam,
    kanit: besiTamam
      ? yemCikisVar
        ? 'Yem çıkışı kayıtlı — besi sürüyor'
        : 'Rasyon + süre — besi dönemi'
      : 'Yem stok çıkışı veya rasyon sonrası süre gerekli',
  });

  const tartimTamam = n > 0 && araTartim >= 1;
  kanitlar.push({
    id: 'tartim',
    tamam: tartimTamam,
    kanit: tartimTamam
      ? `${araTartim} hayvanda ≥2 tartım (ADG için)`
      : 'Ara tartım yok — en az 2 tartım girin',
  });

  const raporTamam = tartimTamam;
  kanitlar.push({
    id: 'rapor',
    tamam: raporTamam,
    kanit: raporTamam
      ? 'Ara tartım var — ADG / FCR hesaplanabilir'
      : 'Rapor için ara tartım gerekli',
  });

  return {
    kanitlar,
    otomatikTamamlanan: kanitlar.filter((k) => k.tamam).map((k) => k.id),
    ozet: {
      hayvan: n,
      asi,
      t0,
      rasyon,
      araTartim,
      karantinaGun,
    },
  };
}
