/** TÜRKVET CSV — saf ayrıştırma + doğrulama (veritabanı bağımsız) */
import { validateGehisId, validateTurkvetNo } from './dogrula';

export const TURKVET_CSV_BASLIK = [
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
] as const;

/** RFC4180 benzeri CSV satır ayrıştırıcı (; veya , ayırıcı, tırnaklı alan) */
export function csvSatirBol(satir: string, ayirici: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < satir.length; i++) {
    const c = satir[i];
    if (q) {
      if (c === '"' && satir[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ayirici) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

export type TurkvetIceSatir = {
  satirNo: number;
  kulakKupeNo: string;
  turkvetKimlikNo: string;
  gehisElektronikKimlik: string;
  hatalar: string[];
};

const BASLIK_ESLER: Record<string, keyof Omit<TurkvetIceSatir, 'satirNo' | 'hatalar'>> = {
  turkvetkimlikno: 'turkvetKimlikNo',
  turkvetno: 'turkvetKimlikNo',
  'türkvet kimlik no': 'turkvetKimlikNo',
  kimlikno: 'turkvetKimlikNo',
  kulakkupeno: 'kulakKupeNo',
  'kulak küpe no': 'kulakKupeNo',
  kupeno: 'kulakKupeNo',
  kupe: 'kulakKupeNo',
  gehiselektronikkimlik: 'gehisElektronikKimlik',
  gehis: 'gehisElektronikKimlik',
  'gekis elektronik kimlik': 'gehisElektronikKimlik',
};

function baslikAnahtar(h: string): string {
  return h.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ğ/g, 'g');
}

/** CSV metnini çöz + her satırı doğrula (veriye yazmaz) */
export function turkvetCsvCoz(csv: string): { satirlar: TurkvetIceSatir[]; hata?: string } {
  const satirlar = csv.replace(/\r\n?/g, '\n').split('\n').filter((s) => s.trim());
  if (satirlar.length < 2) return { satirlar: [], hata: 'CSV en az başlık + 1 satır içermeli' };
  const ayirici = (satirlar[0].match(/;/g)?.length ?? 0) >= (satirlar[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const basliklar = csvSatirBol(satirlar[0], ayirici).map((h) => {
    const k = baslikAnahtar(h);
    return BASLIK_ESLER[k] ?? BASLIK_ESLER[k.replace(/\s/g, '')] ?? null;
  });
  if (!basliklar.includes('kulakKupeNo')) return { satirlar: [], hata: 'Başlıkta kulak küpe no sütunu yok (kulakKupeNo)' };
  if (!basliklar.includes('turkvetKimlikNo') && !basliklar.includes('gehisElektronikKimlik')) {
    return { satirlar: [], hata: 'Başlıkta TÜRKVET no veya GEKİS sütunu yok' };
  }
  const sonuc: TurkvetIceSatir[] = satirlar.slice(1).map((s, i) => {
    const h = csvSatirBol(s, ayirici);
    const r: TurkvetIceSatir = { satirNo: i + 2, kulakKupeNo: '', turkvetKimlikNo: '', gehisElektronikKimlik: '', hatalar: [] };
    basliklar.forEach((b, j) => {
      if (b) r[b] = (h[j] ?? '').trim();
    });
    if (!r.kulakKupeNo) r.hatalar.push('Küpe no boş');
    const tv = validateTurkvetNo(r.turkvetKimlikNo);
    if (!tv.valid) r.hatalar.push(tv.message);
    const gh = validateGehisId(r.gehisElektronikKimlik);
    if (!gh.valid) r.hatalar.push(gh.message);
    if (!r.turkvetKimlikNo && !r.gehisElektronikKimlik) r.hatalar.push('TÜRKVET ve GEKİS ikisi de boş');
    return r;
  });
  const gorulen = new Map<string, number>();
  for (const r of sonuc) {
    if (!r.turkvetKimlikNo) continue;
    const k = r.turkvetKimlikNo.toUpperCase();
    if (gorulen.has(k)) r.hatalar.push(`TÜRKVET no ${gorulen.get(k)}. satırla aynı`);
    else gorulen.set(k, r.satirNo);
  }
  return { satirlar: sonuc };
}

