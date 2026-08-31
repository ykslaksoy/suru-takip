import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAnimals,
  getAllHealthRecordsForAsi,
  getWeightRecords,
} from '@/kaynak/cekirdek/veritabani';
import type { Mod4AdimId } from './adim-kilidi';
import { getSagimKayitlari } from './sagim';
import { getLaktasyonKayitlari } from './laktasyon';
import { getSutYonlendirme, yonlendirmeTamamMi } from './yonlendirme';

const RATION_KEY = 'sy_animal_ration_plans';

export type Mod4AdimKanit = { id: Mod4AdimId; tamam: boolean; kanit: string };

export type Mod4VeriDurum = {
  kanitlar: Mod4AdimKanit[];
  otomatikTamamlanan: Mod4AdimId[];
  ozet: {
    disi: number;
    sagmal: number;
    kuzu: number;
    sagim: number;
    litre: number;
    laktasyon: number;
    asi: number;
  };
};

function aktif<T extends { status: string }>(list: T[]) {
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

export async function tespitMod4VeriDurumu(): Promise<Mod4VeriDurum> {
  const animals = aktif(await getAnimals());
  const disiler = animals.filter((a) => a.sex === 'female');
  const sagmal = animals.filter(
    (a) =>
      a.sex === 'female' &&
      (/sağmal|sagmal|süt|sut|laktasyon/i.test(`${a.notes} ${a.paddock}`) || a.status === 'lactating')
  );
  const kuzular = animals.filter((a) => {
    const ay = yasAy(a.birthDate);
    return ay != null && ay <= 6;
  });
  const gebeler = animals.filter((a) => a.status === 'pregnant');
  const sagimlar = await getSagimKayitlari();
  const laktasyonlar = await getLaktasyonKayitlari();
  const yon = await getSutYonlendirme();
  const health = await getAllHealthRecordsForAsi();
  const asiIds = new Set(health.filter((h) => h.recordType === 'vaccine').map((h) => h.animalId));
  const memeSaglik = health.some((h) =>
    /meme|mastit|sağım|sagim|süt|sut/i.test(`${h.notes} ${h.diagnosis} ${h.treatment}`)
  );
  const rasyon = await rasyonIds();
  const rasyonN = disiler.filter((a) => rasyon.has(a.id)).length;

  let tartimli = 0;
  for (const a of disiler) {
    const w = await getWeightRecords(a.id);
    if (w.length >= 1) tartimli += 1;
  }

  const litre = sagimlar.reduce((s, k) => s + (k.litre || 0), 0);
  const asi = disiler.filter((a) => asiIds.has(a.id)).length;
  const grupTamam =
    disiler.length >= 1 &&
    (sagmal.length >= 1 ||
      animals.some((a) => /sağmal|sagmal|kuru|gebe/i.test(`${a.notes} ${a.paddock}`)));

  const kanitlar: Mod4AdimKanit[] = [
    {
      id: 'gruplar',
      tamam: grupTamam || disiler.length >= 1,
      kanit: grupTamam
        ? `${disiler.length} dişi · ${sagmal.length || disiler.length} sağmal/grup`
        : disiler.length
          ? `${disiler.length} dişi — padok/not ile grup ayırın`
          : 'Dişi hayvan yok',
    },
    {
      id: 'ureme',
      tamam: kuzular.length >= 1 || gebeler.length >= 1,
      kanit: kuzular.length
        ? `${kuzular.length} kuzu`
        : gebeler.length
          ? `${gebeler.length} gebe`
          : 'Üreme / kuzulatma kaydı yok',
    },
    {
      id: 'sagim',
      tamam: sagimlar.length >= 1,
      kanit: sagimlar.length
        ? `${sagimlar.length} sağım · ${litre.toFixed(1)} L`
        : 'Sağım kaydı yok — litre girin',
    },
    {
      id: 'laktasyon',
      tamam: laktasyonlar.length >= 1 || (sagimlar.length >= 2 && disiler.length >= 1),
      kanit: laktasyonlar.length
        ? `${laktasyonlar.length} laktasyon kaydı`
        : sagimlar.length >= 2
          ? 'Çoklu sağım — laktasyon eğrisi mümkün'
          : 'Laktasyon için kayıt veya ≥2 sağım',
    },
    {
      id: 'rasyon',
      tamam: rasyonN >= 1 || tartimli >= 1,
      kanit: rasyonN
        ? `${rasyonN} rasyon planı`
        : tartimli
          ? `${tartimli} tartımlı — rasyon bağlayın`
          : 'Rasyon planı yok',
    },
    {
      id: 'saglik',
      tamam: memeSaglik || asi >= 1 || health.length >= 1,
      kanit: memeSaglik
        ? 'Meme / sağım sağlık kaydı var'
        : asi
          ? `${asi} aşı kaydı`
          : health.length
            ? `${health.length} sağlık kaydı`
            : 'Meme / sağlık kaydı yok',
    },
    {
      id: 'yonlendirme',
      tamam: yonlendirmeTamamMi(yon) || (sagimlar.length >= 1 && (gebeler.length >= 1 || kuzular.length >= 1)),
      kanit: yonlendirmeTamamMi(yon)
        ? 'Süt yönlendirme seçildi'
        : sagimlar.length && (gebeler.length || kuzular.length)
          ? 'Sağım + üreme — yönlendirme için veri yeterli'
          : 'Kuruya alma / yönlendirme için veri eksik',
    },
    {
      id: 'rapor',
      tamam: sagimlar.length >= 1 && (rasyonN >= 1 || tartimli >= 1),
      kanit:
        sagimlar.length >= 1 && (rasyonN >= 1 || tartimli >= 1)
          ? 'Litre + rasyon/tartım — rapor hazır'
          : 'Rapor için sağım ve rasyon/tartım gerekli',
    },
  ];

  // gruplar: en az bir dişi
  kanitlar[0].tamam = disiler.length >= 1;

  return {
    kanitlar,
    otomatikTamamlanan: kanitlar.filter((k) => k.tamam).map((k) => k.id),
    ozet: {
      disi: disiler.length,
      sagmal: sagmal.length || disiler.length,
      kuzu: kuzular.length,
      sagim: sagimlar.length,
      litre,
      laktasyon: laktasyonlar.length,
      asi,
    },
  };
}
