import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAnimals,
  getAllHealthRecordsForAsi,
  getWeightRecords,
} from '@/kaynak/cekirdek/veritabani';
import type { Mod5AdimId } from './adim-kilidi';
import { getSagimKayitlari } from './sagim';
import { getLaktasyonKayitlari } from './laktasyon';
import { getSutYonlendirme, yonlendirmeTamamMi } from './yonlendirme';
import {
  besiYolundaMi,
  getKuzuYonHedefMap,
  satinAlinanKuzuMu,
  sutDisiAnneIds,
  sutDoganKuzuAdaylari,
  yasAy,
} from '@/kaynak/kuzu-yonlendirme';
import { tespitOrtakBesiKanitlari } from '@/kaynak/ortak-besi-yol';

const RATION_KEY = 'sy_animal_ration_plans';

export type Mod5AdimKanit = { id: Mod5AdimId; tamam: boolean; kanit: string };

export type Mod5VeriDurum = {
  kanitlar: Mod5AdimKanit[];
  otomatikTamamlanan: Mod5AdimId[];
  ozet: {
    disi: number;
    sagmal: number;
    besiKuzu: number;
    sagim: number;
    litre: number;
    laktasyon: number;
    asi: number;
  };
};

function aktif<T extends { status: string }>(list: T[]) {
  return list.filter((a) => a.status !== 'sold' && a.status !== 'dead');
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

export async function tespitMod5VeriDurumu(): Promise<Mod5VeriDurum> {
  const animals = aktif(await getAnimals());
  const hedef = await getKuzuYonHedefMap();
  const disiler = animals.filter((a) => a.sex === 'female');
  const sagmal = animals.filter(
    (a) =>
      a.sex === 'female' &&
      (/sağmal|sagmal|süt|sut|laktasyon/i.test(`${a.notes} ${a.paddock}`) || a.status === 'lactating'),
  );
  const sutAnne = sutDisiAnneIds(animals);
  const sutDogan = sutDoganKuzuAdaylari(animals, sutAnne);
  const besiKuzular = animals.filter(
    (a) => {
      const ay = yasAy(a.birthDate);
      return ay != null && ay <= 12 && besiYolundaMi(a, hedef);
    },
  );
  const gebeler = animals.filter((a) => a.status === 'pregnant');
  const sagimlar = await getSagimKayitlari();
  const laktasyonlar = await getLaktasyonKayitlari();
  const yon = await getSutYonlendirme();
  const health = await getAllHealthRecordsForAsi();
  const asiIds = new Set(health.filter((h) => h.recordType === 'vaccine').map((h) => h.animalId));
  const memeSaglik = health.some((h) =>
    /meme|mastit|sağım|sagim|süt|sut/i.test(`${h.notes} ${h.diagnosis} ${h.treatment}`),
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
  const grupTamam = disiler.length >= 1;

  const ayirmaTamam =
    sutDogan.length === 0 ||
    sutDogan.every((k) => hedef[k.id] === 'damizlik' || hedef[k.id] === 'besi' || besiYolundaMi(k, hedef));

  const besiKanit = await tespitOrtakBesiKanitlari(besiKuzular, hedef);
  const besiMap = Object.fromEntries(besiKanit.map((k) => [k.id, k]));

  const kanitlar: Mod5AdimKanit[] = [
    {
      id: 'gruplar',
      tamam: grupTamam,
      kanit: grupTamam
        ? `${disiler.length} dişi · süt sürüsü`
        : 'Süt sürüsü için dişi hayvan ekleyin',
    },
    {
      id: 'ureme',
      tamam: gebeler.length >= 1 || sutDogan.length >= 1,
      kanit: gebeler.length || sutDogan.length
        ? `${gebeler.length} gebe · ${sutDogan.length} süt kuzusu`
        : 'İsteğe bağlı — çiftleşme / doğum kaydı',
    },
    {
      id: 'sagim',
      tamam: sagimlar.length >= 1,
      kanit: sagimlar.length
        ? `${sagimlar.length} sağım · ${litre.toFixed(1)} L`
        : 'Sağım kaydı yok',
    },
    {
      id: 'laktasyon',
      tamam: laktasyonlar.length >= 1 || (sagimlar.length >= 2 && disiler.length >= 1),
      kanit: laktasyonlar.length
        ? `${laktasyonlar.length} laktasyon`
        : sagimlar.length >= 2
          ? 'Çoklu sağım — laktasyon mümkün'
          : 'Laktasyon kaydı veya ≥2 sağım',
    },
    {
      id: 'rasyon-sut',
      tamam: rasyonN >= 1 || tartimli >= 1,
      kanit: rasyonN ? `${rasyonN} süt rasyonu` : tartimli ? 'Tartım var — rasyon bağlayın' : 'Süt rasyonu yok',
    },
    {
      id: 'saglik',
      tamam: memeSaglik || asi >= 1 || health.length >= 1,
      kanit: memeSaglik ? 'Meme / sağlık kaydı' : asi ? `${asi} aşı` : 'Meme / sağlık kaydı yok',
    },
    {
      id: 'yonlendirme',
      tamam: yonlendirmeTamamMi(yon) || (sagimlar.length >= 1 && disiler.length >= 1),
      kanit: yonlendirmeTamamMi(yon) ? 'Yönlendirme seçildi' : 'Kuruya alma / sütten kesme',
    },
    {
      id: 'damizlik-besi',
      tamam: ayirmaTamam && (sutDogan.length === 0 || besiKuzular.some((k) => sutAnne.has(k.motherId ?? ''))),
      kanit: sutDogan.length
        ? ayirmaTamam
          ? `${sutDogan.length} kuzu ayırıldı (damızlık veya besi)`
          : `${sutDogan.length} kuzu — damızlık/besi seçin`
        : 'Süt kuzusu yok veya hepsi işaretli',
    },
    ...(besiKanit as Mod5AdimKanit[]),
    {
      id: 'rapor',
      tamam:
        sagimlar.length >= 1 &&
        (besiMap['tartim-besi']?.tamam || besiKuzular.length === 0) &&
        (rasyonN >= 1 || tartimli >= 1),
      kanit:
        sagimlar.length >= 1
          ? 'Süt + besi metrikleri raporlanabilir'
          : 'Rapor için sağım gerekli',
    },
  ];

  return {
    kanitlar,
    otomatikTamamlanan: kanitlar.filter((k) => k.tamam).map((k) => k.id),
    ozet: {
      disi: disiler.length,
      sagmal: sagmal.length || disiler.length,
      besiKuzu: besiKuzular.length,
      sagim: sagimlar.length,
      litre,
      laktasyon: laktasyonlar.length,
      asi,
    },
  };
}
