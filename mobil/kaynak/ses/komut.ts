import type { SesKomutEylemi } from './tipler';

function normalize(metin: string): string {
  return metin.trim().replace(/\s+/g, ' ');
}

const ASI_RE = /(aşı|asi|vaccine)/i;
const STOK_GIRIS_RE = /(?:stok\s*)?giriş|giris|ekle|artır|artir/i;
const STOK_CIKIS_RE = /(?:stok\s*)?çıkış|cikis|düş|dus|azalt/i;
const KILO_BIRIM_RE = /(\d+(?:[.,]\d+)?)\s*(?:kilo(?:gram)?|kg)\b/i;

function sayi(raw: string): number | null {
  const val = parseFloat(raw.replace(',', '.'));
  return Number.isFinite(val) && val > 0 ? val : null;
}

type KupeEslesme = { kupe: string; bas: number; son: number };

const KUPE_DESENLERI: RegExp[] = [
  /(?:küpe|kupe|kulak(?:\s*küpesi)?|tag)\s*(?:no|numara(?:sı|si)?)?\s*[:\-]?\s*([a-z0-9\-./]+)/i,
  /\b(TR[\s\-]?\d[\d\-./]*)\b/i,
  // Sade sayı küpe: ardından kilo birimi gelmesin (o zaman ağırlıktır)
  /\b(\d{3,6})\b(?!\s*(?:[.,]\d+)?\s*(?:kilo|kg)\b)/i,
];

/** Metindeki küpe numarası ve metindeki konumu */
function kupeBul(metin: string): KupeEslesme | null {
  for (const p of KUPE_DESENLERI) {
    const m = p.exec(metin);
    if (m?.[1]) {
      const ham = m[1].replace(/[.\-/]+$/, '');
      if (!/\d/.test(ham)) continue;
      const bas = m.index + m[0].lastIndexOf(m[1]);
      return { kupe: ham.replace(/\s+/g, '').toUpperCase(), bas, son: bas + m[1].length };
    }
  }
  return null;
}

/** Yalnızca küpe numarasını döndürür (düzeltme cevabı vb. için) */
export function kupeYakala(metin: string): string | null {
  const k = kupeBul(normalize(metin));
  if (k) return k.kupe;
  const m = metin.match(/\b([a-z]{0,3}\d[\d\-./]*)\b/i);
  return m ? m[1].toUpperCase() : null;
}

/**
 * Kilo — küpe numarasının geçtiği bölüm ÇIKARILARAK aranır.
 * Böylece tek sayı ("1200") hem küpe hem kilo olarak kullanılmaz.
 */
function kiloBul(metin: string, kupe: KupeEslesme | null): number | null {
  const kalan = kupe ? `${metin.slice(0, kupe.bas)} ${metin.slice(kupe.son)}` : metin;
  const birimli = kalan.match(KILO_BIRIM_RE);
  if (birimli) return sayi(birimli[1]);
  if (!kupe) return null;
  const herhangi = kalan.match(/(\d+(?:[.,]\d+)?)/);
  return herhangi ? sayi(herhangi[1]) : null;
}

/** Metinde açık "X kilo / kg" var mı? */
export function kiloYakala(metin: string): number | null {
  const m = metin.match(KILO_BIRIM_RE);
  return m ? sayi(m[1]) : null;
}

/** İlk sayı (birimsiz cevaplar için: "68") */
export function sayiYakala(metin: string): number | null {
  const m = metin.match(/(\d+(?:[.,]\d+)?)/);
  return m ? sayi(m[1]) : null;
}

function stokMu(metin: string): boolean {
  return /\bstok\b/i.test(metin) || STOK_GIRIS_RE.test(metin) || STOK_CIKIS_RE.test(metin);
}

function parseTartim(metin: string): SesKomutEylemi | null {
  // Aşı / stok komutları tartım sanılmasın (birimli kilo yoksa)
  if ((ASI_RE.test(metin) || stokMu(metin)) && !KILO_BIRIM_RE.test(metin)) return null;
  const kupe = kupeBul(metin);
  if (!kupe) return null;
  const kilo = kiloBul(metin, kupe);
  if (kilo == null) return null;
  return { tur: 'tartim', kupeArama: kupe.kupe, kiloKg: kilo };
}

function asiAdiBul(metin: string): string | null {
  const asiMatch = metin.match(/(?:aşı|asi)(?:sı|si)?\s*[:\-]?\s*(.+?)(?:$|,|\.)/i);
  const ad = asiMatch?.[1]?.trim();
  return ad ? ad : null;
}

function parseAsi(metin: string): SesKomutEylemi | null {
  if (!ASI_RE.test(metin)) return null;
  const kupe = kupeBul(metin);
  const asiAdi = asiAdiBul(metin);
  if (!kupe || !asiAdi) return null;
  return { tur: 'asi', kupeArama: kupe.kupe, asiAdi };
}

function parseStok(metin: string): SesKomutEylemi | null {
  const giris = STOK_GIRIS_RE.test(metin);
  const cikis = STOK_CIKIS_RE.test(metin);
  if (!giris && !cikis) return null;

  const miktarMatch = metin.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilo|doz|adet|flakon|litre|lt|ton)?/i);
  if (!miktarMatch) return null;

  const miktar = parseFloat(miktarMatch[1].replace(',', '.'));
  const birim = miktarMatch[2]?.toLowerCase() ?? 'adet';

  const stokAdiMatch = metin.match(
    /(?:stok|yem|aşı|asi|ilaç|ilac)\s*[:\-]?\s*(.+?)(?:\s+\d|$)/i
  );
  const stokAdi = stokAdiMatch?.[1]?.trim() ?? 'Stok';

  return {
    tur: 'stok',
    stokAdi,
    miktar,
    birim,
    yon: cikis ? 'cikis' : 'giris',
  };
}

/** Ham konuşma/metin → yapılandırılmış komut (henüz uygulanmaz) */
export function komutAyikla(metin: string): SesKomutEylemi | null {
  const n = normalize(metin);
  if (!n) return null;

  return parseTartim(n) ?? parseAsi(n) ?? parseStok(n);
}

/** Bir alanı eksik kayıt — kullanıcıya soru sorulur */
export type EksikKayit =
  | { tur: 'tartim'; kupeArama?: string; kiloKg?: number }
  | { tur: 'asi'; kupeArama?: string; asiAdi?: string };

/** Eksik alan için sorulacak kısa soru */
export function eksikSorusu(e: EksikKayit): string {
  if (!e.kupeArama) return 'Küpe numarası kaç?';
  if (e.tur === 'tartim') return 'Kilo kaç?';
  return 'Hangi aşı?';
}

/**
 * Tam komut değil ama bir alanı belli (örn. sadece "1200") →
 * eksik kayıt. Hiç anlamlı alan yoksa null.
 */
export function eksikKayitAyikla(metin: string): EksikKayit | null {
  const n = normalize(metin);
  if (!n) return null;
  if (ASI_RE.test(n)) {
    const kupe = kupeBul(n)?.kupe;
    const asiAdi = asiAdiBul(n) ?? undefined;
    if (!kupe && !asiAdi) return { tur: 'asi' };
    return { tur: 'asi', kupeArama: kupe, asiAdi };
  }
  if (stokMu(n)) return null;
  const kupe = kupeBul(n);
  const kilo = kiloBul(n, kupe);
  if (kupe && kilo == null) return { tur: 'tartim', kupeArama: kupe.kupe };
  if (!kupe && kilo != null) return { tur: 'tartim', kiloKg: kilo };
  return null;
}

/** Eksik kaydı cevapla tamamla; hâlâ eksikse güncellenmiş eksik kayıt döner. */
export function eksikTamamla(
  e: EksikKayit,
  cevap: string,
): { eylem: SesKomutEylemi } | { eksik: EksikKayit } | null {
  const n = normalize(cevap);
  if (!n) return null;
  if (e.tur === 'tartim') {
    const yeni = { ...e };
    if (!yeni.kupeArama) {
      const k = kupeYakala(n);
      if (!k) return null;
      yeni.kupeArama = k;
    } else if (yeni.kiloKg == null) {
      const kg = kiloYakala(n) ?? sayiYakala(n);
      if (kg == null) return null;
      yeni.kiloKg = kg;
    }
    if (yeni.kupeArama && yeni.kiloKg != null) {
      return { eylem: { tur: 'tartim', kupeArama: yeni.kupeArama, kiloKg: yeni.kiloKg } };
    }
    return { eksik: yeni };
  }
  const yeni = { ...e };
  if (!yeni.kupeArama) {
    const k = kupeYakala(n);
    if (!k) return null;
    yeni.kupeArama = k;
  } else if (!yeni.asiAdi) {
    yeni.asiAdi = n.replace(/^(?:aşı|asi)(?:sı|si)?\s*/i, '').trim() || undefined;
    if (!yeni.asiAdi) return null;
  }
  if (yeni.kupeArama && yeni.asiAdi) {
    return { eylem: { tur: 'asi', kupeArama: yeni.kupeArama, asiAdi: yeni.asiAdi } };
  }
  return { eksik: yeni };
}
