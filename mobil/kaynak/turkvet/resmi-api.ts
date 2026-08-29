/**
 * TÜRKVET / VETBİS / GEKİS resmi API köprüsü.
 * Canlı erişim yokken: yerel doğrulama + CSV/JSON dışa aktarım + “yapılandırılmadı” durumu.
 */

import type { Animal } from '@/kaynak/cekirdek/tipler';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { formatTurkvetExport, validateGehisId, validateTurkvetNo } from './dogrula';

export type ResmiApiDurum = 'yapilandirilmadi' | 'hazir' | 'hata';

export type ResmiApiSonuc<T = unknown> = {
  ok: boolean;
  durum: ResmiApiDurum;
  message: string;
  data?: T;
};

/** Ortamda resmi API anahtarı var mı (şimdilik yok) */
export function resmiApiYapilandiMi(): boolean {
  const key =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_TURKVET_API_KEY) || '';
  return Boolean(String(key).trim());
}

export function resmiApiDurum(): ResmiApiSonuc {
  if (!resmiApiYapilandiMi()) {
    return {
      ok: false,
      durum: 'yapilandirilmadi',
      message:
        'Canlı TÜRKVET / VETBİS API anahtarı yok. JSON/CSV dışa aktarım ve alan doğrulama kullanılabilir.',
    };
  }
  return {
    ok: true,
    durum: 'hazir',
    message: 'API anahtarı tanımlı — canlı bildirim denenebilir.',
  };
}

/** Canlı bildirim — anahtar yoksa net hata */
export async function resmiBildirimGonder(_hayvanIds?: string[]): Promise<ResmiApiSonuc> {
  const d = resmiApiDurum();
  if (!d.ok) return d;
  return {
    ok: false,
    durum: 'hata',
    message: 'Resmi endpoint sözleşmesi henüz bağlanmadı — anahtar var ama URL/şema bekleniyor.',
  };
}

export type TurkvetKontrolSatir = {
  animalId: string;
  earTag: string;
  turkvetOk: boolean;
  gehisOk: boolean;
  eksikler: string[];
};

/** Sürü TÜRKVET/GEKİS alan kontrol listesi */
export async function turkvetKontrolListesi(): Promise<{
  satirlar: TurkvetKontrolSatir[];
  tamam: number;
  eksik: number;
}> {
  const animals = (await getAnimals()).filter((a) => a.status !== 'sold' && a.status !== 'dead');
  const satirlar: TurkvetKontrolSatir[] = animals.map((a) => {
    const tv = validateTurkvetNo(a.turkvetNo);
    const gh = validateGehisId(a.gehisId ?? '');
    const eksikler: string[] = [];
    if (!a.turkvetNo.trim()) eksikler.push('TÜRKVET no boş');
    else if (!tv.valid) eksikler.push(tv.message);
    if (a.gehisId && !gh.valid) eksikler.push(gh.message);
    if (!a.birthDate) eksikler.push('Doğum tarihi yok');
    if (!a.breed.trim()) eksikler.push('Irk yok');
    return {
      animalId: a.id,
      earTag: a.earTag,
      turkvetOk: Boolean(a.turkvetNo.trim()) && tv.valid,
      gehisOk: !a.gehisId || gh.valid,
      eksikler,
    };
  });
  const tamam = satirlar.filter((s) => s.eksikler.length === 0).length;
  return { satirlar, tamam, eksik: satirlar.length - tamam };
}

/** CSV dışa aktarım (Excel / resmi ofis) */
export function turkvetCsvOlustur(animals: Animal[]): string {
  const baslik = [
    'turkvetKimlikNo',
    'kulakKupeNo',
    'gehisElektronikKimlik',
    'tur',
    'irk',
    'cinsiyet',
    'dogumTarihi',
    'anneTurkvetNo',
    'durum',
    'padok',
    'sonGuncelleme',
  ];
  const satirlar = animals.map((a) => {
    const r = formatTurkvetExport(a);
    return baslik
      .map((k) => {
        const v = String((r as Record<string, string>)[k] ?? '');
        return `"${v.replace(/"/g, '""')}"`;
      })
      .join(';');
  });
  return [baslik.join(';'), ...satirlar].join('\n');
}

export async function turkvetCsvAktar(): Promise<string> {
  const animals = await getAnimals();
  return turkvetCsvOlustur(animals);
}

/** VETBİS — destek şartı aşıları (bilgi notu; API yok) */
export const VETBIS_ASI_NOTLARI = [
  'PPR (veba) — kuzu/oğlak destek şartı · VETBİS kaydı',
  'Çiçek — destek şartı · VETBİS kaydı',
  'Şap / brusella — resmi program takvimi',
] as const;
