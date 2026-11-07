import { partiAdiCoz } from '@/kaynak/toplu/secim';
import type { DogumKuzuSes, SesKomutEylemi } from './tipler';
import { kiloYakala, kupeYakala, sayiYakala } from './komut';

function norm(metin: string): string {
  return metin.trim().replace(/\s+/g, ' ');
}

const SIRA_SAYI: Record<string, number> = {
  birinci: 1,
  birincı: 1,
  '1': 1,
  ikinci: 2,
  '2': 2,
  üçüncü: 3,
  ucuncu: 3,
  '3': 3,
};

export function bugunYerelIso(ref = new Date()): string {
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  const d = String(ref.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function hatirlatmaTarihiYakala(metin: string, bugun?: string): string | null {
  const b = bugun ?? bugunYerelIso();
  const n = metin.toLocaleLowerCase('tr-TR');
  if (/\bbugün\b/.test(n)) return b;
  if (/\byarın\b/.test(n)) {
    const t = new Date(`${b}T12:00:00`);
    t.setDate(t.getDate() + 1);
    return bugunYerelIso(t);
  }
  const m = n.match(/\b(\d{1,2})\s*gün\s*sonra\b/);
  if (m) {
    const t = new Date(`${b}T12:00:00`);
    t.setDate(t.getDate() + parseInt(m[1], 10));
    return bugunYerelIso(t);
  }
  const iso = metin.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const tr = metin.match(/\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b/);
  if (tr) {
    return `${tr[3]}-${tr[2].padStart(2, '0')}-${tr[1].padStart(2, '0')}`;
  }
  return null;
}

export function parseBilgi(metin: string): SesKomutEylemi | null {
  const n = norm(metin).toLocaleLowerCase('tr-TR');
  if (/(bugün|bu gün).*(aşı|asi|görev)/i.test(n) || /(aşı|asi).*(bugün|bu gün)/i.test(n)) {
    return { tur: 'bilgi', soru: 'bugun_asi_ozet' };
  }
  if (/(son\s*(tartım|tartim|kilo)|kaç\s*kilo|ne\s*kadar\s*kilo)/i.test(n)) {
    const k = kupeYakala(metin);
    if (!k) return null;
    if (kiloYakala(metin) != null && /,/.test(metin)) return null;
    return { tur: 'bilgi', soru: 'son_kilo', kupeArama: k };
  }
  return null;
}

export function parseTartimDuzelt(metin: string): SesKomutEylemi | null {
  const n = norm(metin);
  if (!/(düzelt|duzelt|yanlış\s*kilo|hatalı\s*tartım)/i.test(n)) return null;
  const k = kupeYakala(n);
  const kg = kiloYakala(n) ?? sayiYakala(n);
  if (!k || kg == null) return null;
  return { tur: 'tartim_duzelt', kupeArama: k, yeniKg: kg };
}

export function parsePadokTasi(metin: string): SesKomutEylemi | null {
  const n = norm(metin);
  if (!/(taşı|tasi|aktar|geçir|padok)/i.test(n)) return null;
  const k = kupeYakala(n);
  if (!k) return null;
  const padokM =
    n.match(/\b(?:padok|parti)\s+([a-z0-9çğıöşü\-]+)/i) ??
    n.match(/\b([a-z])\s+padok(?:a|una|una)?\b/i) ??
    n.match(/\b(birinci|ikinci|üçüncü|ucuncu|\d)\s*\.?\s*(?:parti|padok)(?:ya|ye|a)?\b/i);
  if (!padokM) return null;
  const ham = padokM[1].replace(/\./g, '');
  return { tur: 'padok_tasi', kupeArama: k, padokHedef: partiAdiCoz(ham) };
}

const GOZLEM_RE =
  /(iştahsız|istahsiz|halsiz|ateş|ates|öksürük|oksuruk|aksırdı|ishal|topallıyor|topalliyor|göz|goz|nefes)/i;

export function parseGozlemHatirlat(metin: string): SesKomutEylemi | null {
  const n = norm(metin);
  if (!GOZLEM_RE.test(n) && !/(gözlem|not|hatırlat|kontrol)/i.test(n)) return null;
  const k = kupeYakala(n);
  if (!k) return null;
  const gozlemM = n.match(GOZLEM_RE);
  const gozlem = gozlemM ? gozlemM[0] : n.replace(new RegExp(k, 'i'), '').trim().slice(0, 80);
  if (!gozlem) return null;
  const tarih = hatirlatmaTarihiYakala(n);
  if (!tarih) return null;
  if (!/(hatırlat|hatirlat|kontrol|tekrar\s*bak)/i.test(n)) return null;
  return { tur: 'gozlem_hatirlat', kupeArama: k, gozlem, hatirlatmaTarihi: tarih };
}

export function parsePadokYem(metin: string): SesKomutEylemi | null {
  const n = norm(metin);
  if (!/(verildi|verdim|yedirdim|tüketim|tuketim|yem\s*ver)/i.test(n)) return null;
  if (/(stok\s*giriş|stok\s*giris|depoya\s*giriş)/i.test(n)) return null;
  const padokM = n.match(
    /\b(birinci|ikinci|üçüncü|ucuncu|\d)\s*\.?\s*(?:parti|padok)(?:ya|ye|a|daki|deki)?\b/i,
  );
  const padok2 = n.match(/\b(?:padok|parti)\s+([a-z0-9çğıöşü])/i);
  const ham = padokM?.[1] ?? padok2?.[1];
  if (!ham) return null;
  const kg = kiloYakala(n) ?? sayiYakala(n);
  if (kg == null) return null;
  const yemAdi = n.match(/(?:yem|arpa|yonca|saman|karma)\s*(\w+)?/i)?.[0];
  const tarih = hatirlatmaTarihiYakala(n) ?? bugunYerelIso();
  return {
    tur: 'padok_yem',
    padokHam: ham,
    miktarKg: kg,
    yemAdi: yemAdi?.trim(),
    tarih,
  };
}

function ikizSayi(metin: string): number | null {
  const n = metin.toLocaleLowerCase('tr-TR');
  if (/ikiz/.test(n)) return 2;
  if (/üçüz|ucuz/.test(n)) return 3;
  const m = n.match(/(\d)\s*(?:kuzu|doğum)/);
  if (m) {
    const s = parseInt(m[1], 10);
    if (s >= 1 && s <= 4) return s;
  }
  return null;
}

export function parseDogum(metin: string): SesKomutEylemi | null {
  const n = norm(metin);
  if (!/(doğurdu|dogurdu|doğum|dogum)/i.test(n)) return null;
  const k = kupeYakala(n);
  if (!k) return null;
  const sayi = ikizSayi(n);
  if (sayi == null) return null;
  const tarih = hatirlatmaTarihiYakala(n) ?? bugunYerelIso();
  const padokM = n.match(/\b(?:padok|parti)\s+([a-z0-9çğıöşü])/i);
  const kuzular: DogumKuzuSes[] = [];
  const kupeList = [...n.matchAll(/\b(TR[\s\-]?\d[\d\-./]+|\d{4,6})\b/gi)]
    .map((m) => m[1].replace(/\s+/g, '').toUpperCase())
    .filter((t) => t !== k && /\d/.test(t));
  const cinsiyetM = n.match(/\b(erkek|dişi|disi|kız|kiz)\b/gi) ?? [];
  for (let i = 0; i < Math.min(sayi, kupeList.length); i++) {
    const c = cinsiyetM[i]?.toLocaleLowerCase('tr-TR');
    const sex = c === 'dişi' || c === 'disi' || c === 'kız' || c === 'kiz' ? 'female' : 'male';
    kuzular.push({ earTag: kupeList[i], sex });
  }
  if (kuzular.length < sayi) return null;
  return {
    tur: 'dogum',
    anneArama: k,
    birthDate: tarih,
    kuzular,
    paddock: padokM ? partiAdiCoz(padokM[1]) : undefined,
  };
}

export function parseGelismisKomut(metin: string): SesKomutEylemi | null {
  return (
    parseBilgi(metin) ??
    parseTartimDuzelt(metin) ??
    parseDogum(metin) ??
    parsePadokYem(metin) ??
    parseGozlemHatirlat(metin) ??
    parsePadokTasi(metin)
  );
}

/** Eksik alan — otomatik uydurma yok */
export function gelismisEksikAyikla(metin: string): string | null {
  const n = norm(metin);
  if (/(doğurdu|dogurdu)/i.test(n) && kupeYakala(n) && ikizSayi(n) != null && parseDogum(n) === null) {
    return 'Doğum için her kuzu küpe numarası (ve gerekiyorsa cinsiyet) açık söylenmeli.';
  }
  if (GOZLEM_RE.test(n) && kupeYakala(n) && /(hatırlat|kontrol)/i.test(n) && !hatirlatmaTarihiYakala(n)) {
    return 'Hatırlatma için tarih gerekli (örn. yarın, 3 gün sonra, 2026-11-10).';
  }
  return null;
}
