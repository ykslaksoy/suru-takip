import { getAnimals, getAllHealthRecordsForAsi, getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import type { Mod3AdimId } from './adim-kilidi';

export type Mod3AdimKanit = { id: Mod3AdimId; tamam: boolean; kanit: string };

export type Mod3VeriDurum = {
  kanitlar: Mod3AdimKanit[];
  otomatikTamamlanan: Mod3AdimId[];
  ozet: { hayvan: number; turkvet: number; tartim: number; asi: number; aday: number };
};

function aktif<T extends { status: string }>(list: T[]) {
  return list.filter((a) => a.status !== 'sold' && a.status !== 'dead');
}

export async function tespitMod3VeriDurumu(): Promise<Mod3VeriDurum> {
  const animals = aktif(await getAnimals());
  const adaylar = animals.filter((a) => /damızlık|damizlik|aday/i.test(a.notes));
  const turkvet = animals.filter((a) => a.turkvetNo.trim().length >= 8).length;
  const health = await getAllHealthRecordsForAsi();
  const asiIds = new Set(health.filter((h) => h.recordType === 'vaccine').map((h) => h.animalId));

  let tartimli = 0;
  let coklu = 0;
  for (const a of animals) {
    const w = await getWeightRecords(a.id);
    if (w.length >= 1) tartimli += 1;
    if (w.length >= 2) coklu += 1;
  }

  const asi = animals.filter((a) => asiIds.has(a.id)).length;
  const n = animals.length;
  const esik = Math.max(1, Math.floor(n / 2));

  const kanitlar: Mod3AdimKanit[] = [
    {
      id: 'aday',
      tamam: n >= 1 && (adaylar.length >= 1 || n >= 1),
      kanit:
        adaylar.length >= 1
          ? `${adaylar.length} damızlık aday notlu`
          : n >= 1
            ? `${n} hayvan — aday notu ekleyebilirsiniz`
            : 'Hayvan yok',
    },
    {
      id: 'kimlik',
      tamam: turkvet >= esik,
      kanit: turkvet >= esik ? `${turkvet}/${n} TÜRKVET dolu` : `TÜRKVET ${turkvet}/${esik}`,
    },
    {
      id: 'buyume',
      tamam: coklu >= 1 || tartimli >= esik,
      kanit:
        coklu >= 1
          ? `${coklu} hayvanda ≥2 tartım`
          : tartimli
            ? `${tartimli} tartımlı — ara tartım ekleyin`
            : 'Tartım yok',
    },
    {
      id: 'saglik',
      tamam: asi >= 1 || health.length >= 1,
      kanit: asi ? `${asi} aşı kaydı` : health.length ? `${health.length} sağlık kaydı` : 'Sağlık/aşı yok',
    },
    {
      id: 'seleksiyon',
      tamam: coklu >= 1 && asi >= 1,
      kanit:
        coklu >= 1 && asi >= 1
          ? 'Büyüme + sağlık verisi seleksiyon için hazır'
          : 'Seleksiyon için tartım ve aşı gerekli',
    },
    {
      id: 'satis',
      tamam: turkvet >= esik && coklu >= 1,
      kanit:
        turkvet >= esik && coklu >= 1
          ? 'Kimlik + büyüme — satış hazırlığı mümkün'
          : 'Satış için TÜRKVET ve tartım tamamlanmalı',
    },
    {
      id: 'yonlendirme',
      tamam: coklu >= 1 && asi >= 1,
      kanit:
        coklu >= 1 && asi >= 1
          ? 'Öneri için veri yeterli (Akıllı Kuzu)'
          : 'Yönlendirme için daha fazla veri',
    },
  ];

  // aday: require at least animals
  kanitlar[0].tamam = n >= 1;

  return {
    kanitlar,
    otomatikTamamlanan: kanitlar.filter((k) => k.tamam).map((k) => k.id),
    ozet: { hayvan: n, turkvet, tartim: tartimli, asi, aday: adaylar.length || n },
  };
}
