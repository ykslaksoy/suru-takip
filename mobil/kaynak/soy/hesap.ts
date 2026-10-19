/**
 * Soy ağacı ve akrabalık — saf hesap (DB / RN yok).
 * Akrabalık: Wright yöntemi, özyinelemeli kinship (φ) ile.
 *  - Yavrunun kendileşme katsayısı F = φ(baba, ana)
 *  - φ(x,x) = ½ (1 + F_x);  φ(x,y) = ½ [φ(baba_x, y) + φ(ana_x, y)]  (x, y'nin atası olmayan, "daha genç" olan)
 * Ebeveyni bilinmeyen = akraba değil sayılır (0).
 */

export type SoyKaydi = {
  id: string;
  motherId: string | null;
  fatherId?: string | null;
  sex?: 'female' | 'male';
};

export type SoyHarita = Map<string, SoyKaydi>;

export function soyHaritasi(l: SoyKaydi[]): SoyHarita {
  return new Map(l.map((a) => [a.id, a]));
}

function ebeveynler(h: SoyHarita, id: string): [string | null, string | null] {
  const a = h.get(id);
  if (!a) return [null, null];
  return [a.fatherId ?? null, a.motherId ?? null];
}

export type SoyDugum = { id: string | null; baba: SoyDugum | null; ana: SoyDugum | null };

/** nesil: 1 = yalnız kendisi, 3 = kendisi + ebeveyn + büyük ebeveyn */
export function soyAgaci(h: SoyHarita, id: string | null, nesil = 3): SoyDugum {
  if (!id || nesil <= 1) return { id, baba: null, ana: null };
  const [b, a] = ebeveynler(h, id);
  return { id, baba: soyAgaci(h, b, nesil - 1), ana: soyAgaci(h, a, nesil - 1) };
}

/** Bilinen ata sayısı (n nesil içinde, kendisi hariç) */
export function bilinenAtaSayisi(d: SoyDugum): number {
  const say = (x: SoyDugum | null): number => (x && x.id ? 1 + say(x.baba) + say(x.ana) : 0);
  return say(d.baba) + say(d.ana);
}

/** Kendisinden en eski bilinen ataya uzaklık (döngüye karşı korumalı) */
function derinlikHesapla(h: SoyHarita) {
  const memo = new Map<string, number>();
  const yolda = new Set<string>();
  const d = (id: string | null): number => {
    if (!id || !h.has(id)) return 0;
    const m = memo.get(id);
    if (m != null) return m;
    if (yolda.has(id)) return 0; // hatalı (döngülü) kayıt
    yolda.add(id);
    const [b, a] = ebeveynler(h, id);
    const v = 1 + Math.max(d(b), d(a));
    yolda.delete(id);
    memo.set(id, v);
    return v;
  };
  return d;
}

/** Akrabalık hesaplayıcı (aynı harita için önbellekli) */
export function akrabalikHesaplayici(h: SoyHarita) {
  const derinlik = derinlikHesapla(h);
  const memo = new Map<string, number>();
  let adim = 0;
  const phi = (x: string | null, y: string | null): number => {
    if (!x || !y) return 0;
    if (++adim > 200000) return 0;
    const k = x < y ? `${x}|${y}` : `${y}|${x}`;
    const m = memo.get(k);
    if (m != null) return m;
    memo.set(k, 0); // döngü koruması
    let v: number;
    if (x === y) {
      const [b, a] = ebeveynler(h, x);
      v = 0.5 * (1 + phi(b, a));
    } else {
      const [genc, diger] = derinlik(x) >= derinlik(y) ? [x, y] : [y, x];
      if (!h.has(genc)) v = 0;
      else {
        const [b, a] = ebeveynler(h, genc);
        v = 0.5 * (phi(b, diger) + phi(a, diger));
      }
    }
    memo.set(k, v);
    return v;
  };
  /** Hayvanın kendi kendileşme katsayısı */
  const kendilesme = (id: string): number => {
    const [b, a] = ebeveynler(h, id);
    return phi(b, a);
  };
  /** İki hayvan çiftleşirse yavrunun F değeri */
  const yavruF = (x: string, y: string): number => (x === y ? 0.5 : phi(x, y));
  /** Akrabalık derecesi r (0–1): kardeş/ebeveyn ≈ 0,5 */
  const iliski = (x: string, y: string): number => {
    if (x === y) return 1;
    const p = phi(x, y);
    return p === 0 ? 0 : (2 * p) / Math.sqrt((1 + kendilesme(x)) * (1 + kendilesme(y)));
  };
  return { phi, kendilesme, yavruF, iliski };
}

/** İki hayvanın ilişki adı (bilinen bağlarla) */
export function iliskiAdi(h: SoyHarita, x: string, y: string): string | null {
  if (x === y) return 'aynı hayvan';
  const [bx, ax] = ebeveynler(h, x);
  const [by, ay] = ebeveynler(h, y);
  if (bx === y || ax === y) return 'yavru – ebeveyn';
  if (by === x || ay === x) return 'ebeveyn – yavru';
  const ortakB = !!bx && bx === by;
  const ortakA = !!ax && ax === ay;
  if (ortakB && ortakA) return 'öz kardeş';
  if (ortakB || ortakA) return 'üvey kardeş';
  const buyukX = [bx, ax].flatMap((p) => (p ? ebeveynler(h, p) : [])).filter(Boolean);
  const buyukY = [by, ay].flatMap((p) => (p ? ebeveynler(h, p) : [])).filter(Boolean);
  if (buyukX.includes(y)) return 'torun – büyük ebeveyn';
  if (buyukY.includes(x)) return 'büyük ebeveyn – torun';
  const kardes = (u: string, v: string) => {
    if (u === v) return false;
    const [bu, au] = ebeveynler(h, u);
    const [bv, av] = ebeveynler(h, v);
    return (!!bu && bu === bv) || (!!au && au === av);
  };
  if ([by, ay].some((p) => p && kardes(x, p))) return 'amca/hala – yeğen';
  if ([bx, ax].some((p) => p && kardes(y, p))) return 'yeğen – amca/hala';
  if ([bx, ax].some((p) => p && [by, ay].some((q) => q && kardes(p, q)))) return 'kuzen';
  if (buyukX.some((g) => buyukY.includes(g))) return 'uzak akraba (ortak büyük ebeveyn)';
  return null;
}

export type AkrabaSeviye = 'yok' | 'dusuk' | 'orta' | 'yuksek';

/** F eşikleri: ≥ %12,5 yüksek (öz kardeş / ebeveyn %25, üvey kardeş %12,5), ≥ %6,25 orta (kuzen, amca–yeğen üvey), > 0 düşük */
export function akrabaSeviyesi(f: number): AkrabaSeviye {
  if (f >= 0.125 - 1e-9) return 'yuksek';
  if (f >= 0.0625 - 1e-9) return 'orta';
  if (f > 0) return 'dusuk';
  return 'yok';
}

export function yuzde(f: number): string {
  const v = Math.round(f * 1000) / 10;
  return `%${v.toLocaleString('tr-TR')}`;
}

export type CiftlesmeUyarisi = { f: number; seviye: AkrabaSeviye; iliski: string | null; mesaj: string };

/** Koç × koyun eşleşmesi için akrabalık uyarısı */
export function ciftlesmeKontrol(h: SoyHarita, kocId: string, koyunId: string): CiftlesmeUyarisi {
  const hesap = akrabalikHesaplayici(h);
  const f = hesap.yavruF(kocId, koyunId);
  const seviye = akrabaSeviyesi(f);
  const il = iliskiAdi(h, kocId, koyunId);
  const mesaj =
    seviye === 'yuksek'
      ? `⛔ Yakın akraba${il ? ` (${il})` : ''}: kuzuda kendileşme ${yuzde(f)}. Bu eşleşmeyi yapma.`
      : seviye === 'orta'
        ? `⚠️ Akraba${il ? ` (${il})` : ''}: kuzuda kendileşme ${yuzde(f)}. Mümkünse başka koç kullan.`
        : seviye === 'dusuk'
          ? `ℹ️ Uzak akraba: kendileşme ${yuzde(f)}. Sorun değil.`
          : '✅ Bilinen akrabalık yok.';
  return { f, seviye, iliski: il, mesaj };
}

/** Ebeveyn ataması geçerli mi? (kendisi / kendi yavrusu / cinsiyet) */
export function ebeveynDogrula(
  h: SoyHarita,
  id: string,
  rol: 'ana' | 'baba',
  adayId: string | null,
): string | null {
  if (!adayId) return null;
  if (adayId === id) return 'Hayvan kendi ebeveyni olamaz';
  const aday = h.get(adayId);
  if (aday?.sex && aday.sex !== (rol === 'ana' ? 'female' : 'male')) return rol === 'ana' ? 'Ana dişi olmalı' : 'Baba erkek olmalı';
  // aday, bu hayvanın soyundan mı? (döngü)
  const yigin = [adayId];
  const gor = new Set<string>();
  while (yigin.length) {
    const x = yigin.pop()!;
    if (gor.has(x)) continue;
    gor.add(x);
    const [b, a] = ebeveynler(h, x);
    if (b === id || a === id) return 'Seçilen hayvan bunun yavrusu/torunu; ebeveyni olamaz';
    if (b) yigin.push(b);
    if (a) yigin.push(a);
  }
  return null;
}

/** Bir hayvanın yavruları */
export function yavrular(h: SoyHarita, id: string): string[] {
  const l: string[] = [];
  for (const a of h.values()) if (a.motherId === id || a.fatherId === id) l.push(a.id);
  return l;
}
