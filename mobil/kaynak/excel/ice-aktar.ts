/**
 * Excel / CSV içe aktarma — saf hesap: sütun eşleme, değer çözme, önizleme, mükerrer küpe.
 * Depoya yazma: ice-aktar-uygula.ts
 */
import type { AnimalSex, AnimalSpecies, AnimalStatus } from '@/kaynak/cekirdek/tipler';

export type HedefAlan =
  | 'earTag'
  | 'turkvetNo'
  | 'sirtNo'
  | 'gehisId'
  | 'name'
  | 'species'
  | 'breed'
  | 'sex'
  | 'birthDate'
  | 'paddock'
  | 'status'
  | 'motherTag'
  | 'kiloKg'
  | 'kiloTarih'
  | 'notes';

export type AlanTanim = { id: HedefAlan; ad: string; zorunlu?: boolean; ornek: string; esAnlam: string[] };

export const HEDEF_ALANLAR: AlanTanim[] = [
  { id: 'earTag', ad: 'Küpe no', zorunlu: true, ornek: 'TR340000012345', esAnlam: ['küpe', 'kupe', 'küpe no', 'kupe no', 'kulak küpesi', 'ear tag', 'eartag', 'tag', 'küpe numarası'] },
  { id: 'turkvetNo', ad: 'TÜRKVET no', ornek: 'TR34…', esAnlam: ['türkvet', 'turkvet', 'türkvet no', 'turkvet no', 'kayıt no'] },
  { id: 'sirtNo', ad: 'Sırt no', ornek: '12', esAnlam: ['sırt', 'sirt', 'sırt no', 'sirt no', 'boya no', 'numara', 'no'] },
  { id: 'gehisId', ad: 'Aref / RFID', ornek: '982000…', esAnlam: ['aref', 'rfid', 'çip', 'cip', 'elektronik küpe', 'gekis', 'gehis'] },
  { id: 'name', ad: 'İsim', ornek: 'Pamuk', esAnlam: ['isim', 'ad', 'adı', 'name', 'hayvan adı'] },
  { id: 'species', ad: 'Tür', ornek: 'Koyun / Keçi', esAnlam: ['tür', 'tur', 'cins', 'species', 'hayvan türü'] },
  { id: 'breed', ad: 'Irk', ornek: 'Merinos', esAnlam: ['ırk', 'irk', 'breed', 'soy'] },
  { id: 'sex', ad: 'Cinsiyet', ornek: 'D / E', esAnlam: ['cinsiyet', 'cins.', 'sex', 'dişi/erkek', 'd/e'] },
  { id: 'birthDate', ad: 'Doğum tarihi', ornek: '15.03.2026', esAnlam: ['doğum', 'dogum', 'doğum tarihi', 'dogum tarihi', 'birth', 'birthdate', 'd.tarihi', 'doğ. tarihi'] },
  { id: 'paddock', ad: 'Padok / parti', ornek: 'Padok A', esAnlam: ['padok', 'parti', 'grup', 'bölme', 'ağıl', 'agil', 'paddock', 'lot'] },
  { id: 'status', ad: 'Durum', ornek: 'Sağlıklı', esAnlam: ['durum', 'sağlık', 'status'] },
  { id: 'motherTag', ad: 'Ana küpe', ornek: 'TR34…', esAnlam: ['ana', 'anne', 'ana küpe', 'anne küpe', 'anneid', 'ana no', 'dam', 'mother'] },
  { id: 'kiloKg', ad: 'Kilo (kg)', ornek: '24,5', esAnlam: ['kilo', 'kg', 'ağırlık', 'agirlik', 'canlı ağırlık', 'weight', 'tartım', 'giriş kilo'] },
  { id: 'kiloTarih', ad: 'Tartım tarihi', ornek: '01.10.2026', esAnlam: ['tartım tarihi', 'tartim tarihi', 'kilo tarihi', 'tarih'] },
  { id: 'notes', ad: 'Not', ornek: '', esAnlam: ['not', 'notlar', 'açıklama', 'aciklama', 'notes', 'not / açıklama'] },
];

/** Sütun indeksi → hedef alan (veya null = alma) */
export type Eslesme = Record<number, HedefAlan | null>;

export function basNorm(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/[ıi̇]/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Başlıklardan otomatik eşleme; her hedef alan en çok bir sütuna */
export function otomatikEslesme(basliklar: string[]): Eslesme {
  const sonuc: Eslesme = {};
  const kullanilan = new Set<HedefAlan>();
  const normlar = basliklar.map(basNorm);
  // 1. tur: tam eşleşme, 2. tur: içerme
  for (const tur of ['tam', 'icerir'] as const) {
    normlar.forEach((b, i) => {
      if (sonuc[i] != null || !b) return;
      const alan = HEDEF_ALANLAR.find(
        (a) =>
          !kullanilan.has(a.id) &&
          [a.ad, a.id, ...a.esAnlam].some((e) => {
            const n = basNorm(e);
            return tur === 'tam' ? n === b : n.length >= 3 && (b.includes(n) || (b.length >= 4 && n.includes(b)));
          }),
      );
      if (alan) {
        sonuc[i] = alan.id;
        kullanilan.add(alan.id);
      }
    });
  }
  basliklar.forEach((_, i) => {
    if (!(i in sonuc)) sonuc[i] = null;
  });
  return sonuc;
}

export function eslesmeDegistir(e: Eslesme, sutun: number, alan: HedefAlan | null): Eslesme {
  const yeni: Eslesme = { ...e };
  if (alan) for (const k of Object.keys(yeni)) if (yeni[Number(k)] === alan) yeni[Number(k)] = null;
  yeni[sutun] = alan;
  return yeni;
}

/** Küpe karşılaştırma anahtarı: boşluk, tire, nokta yok; büyük harf */
export function kupeAnahtar(s: string): string {
  return s.replace(/[\s\-_.]/g, '').toLocaleUpperCase('tr');
}

function iki(n: number) {
  return String(n).padStart(2, '0');
}

/** 15.03.2026, 15/3/26, 2026-03-15, Excel seri sayı (46096) → YYYY-MM-DD */
export function tarihCoz(ham: string): string | null {
  const s = ham.trim();
  if (!s) return null;
  let y: number, m: number, d: number;
  let r = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (r) {
    y = +r[1];
    m = +r[2];
    d = +r[3];
  } else if ((r = s.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{2,4})$/))) {
    d = +r[1];
    m = +r[2];
    y = +r[3];
    if (y < 100) y += 2000;
  } else if (/^\d{4,5}(\.\d+)?$/.test(s)) {
    const seri = Math.floor(Number(s));
    if (seri < 20000 || seri > 80000) return null;
    const t = new Date(Date.UTC(1899, 11, 30) + seri * 86400000);
    return `${t.getUTCFullYear()}-${iki(t.getUTCMonth() + 1)}-${iki(t.getUTCDate())}`;
  } else return null;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCDate() !== d) return null;
  return `${y}-${iki(m)}-${iki(d)}`;
}

export function cinsiyetCoz(ham: string): AnimalSex | null {
  const s = basNorm(ham);
  if (!s) return null;
  if (/^(koc|teke|erkek|erk|e|m|male|male)\b|^(koc|teke|erk)/.test(s)) return 'male';
  if (/^(disi|dis|d|f|female|k|kiz|koyun|keci)\b|^(disi|kiz|koyun|keci|female)/.test(s)) return 'female';
  return null;
}

export function turCoz(ham: string): AnimalSpecies | null {
  const s = basNorm(ham);
  if (!s) return null;
  if (/keci|goat|teke|oglak|caprine/.test(s)) return 'goat';
  if (/koyun|kuzu|koc|sheep|ovine/.test(s)) return 'sheep';
  return null;
}

export function durumCoz(ham: string): AnimalStatus | null {
  const s = basNorm(ham);
  if (!s) return null;
  if (/hasta|sick/.test(s)) return 'sick';
  if (/gebe|pregnant/.test(s)) return 'pregnant';
  if (/sagmal|laktasyon|emziren|lactating/.test(s)) return 'lactating';
  if (/kuru|dry/.test(s)) return 'dry';
  if (/satil|sold|satis/.test(s)) return 'sold';
  if (/old|olu|dead|telef/.test(s)) return 'dead';
  if (/saglik|healthy|aktif|normal/.test(s)) return 'healthy';
  return null;
}

/** "24,5" / "24.5 kg" / "1.024,5" → sayı */
export function sayiCoz(ham: string): number | null {
  let s = ham.trim().replace(/\s*kg$/i, '').replace(/\s/g, '');
  if (!s) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export type SatirDurum = 'yeni' | 'mevcut' | 'dosyada-tekrar' | 'hatali';

export type OnizlemeSatir = {
  satirNo: number;
  durum: SatirDurum;
  hatalar: string[];
  uyarilar: string[];
  veri: Partial<{
    earTag: string;
    turkvetNo: string;
    sirtNo: string;
    gehisId: string;
    name: string;
    species: AnimalSpecies;
    breed: string;
    sex: AnimalSex;
    birthDate: string;
    paddock: string;
    status: AnimalStatus;
    motherTag: string;
    kiloKg: number;
    kiloTarih: string;
    notes: string;
  }>;
};

export type Onizleme = {
  satirlar: OnizlemeSatir[];
  sayac: Record<SatirDurum, number>;
  eksikZorunlu: string[];
};

/**
 * Tablonun ilk satırı başlık. mevcutKupeler: sürüde zaten olan küpe anahtarları.
 */
export function onizle(tablo: string[][], eslesme: Eslesme, mevcutKupeler: Set<string>, bugun = new Date()): Onizleme {
  const eksikZorunlu = HEDEF_ALANLAR.filter((a) => a.zorunlu && !Object.values(eslesme).includes(a.id)).map((a) => a.ad);
  const dosyadaGorulen = new Set<string>();
  const bugunIso = `${bugun.getFullYear()}-${iki(bugun.getMonth() + 1)}-${iki(bugun.getDate())}`;
  const satirlar: OnizlemeSatir[] = [];
  tablo.slice(1).forEach((satir, i) => {
    if (!satir.some((h) => (h ?? '').trim())) return;
    const s: OnizlemeSatir = { satirNo: i + 2, durum: 'yeni', hatalar: [], uyarilar: [], veri: {} };
    for (const [k, alan] of Object.entries(eslesme)) {
      if (!alan) continue;
      const ham = (satir[Number(k)] ?? '').trim();
      if (!ham) continue;
      switch (alan) {
        case 'birthDate':
        case 'kiloTarih': {
          const t = tarihCoz(ham);
          if (!t) s.hatalar.push(`${alan === 'birthDate' ? 'Doğum' : 'Tartım'} tarihi okunamadı: "${ham}"`);
          else if (t > bugunIso) s.uyarilar.push(`${alan === 'birthDate' ? 'Doğum' : 'Tartım'} tarihi ileride`);
          if (t) s.veri[alan] = t;
          break;
        }
        case 'sex': {
          const c = cinsiyetCoz(ham);
          if (!c) s.uyarilar.push(`Cinsiyet anlaşılmadı: "${ham}" (dişi sayıldı)`);
          s.veri.sex = c ?? 'female';
          break;
        }
        case 'species': {
          const t = turCoz(ham);
          if (!t) s.uyarilar.push(`Tür anlaşılmadı: "${ham}" (koyun sayıldı)`);
          s.veri.species = t ?? 'sheep';
          break;
        }
        case 'status': {
          const d = durumCoz(ham);
          if (!d) s.uyarilar.push(`Durum anlaşılmadı: "${ham}"`);
          else s.veri.status = d;
          break;
        }
        case 'kiloKg': {
          const n = sayiCoz(ham);
          if (n == null || n <= 0 || n > 250) s.hatalar.push(`Kilo geçersiz: "${ham}"`);
          else s.veri.kiloKg = n;
          break;
        }
        default:
          s.veri[alan] = ham;
      }
    }
    const kupe = s.veri.earTag ? kupeAnahtar(s.veri.earTag) : '';
    if (!kupe) s.hatalar.push('Küpe no boş');
    if (s.hatalar.length) s.durum = 'hatali';
    else if (dosyadaGorulen.has(kupe)) s.durum = 'dosyada-tekrar';
    else if (mevcutKupeler.has(kupe)) s.durum = 'mevcut';
    if (kupe) dosyadaGorulen.add(kupe);
    satirlar.push(s);
  });
  const sayac: Record<SatirDurum, number> = { yeni: 0, mevcut: 0, 'dosyada-tekrar': 0, hatali: 0 };
  for (const s of satirlar) sayac[s.durum] += 1;
  return { satirlar, sayac, eksikZorunlu };
}

export type TekrarPolitika = 'atla' | 'guncelle';

/** Uygulanacak satırlar: hatalı ve dosya içi tekrar her zaman atlanır */
export function uygulanacaklar(o: Onizleme, politika: TekrarPolitika): OnizlemeSatir[] {
  return o.satirlar.filter((s) => s.durum === 'yeni' || (s.durum === 'mevcut' && politika === 'guncelle'));
}

/** İçe aktarma şablonu (başlık + örnek satır) */
export function sablonTablosu(): string[][] {
  const alanlar = HEDEF_ALANLAR.filter((a) => a.id !== 'gehisId');
  return [
    alanlar.map((a) => a.ad),
    ['TR340000012345', '', '1', '', 'Koyun', 'Merinos', 'E', '15.03.2026', 'Padok A', 'Sağlıklı', '', '24,5', '01.10.2026', ''],
  ].map((r) => r.slice(0, alanlar.length));
}

export const SATIR_DURUM_ETIKET: Record<SatirDurum, string> = {
  yeni: 'Yeni',
  mevcut: 'Küpe sürüde var',
  'dosyada-tekrar': 'Dosyada tekrar',
  hatali: 'Hatalı',
};
