/**
 * Küçük, bağımlılıksız iki aşamalı simpleks (tablo yöntemi, Bland kuralı — döngüye girmez).
 * min c·x,  A_i·x (<=|>=|=) b_i,  x >= 0.  Rasyon formülasyonu gibi ~20 değişkenli problemler için.
 */
export type Kisit = { a: number[]; tip: '<=' | '>=' | '='; b: number };
export type LpSonuc = { durum: 'optimal' | 'uygunsuz' | 'sinirsiz'; x: number[]; deger: number };

const EPS = 1e-9;

export function simpleks(c: number[], kisitlar: Kisit[]): LpSonuc {
  const n = c.length;
  const m = kisitlar.length;
  // b >= 0 olacak şekilde normalize
  const rows = kisitlar.map((k) => {
    if (k.b < 0) return { a: k.a.map((v) => -v), b: -k.b, tip: k.tip === '<=' ? '>=' : k.tip === '>=' ? '<=' : '=' } as Kisit;
    return { a: [...k.a], b: k.b, tip: k.tip };
  });
  const nSlack = rows.filter((r) => r.tip !== '=').length;
  const nArt = rows.filter((r) => r.tip !== '<=').length;
  const W = n + nSlack + nArt; // değişken sayısı
  const T: number[][] = [];
  const baz: number[] = [];
  const yapay: number[] = [];
  let si = n;
  let ai = n + nSlack;
  for (const r of rows) {
    const row = new Array(W + 1).fill(0);
    for (let j = 0; j < n; j++) row[j] = r.a[j] ?? 0;
    row[W] = r.b;
    if (r.tip === '<=') {
      row[si] = 1;
      baz.push(si++);
    } else {
      if (r.tip === '>=') row[si++] = -1;
      row[ai] = 1;
      yapay.push(ai);
      baz.push(ai++);
    }
    T.push(row);
  }

  const pivot = (r: number, col: number) => {
    const pv = T[r][col];
    for (let j = 0; j <= W; j++) T[r][j] /= pv;
    for (let i = 0; i < m; i++) {
      if (i === r) continue;
      const f = T[i][col];
      if (Math.abs(f) > EPS) for (let j = 0; j <= W; j++) T[i][j] -= f * T[r][j];
    }
    baz[r] = col;
  };

  /** cost vektörüyle optimize et; izinli sütunlar */
  const coz = (cost: number[], izin: (j: number) => boolean): 'optimal' | 'sinirsiz' => {
    for (let it = 0; it < 5000; it++) {
      // indirgenmiş maliyetler
      let giren = -1;
      for (let j = 0; j < W; j++) {
        if (!izin(j) || baz.includes(j)) continue;
        let d = cost[j];
        for (let i = 0; i < m; i++) d -= cost[baz[i]] * T[i][j];
        if (d < -1e-9) {
          giren = j; // Bland: en küçük indeks
          break;
        }
      }
      if (giren < 0) return 'optimal';
      let cikan = -1;
      let enIyi = Infinity;
      for (let i = 0; i < m; i++) {
        if (T[i][giren] > EPS) {
          const o = T[i][W] / T[i][giren];
          if (o < enIyi - 1e-12 || (Math.abs(o - enIyi) <= 1e-12 && baz[i] < baz[cikan])) {
            enIyi = o;
            cikan = i;
          }
        }
      }
      if (cikan < 0) return 'sinirsiz';
      pivot(cikan, giren);
    }
    return 'optimal';
  };

  const yapaySet = new Set(yapay);
  if (yapay.length) {
    const c1 = new Array(W).fill(0);
    for (const j of yapay) c1[j] = 1;
    coz(c1, () => true);
    const kalan = baz.reduce((s, j, i) => s + (yapaySet.has(j) ? T[i][W] : 0), 0);
    if (kalan > 1e-7) return { durum: 'uygunsuz', x: new Array(n).fill(0), deger: NaN };
    // bazda kalan (0 değerli) yapayları dışarı al
    for (let i = 0; i < m; i++) {
      if (!yapaySet.has(baz[i])) continue;
      const j = T[i].findIndex((v, k) => k < W && !yapaySet.has(k) && Math.abs(v) > EPS);
      if (j >= 0) pivot(i, j);
    }
  }
  const c2 = new Array(W).fill(0);
  for (let j = 0; j < n; j++) c2[j] = c[j];
  const d = coz(c2, (j) => !yapaySet.has(j));
  const x = new Array(n).fill(0);
  baz.forEach((j, i) => {
    if (j < n) x[j] = T[i][W];
  });
  return { durum: d, x, deger: x.reduce((s, v, j) => s + v * c[j], 0) };
}
