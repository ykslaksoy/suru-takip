/** CSV yaz / oku — Türkçe Excel ';' ayırıcı kullanır; okurken ; , sekme otomatik bulunur. */
import type { Hucre } from './xlsx';

export const BOM = '\uFEFF';

export function csvHucre(v: Hucre, ayirici = ';'): string {
  const s = v == null ? '' : typeof v === 'number' ? String(v).replace('.', ',') : String(v);
  if (s.includes(ayirici) || /["\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Excel'de doğrudan açılan UTF-8 BOM'lu CSV (TR: ';' ve ondalık virgül) */
export function csvYaz(satirlar: Hucre[][], ayirici = ';'): string {
  return BOM + satirlar.map((r) => r.map((v) => csvHucre(v, ayirici)).join(ayirici)).join('\r\n');
}

/** İlk satıra bakarak ayırıcıyı tahmin eder */
export function ayiriciBul(metin: string): string {
  const ilk = metin.replace(/^\uFEFF/, '').split(/\r?\n/).find((l) => l.trim()) ?? '';
  const say = (c: string) => {
    let n = 0;
    let tirnak = false;
    for (const ch of ilk) {
      if (ch === '"') tirnak = !tirnak;
      else if (!tirnak && ch === c) n += 1;
    }
    return n;
  };
  const adaylar = ['\t', ';', ','].map((c) => [c, say(c)] as const).sort((a, b) => b[1] - a[1]);
  return adaylar[0][1] > 0 ? adaylar[0][0] : ';';
}

/** RFC 4180 benzeri ayrıştırıcı: tırnaklı alan, "" kaçışı, alan içinde yeni satır */
export function csvOku(metin: string, ayirici?: string): string[][] {
  const s = metin.replace(/^\uFEFF/, '');
  const ay = ayirici ?? ayiriciBul(s);
  const satirlar: string[][] = [];
  let satir: string[] = [];
  let alan = '';
  let tirnak = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (tirnak) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          alan += '"';
          i += 1;
        } else tirnak = false;
      } else alan += c;
    } else if (c === '"' && alan === '') tirnak = true;
    else if (c === ay) {
      satir.push(alan);
      alan = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i += 1;
      satir.push(alan);
      satirlar.push(satir);
      satir = [];
      alan = '';
    } else alan += c;
  }
  if (alan !== '' || satir.length) {
    satir.push(alan);
    satirlar.push(satir);
  }
  return satirlar.filter((r) => r.some((h) => h.trim() !== ''));
}
