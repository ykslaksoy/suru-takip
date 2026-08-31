import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAnimals,
  getAllHealthRecordsForAsi,
  getStockItems,
  getStockMovements,
  getWeightRecords,
} from '@/kaynak/cekirdek/veritabani';
import type { Mod2AdimId } from './adim-kilidi';
import { getKatimKayitlari } from './katim';

const RATION_KEY = 'sy_animal_ration_plans';

export type Mod2AdimKanit = {
  id: Mod2AdimId;
  tamam: boolean;
  kanit: string;
};

export type Mod2VeriDurum = {
  kanitlar: Mod2AdimKanit[];
  otomatikTamamlanan: Mod2AdimId[];
  ozet: {
    disi: number;
    koc: number;
    gebe: number;
    kuzu: number;
    katim: number;
    asi: number;
    t0: number;
  };
};

function aktif<T extends { status: string }>(list: T[]): T[] {
  return list.filter((a) => a.status !== 'sold' && a.status !== 'dead');
}

function yasAy(birthDate: string): number | null {
  const b = new Date(birthDate).getTime();
  if (Number.isNaN(b)) return null;
  return (Date.now() - b) / (30.44 * 86400000);
}

async function rasyonIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(RATION_KEY);
  if (!raw) return new Set();
  try {
    return new Set((JSON.parse(raw) as { animalId: string }[]).map((p) => p.animalId));
  } catch {
    return new Set();
  }
}

export async function tespitMod2VeriDurumu(): Promise<Mod2VeriDurum> {
  const animals = aktif(await getAnimals());
  const disiler = animals.filter((a) => a.sex === 'female');
  const koclar = animals.filter((a) => a.sex === 'male' && (yasAy(a.birthDate) ?? 0) >= 8);
  const gebeler = animals.filter((a) => a.status === 'pregnant');
  const kuzular = animals.filter((a) => {
    const ay = yasAy(a.birthDate);
    return ay != null && ay <= 6;
  });
  const anneBagli = kuzular.filter((a) => !!a.motherId);
  const katimlar = await getKatimKayitlari();
  const health = await getAllHealthRecordsForAsi();
  const asiIds = new Set(health.filter((h) => h.recordType === 'vaccine').map((h) => h.animalId));
  const rasyon = await rasyonIds();
  const feedIds = new Set((await getStockItems('feed')).map((s) => s.id));
  const yemCikis = (await getStockMovements()).some(
    (m) => m.movementType === 'out' && feedIds.has(m.stockId)
  );

  let t0 = 0;
  let ara = 0;
  for (const a of kuzular.length ? kuzular : animals) {
    const w = await getWeightRecords(a.id);
    if (w.length >= 1) t0 += 1;
    if (w.length >= 2) ara += 1;
  }

  const asi = (kuzular.length ? kuzular : animals).filter((a) => asiIds.has(a.id)).length;
  const rasyonN = (kuzular.length ? kuzular : animals).filter((a) => rasyon.has(a.id)).length;
  const esik = Math.max(1, Math.floor((kuzular.length || animals.length) / 2));

  const kanitlar: Mod2AdimKanit[] = [];

  const suruTamam = disiler.length >= 1 && koclar.length >= 1;
  kanitlar.push({
    id: 'suru-kayit',
    tamam: suruTamam,
    kanit: suruTamam
      ? `${disiler.length} dişi · ${koclar.length} koç`
      : `Dişi ${disiler.length}, koç ${koclar.length} — ikisi de gerekli`,
  });

  const katimTamam = katimlar.length >= 1;
  kanitlar.push({
    id: 'katim',
    tamam: katimTamam,
    kanit: katimTamam
      ? `${katimlar.length} katım kaydı`
      : 'Katım kaydı yok — manuel ekleyin veya onaylayın',
  });

  const gebelikTamam = gebeler.length >= 1 || (katimTamam && kuzular.length >= 1);
  kanitlar.push({
    id: 'gebelik',
    tamam: gebelikTamam,
    kanit: gebeler.length
      ? `${gebeler.length} gebe işaretli`
      : kuzular.length
        ? 'Kuzu var — gebelik/doğum geçmiş sayılır'
        : 'Gebe hayvan yok',
  });

  const kuzulatmaTamam = kuzular.length >= 1;
  kanitlar.push({
    id: 'kuzulatma',
    tamam: kuzulatmaTamam,
    kanit: kuzulatmaTamam
      ? `${kuzular.length} kuzu (≤6 ay)${anneBagli.length ? ` · ${anneBagli.length} anne bağlı` : ''}`
      : 'Henüz genç kuzu kaydı yok',
  });

  const saglikKuzu = health.some(
    (h) =>
      kuzular.some((k) => k.id === h.animalId) ||
      /kolostrum|kuzulat|yeni doğan|zayıf kuzu/i.test(`${h.notes} ${h.diagnosis} ${h.treatment}`)
  );
  const ilkGunTamam = kuzulatmaTamam && (saglikKuzu || anneBagli.length >= 1);
  kanitlar.push({
    id: 'ilk-gunler',
    tamam: ilkGunTamam,
    kanit: ilkGunTamam
      ? saglikKuzu
        ? 'İlk günler sağlık/kolostrum kaydı var'
        : 'Anne–kuzu bağı kurulmuş'
      : 'Kolostrum / zayıf kuzu kaydı veya anne bağı gerekli',
  });

  const besiNot = animals.some((a) => /besi/i.test(`${a.notes} ${a.paddock}`));
  const besiyeTamam = kuzulatmaTamam && (besiNot || t0 >= 1 || yemCikis);
  kanitlar.push({
    id: 'besiye-aktar',
    tamam: besiyeTamam,
    kanit: besiyeTamam
      ? 'Besi padok/not veya tartım/yem ile aktarım görülüyor'
      : 'Besiye alma: padok/not veya ilk tartım',
  });

  const asiTamam = kuzulatmaTamam && asi >= Math.min(esik, Math.max(1, kuzular.length));
  kanitlar.push({
    id: 'asi',
    tamam: asiTamam,
    kanit: asiTamam ? `${asi} aşı kaydı` : `Aşı ${asi} — hedef ≥1`,
  });

  const t0Tamam = t0 >= 1;
  kanitlar.push({
    id: 't0',
    tamam: t0Tamam,
    kanit: t0Tamam ? `${t0} hayvanda T0 tartım` : 'T0 tartım yok',
  });

  const rasyonTamam = rasyonN >= 1;
  kanitlar.push({
    id: 'rasyon',
    tamam: rasyonTamam,
    kanit: rasyonTamam ? `${rasyonN} rasyon planı` : 'Rasyon planı yok',
  });

  const tartimTamam = ara >= 1;
  kanitlar.push({
    id: 'tartim',
    tamam: tartimTamam,
    kanit: tartimTamam ? `${ara} hayvanda ≥2 tartım` : 'Ara tartım yok',
  });

  kanitlar.push({
    id: 'rapor',
    tamam: tartimTamam,
    kanit: tartimTamam ? 'ADG/FCR hesaplanabilir' : 'Rapor için ara tartım gerekli',
  });

  return {
    kanitlar,
    otomatikTamamlanan: kanitlar.filter((k) => k.tamam).map((k) => k.id),
    ozet: {
      disi: disiler.length,
      koc: koclar.length,
      gebe: gebeler.length,
      kuzu: kuzular.length,
      katim: katimlar.length,
      asi,
      t0,
    },
  };
}
