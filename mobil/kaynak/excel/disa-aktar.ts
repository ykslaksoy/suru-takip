import {
  countAnimals,
  getAllHealthRecordsForAsi,
  getAnimals,
  getStockItems,
} from '@/kaynak/cekirdek/veritabani';
import { ANIMAL_STATUS_LABELS } from '@/kaynak/cekirdek/tipler';
import { turEtiketi } from '@/kaynak/suru/tur';

function csvEscape(value: string | number | null | undefined): string {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Excel TR için UTF-8 BOM */
const BOM = '\uFEFF';

/** Hayvan listesini CSV olarak döner (Excel’de açılır). */
export async function hayvanListesiCsv(): Promise<string> {
  const animals = await getAnimals();
  const header = [
    'Küpe',
    'TÜRKVET',
    'Sırt',
    'İsim',
    'Tür',
    'Irk',
    'Cinsiyet',
    'Doğum',
    'Padok',
    'Durum',
    'AnneId',
    'Not',
  ].join(',');
  const rows = animals.map((a) =>
    [
      csvEscape(a.earTag),
      csvEscape(a.turkvetNo),
      csvEscape(a.sirtNo),
      csvEscape(a.name),
      csvEscape(turEtiketi(a.species ?? 'sheep')),
      csvEscape(a.breed),
      csvEscape(a.sex === 'female' ? 'Dişi' : 'Erkek'),
      csvEscape(a.birthDate),
      csvEscape(a.paddock),
      csvEscape(ANIMAL_STATUS_LABELS[a.status] ?? a.status),
      csvEscape(a.motherId),
      csvEscape(a.notes),
    ].join(','),
  );
  return BOM + [header, ...rows].join('\n');
}

export async function hayvanListesiSatirSayisi(): Promise<number> {
  return (await getAnimals()).length;
}

/**
 * Sürü özet + hayvan listesi — Ayarlar’dan paylaşılır.
 * Üstte özet satırları, altında hayvan tablosu (tek CSV / Excel).
 */
export async function suruOzetCsv(): Promise<string> {
  const [animals, health, stock, toplam] = await Promise.all([
    getAnimals(),
    getAllHealthRecordsForAsi(),
    getStockItems(),
    countAnimals(),
  ]);

  const aktif = animals.filter((a) => a.status !== 'sold' && a.status !== 'dead');
  const padokSayac = new Map<string, number>();
  const durumSayac = new Map<string, number>();
  for (const a of aktif) {
    const p = (a.paddock || '—').trim() || '—';
    padokSayac.set(p, (padokSayac.get(p) ?? 0) + 1);
    durumSayac.set(a.status, (durumSayac.get(a.status) ?? 0) + 1);
  }

  const bugun = new Date();
  const otuzGunOnce = new Date(bugun);
  otuzGunOnce.setDate(otuzGunOnce.getDate() - 30);
  const sonDogumlar = aktif.filter((a) => {
    const d = new Date(a.birthDate);
    return !Number.isNaN(d.getTime()) && d >= otuzGunOnce;
  });

  const asi = health.filter((h) => h.recordType === 'vaccine').length;
  const hastalik = health.filter((h) => h.recordType === 'illness').length;
  const yemStok = stock.filter((s) => s.type === 'feed');
  const asiStok = stock.filter((s) => s.type === 'vaccine');

  const ozet: string[] = [
    'Bolum,Anahtar,Deger',
    csvEscape('Ozet') + ',' + csvEscape('Toplam hayvan') + ',' + csvEscape(toplam),
    csvEscape('Ozet') + ',' + csvEscape('Aktif') + ',' + csvEscape(aktif.length),
    csvEscape('Ozet') + ',' + csvEscape('Gebe') + ',' + csvEscape(durumSayac.get('pregnant') ?? 0),
    csvEscape('Ozet') + ',' + csvEscape('Sağmal') + ',' + csvEscape(durumSayac.get('lactating') ?? 0),
    csvEscape('Ozet') + ',' + csvEscape('Son 30 gün doğum (kuzu)') + ',' + csvEscape(sonDogumlar.length),
    csvEscape('Ozet') + ',' + csvEscape('Aşı kayıtları') + ',' + csvEscape(asi),
    csvEscape('Ozet') + ',' + csvEscape('Hastalık kayıtları') + ',' + csvEscape(hastalik),
    csvEscape('Ozet') + ',' + csvEscape('Yem stok kalemi') + ',' + csvEscape(yemStok.length),
    csvEscape('Ozet') + ',' + csvEscape('Aşı stok kalemi') + ',' + csvEscape(asiStok.length),
    csvEscape('Ozet') + ',' + csvEscape('Rapor tarihi') + ',' + csvEscape(bugun.toISOString().slice(0, 10)),
  ];

  for (const [padok, n] of [...padokSayac.entries()].sort((a, b) => a[0].localeCompare(b[0], 'tr'))) {
    ozet.push([csvEscape('Padok'), csvEscape(padok), csvEscape(n)].join(','));
  }
  for (const [durum, n] of [...durumSayac.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const etiket = ANIMAL_STATUS_LABELS[durum as keyof typeof ANIMAL_STATUS_LABELS] ?? durum;
    ozet.push([csvEscape('Durum'), csvEscape(etiket), csvEscape(n)].join(','));
  }

  const hayvanCsv = await hayvanListesiCsv();
  const hayvanGovde = hayvanCsv.startsWith(BOM) ? hayvanCsv.slice(BOM.length) : hayvanCsv;

  return BOM + ozet.join('\n') + '\n\n' + '--- Hayvan listesi ---\n' + hayvanGovde;
}
