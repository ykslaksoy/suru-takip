/** Küpe aralığı ayıklama — saf fonksiyonlar (test / Node uyumlu) */

/** Tek seferde güvenlik üst sınırı — 10–100 reklamı yok; saha adedi serbest */
export const TOPLU_KABUL_MAX_ADET = 5000;

export type KupeAralik = {
  onek: string;
  baslangic: number;
  bitis: number;
  genislik: number;
};

function tarafAyikla(s: string): { onek: string; n: number; genislik: number } | null {
  const t = s.trim();
  if (!t) return null;
  const m = t.match(/^(.*?)(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[2], 10);
  if (!Number.isFinite(n)) return null;
  return { onek: m[1], n, genislik: m[2].length };
}

/**
 * "001234–001300", "1001-1100", "TR-34-001–TR-34-100" → aralık.
 * Küpe içindeki tireler (TR-34-…) ile aralık ayırıcısını ayırt eder.
 */
export function kupeAralikAyikla(ham: string, onek = ''): KupeAralik | null {
  const t = ham.trim().replace(/\s/g, '');
  if (!t) return null;

  type Aday = {
    sol: { onek: string; n: number; genislik: number };
    sag: { onek: string; n: number; genislik: number };
    skor: number;
  };
  const adaylar: Aday[] = [];

  for (let i = 1; i < t.length - 1; i++) {
    const ch = t[i];
    if (ch !== '-' && ch !== '–' && ch !== '—') continue;
    const sol = tarafAyikla(t.slice(0, i));
    const sag = tarafAyikla(t.slice(i + 1));
    if (!sol || !sag) continue;
    let skor = 0;
    if (sol.onek === sag.onek) skor += 10;
    if (ch === '–' || ch === '—') skor += 3; // tipografik aralık işareti
    if (sol.onek.length > 0 && sag.onek.length > 0) skor += 2;
    // Sayılar makul aralıkta
    if (Math.abs(sol.n - sag.n) <= TOPLU_KABUL_MAX_ADET) skor += 1;
    adaylar.push({ sol, sag, skor });
  }

  if (adaylar.length === 0) return null;
  adaylar.sort((a, b) => b.skor - a.skor);
  const best = adaylar[0];

  let prefix = onek;
  if (best.sol.onek === best.sag.onek) prefix = best.sol.onek || onek;
  else if (best.sol.onek && !best.sag.onek) prefix = best.sol.onek;
  else if (best.sag.onek && !best.sol.onek) prefix = best.sag.onek;
  else prefix = onek || best.sol.onek;

  return {
    onek: prefix,
    baslangic: Math.min(best.sol.n, best.sag.n),
    bitis: Math.max(best.sol.n, best.sag.n),
    genislik: Math.max(best.sol.genislik, best.sag.genislik),
  };
}

export function aralikEtiketleri(aralik: KupeAralik): string[] {
  const out: string[] = [];
  const n = aralik.bitis - aralik.baslangic + 1;
  if (n < 1 || n > TOPLU_KABUL_MAX_ADET) return out;
  for (let i = aralik.baslangic; i <= aralik.bitis; i++) {
    out.push(`${aralik.onek}${String(i).padStart(aralik.genislik, '0')}`);
  }
  return out;
}

export function aralikAdet(aralik: KupeAralik): number {
  return Math.max(0, aralik.bitis - aralik.baslangic + 1);
}

/**
 * Önek için mevcut küpelerden en büyük sayısal son ek.
 * Örn. önek "TR-1001", etiket "TR-10010060" → 60
 * Not: önek "TR-" iken "TR-34-200001" eşleşmez (suffix saf sayı değil).
 */
export function onekMaxNumara(
  earTags: string[],
  onek: string,
): { max: number; genislik: number } {
  const p = onek.trim();
  let max = 0;
  let genislik = 4;
  for (const raw of earTags) {
    const tag = raw.trim();
    if (!tag.toLocaleUpperCase('tr-TR').startsWith(p.toLocaleUpperCase('tr-TR'))) continue;
    const suffix = tag.slice(p.length);
    if (!/^\d+$/.test(suffix)) continue;
    const n = parseInt(suffix, 10);
    if (!Number.isFinite(n)) continue;
    if (n > max) max = n;
    if (suffix.length > genislik) genislik = suffix.length;
  }
  return { max, genislik };
}

/**
 * Öneri başlangıç: max(önek serisi max+1, kayıtlı hayvan sayısı+1).
 * Önek eşleşmezse (TR- vs TR-34-…) yine sürü toplamına göre 61 vb. üretir.
 */
export function onerilenBaslangicNo(
  earTags: string[],
  onek: string,
  toplamHayvan: number,
): number {
  const { max } = onekMaxNumara(earTags, onek);
  const onekSonraki = max + 1;
  const suruSonraki = Math.max(0, Math.floor(toplamHayvan)) + 1;
  return Math.max(onekSonraki, suruSonraki);
}

/** Otomatik sıra: max(önek max+1, sürü+1); isteğe bağlı kullanıcı başlangıcı. */
export function otomatikKupeSerisi(opts: {
  onek: string;
  adet: number;
  mevcutEarTags: string[];
  /** Kayıtlı hayvan sayısı — önek eşleşmese bile toplam+1 için */
  toplamHayvan?: number;
  /** Kullanıcı açıkça başlangıç verdiyse onu kullan (çakışmada UI uyarır) */
  baslangic?: number;
}): { etiketler: string[]; baslangic: number; bitis: number; neden: string } {
  const onek = (opts.onek.trim() || 'TR-');
  const adet = Math.floor(opts.adet);
  if (adet < 1) return { etiketler: [], baslangic: 0, bitis: 0, neden: '' };

  const { max, genislik: gMevcut } = onekMaxNumara(opts.mevcutEarTags, onek);
  const toplam =
    opts.toplamHayvan != null && Number.isFinite(opts.toplamHayvan)
      ? Math.floor(opts.toplamHayvan)
      : opts.mevcutEarTags.length;
  const sonraki = onerilenBaslangicNo(opts.mevcutEarTags, onek, toplam);
  const baslangic =
    opts.baslangic != null && Number.isFinite(opts.baslangic) && opts.baslangic >= 1
      ? Math.floor(opts.baslangic)
      : sonraki;
  const bitis = baslangic + adet - 1;
  const genislik = Math.max(4, gMevcut, String(bitis).length);
  const etiketler: string[] = [];
  for (let i = baslangic; i <= bitis; i++) {
    etiketler.push(`${onek}${String(i).padStart(genislik, '0')}`);
  }
  const neden =
    opts.baslangic != null && Number.isFinite(opts.baslangic)
      ? `Girdiğiniz başlangıç ${baslangic}`
      : max > 0 && max + 1 >= sonraki
        ? `Önek «${onek}» serisinde son küpe ${max} → sonraki ${baslangic}`
        : toplam > 0
          ? `Kayıtlı ${toplam} hayvan → sonraki ${baslangic}`
          : `Kayıt yok → 1’den başlar`;
  return { etiketler, baslangic, bitis, neden };
}
