import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAnimals,
  getAllHealthRecordsForAsi,
  getStockItems,
  getStockMovements,
  getWeightRecords,
} from '@/kaynak/cekirdek/veritabani';
import { getKatimKayitlari } from '@/kaynak/besi-koc-kat';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import type { Mod7AdimId } from './adim-kilidi';
import { getSagimKayitlari } from './sagim';
import { getLaktasyonKayitlari } from './laktasyon';
import { getSutYonlendirme, yonlendirmeTamamMi } from './yonlendirme';
import {
  besiYolundaMi,
  getKuzuYonHedefMap,
  sutDisiAnneIds,
  sutDoganKuzuAdaylari,
  yasAy,
} from '@/kaynak/kuzu-yonlendirme';
import { tespitOrtakBesiKanitlari } from '@/kaynak/ortak-besi-yol';
import {
  getHayvanKoluMap,
  getPadokKoluMap,
  hayvanSuruKoluSync,
  type SuruKolu,
} from '@/kaynak/suru-kolu';

const RATION_KEY = 'sy_animal_ration_plans';

export type Mod7AdimKanit = { id: Mod7AdimId; tamam: boolean; kanit: string };

export type Mod7VeriDurum = {
  kanitlar: Mod7AdimKanit[];
  otomatikTamamlanan: Mod7AdimId[];
  ozet: {
    sut: number;
    et: number;
    besiKuzu: number;
    sagim: number;
    litre: number;
    katim: number;
  };
};

function aktif<T extends { status: string }>(list: T[]) {
  return list.filter((a) => a.status !== 'sold' && a.status !== 'dead');
}

function kolFiltre(
  animals: Animal[],
  kol: SuruKolu,
  pm: Record<string, SuruKolu>,
  hm: Record<string, SuruKolu>,
): Animal[] {
  return animals.filter((a) => hayvanSuruKoluSync(a, pm, hm) === kol);
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

export async function tespitMod7VeriDurumu(): Promise<Mod7VeriDurum> {
  const animals = aktif(await getAnimals());
  const [pm, hm, hedef] = await Promise.all([getPadokKoluMap(), getHayvanKoluMap(), getKuzuYonHedefMap()]);
  const sutKol = kolFiltre(animals, 'sut', pm, hm);
  const etKol = kolFiltre(animals, 'et', pm, hm);
  const etiketVar = Object.keys(pm).length + Object.keys(hm).length > 0;

  const sutDisiler = sutKol.filter((a) => a.sex === 'female');
  const etDisiler = etKol.filter((a) => a.sex === 'female');
  const etKoc = etKol.filter((a) => a.sex === 'male');
  const sutAnne = new Set(sutDisiler.map((a) => a.id));
  const sutDogan = sutDoganKuzuAdaylari(animals, sutAnne);
  const etKuzular = etKol.filter((a) => {
    const ay = yasAy(a.birthDate);
    return ay != null && ay <= 6;
  });
  const besiKuzular = animals.filter((a) => {
    const ay = yasAy(a.birthDate);
    return ay != null && ay <= 12 && besiYolundaMi(a, hedef);
  });

  const sagimlar = await getSagimKayitlari();
  const laktasyonlar = await getLaktasyonKayitlari();
  const katimlar = await getKatimKayitlari();
  const yon = await getSutYonlendirme();
  const health = await getAllHealthRecordsForAsi();
  const gebeler = animals.filter((a) => a.status === 'pregnant');
  const asiIds = new Set(health.filter((h) => h.recordType === 'vaccine').map((h) => h.animalId));
  const litre = sagimlar.reduce((s, k) => s + (k.litre || 0), 0);
  const rasyon = await rasyonIds();
  const feedIds = new Set((await getStockItems('feed')).map((s) => s.id));
  const yemCikis = (await getStockMovements()).some((m) => m.movementType === 'out' && feedIds.has(m.stockId));

  const ayirmaTamam =
    sutDogan.length === 0 || sutDogan.every((k) => hedef[k.id] === 'damizlik' || hedef[k.id] === 'besi');

  const besiKanit = await tespitOrtakBesiKanitlari(besiKuzular, hedef);
  const besiById = Object.fromEntries(besiKanit.map((k) => [k.id, k]));

  let etT0 = 0;
  for (const a of etKuzular) {
    const w = await getWeightRecords(a.id);
    if (w.length >= 1) etT0 += 1;
  }

  const kanitlar: Mod7AdimKanit[] = [
    {
      id: 'kol-etiket',
      tamam: etiketVar || sutKol.length + etKol.length >= 2,
      kanit: etiketVar
        ? `${sutKol.length} süt · ${etKol.length} et etiketli`
        : 'Süt ve et kolu işaretleyin',
    },
    {
      id: 'gruplar-sut',
      tamam: sutDisiler.length >= 1,
      kanit: sutDisiler.length ? `${sutDisiler.length} süt kolu dişi` : 'Süt kolu dişi yok',
    },
    {
      id: 'ureme',
      tamam: gebeler.length >= 1 || sutDogan.length + etKuzular.length >= 1,
      kanit: 'Ortak çiftleşme / doğum kayıtları',
    },
    {
      id: 'sagim',
      tamam: sagimlar.length >= 1,
      kanit: sagimlar.length ? `${litre.toFixed(1)} L` : 'Sağım yok',
    },
    {
      id: 'laktasyon',
      tamam: laktasyonlar.length >= 1 || sagimlar.length >= 2,
      kanit: laktasyonlar.length ? `${laktasyonlar.length} kayıt` : 'Laktasyon / sağım',
    },
    {
      id: 'rasyon-sut',
      tamam: sutDisiler.some((a) => rasyon.has(a.id)),
      kanit: 'Süt kolu rasyonu',
    },
    {
      id: 'saglik-sut',
      tamam: health.length >= 1 || sutDisiler.some((a) => asiIds.has(a.id)),
      kanit: 'Süt kolu sağlık / aşı',
    },
    {
      id: 'damizlik-besi',
      tamam: ayirmaTamam,
      kanit: sutDogan.length ? `${sutDogan.length} süt kuzusu ayırıldı` : 'Ayırma gerekmez',
    },
    {
      id: 'gruplar-et',
      tamam: etDisiler.length >= 1 && etKoc.length >= 1,
      kanit: `${etDisiler.length} dişi · ${etKoc.length} koç`,
    },
    {
      id: 'katim',
      tamam: katimlar.length >= 1,
      kanit: katimlar.length ? `${katimlar.length} katım` : 'Koç katımı yok',
    },
    {
      id: 'gebelik',
      tamam: gebeler.some((a) => hayvanSuruKoluSync(a, pm, hm) === 'et'),
      kanit: 'Et kolu gebelik',
    },
    {
      id: 'kuzulatma',
      tamam: etKuzular.some((k) => !!k.motherId),
      kanit: `${etKuzular.length} et kolu kuzu`,
    },
    {
      id: 'ilk-gunler',
      tamam: health.length >= 1 && etKuzular.length >= 1,
      kanit: 'İlk gün sağlık kaydı',
    },
    {
      id: 'besiye-aktar-et',
      tamam: etKuzular.length >= 1 && (etT0 >= 1 || yemCikis || /besi/i.test(etKuzular.map((k) => k.paddock).join(' '))),
      kanit: 'Et kolu kuzu besiye',
    },
    ...(besiKanit as Mod7AdimKanit[]),
    {
      id: 'rapor',
      tamam: sagimlar.length >= 1 && besiById['tartim-besi']?.tamam !== false,
      kanit: 'Süt + etçi + besi özeti',
    },
  ];

  return {
    kanitlar,
    otomatikTamamlanan: kanitlar.filter((k) => k.tamam).map((k) => k.id),
    ozet: {
      sut: sutKol.length,
      et: etKol.length,
      besiKuzu: besiKuzular.length,
      sagim: sagimlar.length,
      litre,
      katim: katimlar.length,
    },
  };
}
