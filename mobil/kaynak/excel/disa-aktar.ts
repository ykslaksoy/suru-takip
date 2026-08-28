import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { turEtiketi } from '@/kaynak/suru/tur';

function csvEscape(value: string | number | null | undefined): string {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Hayvan listesini CSV olarak döner (Excel’de açılır). */
export async function hayvanListesiCsv(): Promise<string> {
  const animals = await getAnimals();
  const header = [
    'Küpe',
    'TÜRKVET',
    'İsim',
    'Tür',
    'Irk',
    'Cinsiyet',
    'Doğum',
    'Padok',
    'Durum',
    'Not',
  ].join(',');
  const rows = animals.map((a) =>
    [
      csvEscape(a.earTag),
      csvEscape(a.turkvetNo),
      csvEscape(a.name),
      csvEscape(turEtiketi(a.species ?? 'sheep')),
      csvEscape(a.breed),
      csvEscape(a.sex === 'female' ? 'Dişi' : 'Erkek'),
      csvEscape(a.birthDate),
      csvEscape(a.paddock),
      csvEscape(a.status),
      csvEscape(a.notes),
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

export async function hayvanListesiSatirSayisi(): Promise<number> {
  return (await getAnimals()).length;
}
