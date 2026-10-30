/**
 * TÜRKVET / VETBİS / GEKİS veri köprüsü.
 *
 * Tarım ve Orman Bakanlığı TÜRKVET/VETBİS için üçüncü taraf uygulamalara açık bir
 * resmi API yayınlamıyor (bildirim e-Devlet / il-ilçe müdürlüğü / yetkili veteriner
 * hekim üzerinden yapılır). Bu yüzden köprü: eksiksiz CSV dışa aktarım + CSV içe
 * aktarım (resmi listeden TÜRKVET/GEKİS no eşleme) + alan doğrulama. Sahte/“yakında”
 * API yolu yoktur.
 */

import type { Animal } from '@/kaynak/cekirdek/tipler';
import { getAnimals, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { formatTurkvetExport, validateGehisId, validateTurkvetNo } from './dogrula';
import { TURKVET_CSV_BASLIK, turkvetCsvCoz, type TurkvetIceSatir } from './csv';
export { TURKVET_CSV_BASLIK, turkvetCsvCoz, csvSatirBol, type TurkvetIceSatir } from './csv';

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
  const baslik = TURKVET_CSV_BASLIK;
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

export type TurkvetIceAktarRapor = {
  guncellenen: number;
  degisiklikYok: number;
  bulunamayan: string[];
  hatali: TurkvetIceSatir[];
  hata?: string;
};

function kupeAnahtar(k: string): string {
  return k.replace(/[\s\-_.]/g, '').toUpperCase();
}

/** Resmi listeden (CSV) TÜRKVET / GEKİS numaralarını küpe eşlemesiyle sürüye yaz */
export async function turkvetCsvIceAktar(csv: string, opts?: { kuruCalisma?: boolean }): Promise<TurkvetIceAktarRapor> {
  const { satirlar, hata } = turkvetCsvCoz(csv);
  const rapor: TurkvetIceAktarRapor = { guncellenen: 0, degisiklikYok: 0, bulunamayan: [], hatali: [], hata };
  if (hata) return rapor;
  const hayvanlar = await getAnimals();
  const harita = new Map(hayvanlar.map((a) => [kupeAnahtar(a.earTag), a]));
  for (const r of satirlar) {
    if (r.hatalar.length) {
      rapor.hatali.push(r);
      continue;
    }
    const a = harita.get(kupeAnahtar(r.kulakKupeNo));
    if (!a) {
      rapor.bulunamayan.push(r.kulakKupeNo);
      continue;
    }
    const yeniTv = r.turkvetKimlikNo ? r.turkvetKimlikNo.replace(/\s/g, '').toUpperCase() : a.turkvetNo;
    const yeniGh = r.gehisElektronikKimlik ? r.gehisElektronikKimlik.replace(/\s/g, '') : a.gehisId ?? null;
    if (yeniTv === a.turkvetNo && (yeniGh ?? null) === (a.gehisId ?? null)) {
      rapor.degisiklikYok++;
      continue;
    }
    if (!opts?.kuruCalisma) await upsertAnimal({ ...a, turkvetNo: yeniTv, gehisId: yeniGh });
    rapor.guncellenen++;
  }
  return rapor;
}

/** VETBİS — destek şartı aşıları (bilgi notu) */
export const VETBIS_ASI_NOTLARI = [
  'PPR (veba) — kuzu/oğlak destek şartı · VETBİS kaydı',
  'Çiçek — destek şartı · VETBİS kaydı',
  'Şap / brusella — resmi program takvimi',
] as const;
