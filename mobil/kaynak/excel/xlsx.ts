/**
 * Bağımlılıksız (yalnız fflate zip) küçük .xlsx yazıcı / okuyucu.
 * Yazma: satır içi metin (inlineStr) + sayı; ilk satır kalın başlık, dondurulmuş.
 * Okuma: sharedStrings, inlineStr, sayı, boolean; boş hücre boşluklarını doldurur.
 */
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

export type Hucre = string | number | null | undefined;
export type Sayfa = { ad: string; satirlar: Hucre[][] };
export type OkunanSayfa = { ad: string; satirlar: string[][] };

function xmlKac(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // XML 1.0'da geçersiz kontrol karakterleri
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function xmlCoz(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

/** 0 → A, 25 → Z, 26 → AA */
export function sutunHarf(i: number): string {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** "AB12" → 27 */
export function harfSutun(ref: string): number {
  const m = ref.match(/^([A-Z]+)/i);
  if (!m) return 0;
  let n = 0;
  for (const c of m[1].toUpperCase()) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

/** Excel sayfa adı: en çok 31 karakter, []:*?/\ yok, benzersiz */
function sayfaAdlari(adlar: string[]): string[] {
  const kul = new Set<string>();
  return adlar.map((a, i) => {
    let ad = (a || `Sayfa${i + 1}`).replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || `Sayfa${i + 1}`;
    let k = 2;
    const kok = ad.slice(0, 28);
    while (kul.has(ad.toLocaleLowerCase('tr'))) ad = `${kok} ${k++}`;
    kul.add(ad.toLocaleLowerCase('tr'));
    return ad;
  });
}

function sayfaXml(satirlar: Hucre[][]): string {
  const genislik = new Map<number, number>();
  const rows = satirlar
    .map((satir, r) => {
      const hucreler = satir
        .map((v, c) => {
          if (v == null || v === '') return '';
          const ref = `${sutunHarf(c)}${r + 1}`;
          const uz = String(v).length;
          genislik.set(c, Math.max(genislik.get(c) ?? 8, Math.min(50, uz + 2)));
          const stil = r === 0 ? ' s="1"' : '';
          if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${stil}><v>${v}</v></c>`;
          return `<c r="${ref}" t="inlineStr"${stil}><is><t xml:space="preserve">${xmlKac(String(v))}</t></is></c>`;
        })
        .join('');
      return `<row r="${r + 1}">${hucreler}</row>`;
    })
    .join('');
  const cols = [...genislik.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([c, w]) => `<col min="${c + 1}" max="${c + 1}" width="${w}" customWidth="1"/>`)
    .join('');
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    (cols ? `<cols>${cols}</cols>` : '') +
    `<sheetData>${rows}</sheetData></worksheet>`
  );
}

/** Birden çok sayfalı .xlsx dosyası üretir */
export function xlsxYaz(sayfalar: Sayfa[]): Uint8Array {
  const liste = sayfalar.length ? sayfalar : [{ ad: 'Sayfa1', satirlar: [] }];
  const adlar = sayfaAdlari(liste.map((s) => s.ad));
  const dosyalar: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        liste
          .map(
            (_, i) =>
              `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
          )
          .join('') +
        '</Types>',
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    ),
    'xl/workbook.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        adlar.map((ad, i) => `<sheet name="${xmlKac(ad)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
        '</sheets></workbook>',
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        liste
          .map(
            (_, i) =>
              `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
          )
          .join('') +
        `<Relationship Id="rId${liste.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        '</Relationships>',
    ),
    'xl/styles.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
        '</styleSheet>',
    ),
  };
  liste.forEach((s, i) => {
    dosyalar[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sayfaXml(s.satirlar));
  });
  return zipSync(dosyalar, { level: 6 });
}

function metinBirlestir(xml: string): string {
  // <t>..</t> parçalarını (zengin metin <r> dahil) birleştir
  const parcalar = [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => xmlCoz(m[1]));
  return parcalar.join('');
}

/** .xlsx baytlarını sayfa sayfa metin tablosuna çevirir */
export function xlsxOku(veri: Uint8Array): OkunanSayfa[] {
  const z = unzipSync(veri);
  const oku = (ad: string) => (z[ad] ? strFromU8(z[ad]) : '');
  const paylasilan: string[] = [];
  const ss = oku('xl/sharedStrings.xml');
  for (const m of ss.matchAll(/<si>([\s\S]*?)<\/si>/g)) paylasilan.push(metinBirlestir(m[1]));

  const wb = oku('xl/workbook.xml');
  const rels = oku('xl/_rels/workbook.xml.rels');
  const hedefler = new Map<string, string>();
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = m[0].match(/Id="([^"]+)"/)?.[1];
    const t = m[0].match(/Target="([^"]+)"/)?.[1];
    if (id && t) hedefler.set(id, t.replace(/^\/?xl\//, '').replace(/^\//, ''));
  }
  const sayfalar: { ad: string; yol: string }[] = [];
  for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const ad = xmlCoz(m[0].match(/name="([^"]*)"/)?.[1] ?? '');
    const rid = m[0].match(/r:id="([^"]+)"/)?.[1] ?? '';
    const yol = hedefler.get(rid);
    if (yol) sayfalar.push({ ad, yol: `xl/${yol}` });
  }
  if (!sayfalar.length) {
    Object.keys(z)
      .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
      .sort()
      .forEach((k, i) => sayfalar.push({ ad: `Sayfa${i + 1}`, yol: k }));
  }

  return sayfalar.map(({ ad, yol }) => {
    const xml = oku(yol);
    const satirlar: string[][] = [];
    for (const rm of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const rNo = Number(rm[1].match(/r="(\d+)"/)?.[1] ?? satirlar.length + 1) - 1;
      const satir: string[] = [];
      let sira = 0;
      for (const cm of (rm[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const at = cm[1];
        const ref = at.match(/r="([A-Z]+\d+)"/i)?.[1];
        const col = ref ? harfSutun(ref) : sira;
        sira = col + 1;
        const t = at.match(/t="([^"]+)"/)?.[1];
        const ic = cm[2] ?? '';
        const v = ic.match(/<v>([\s\S]*?)<\/v>/)?.[1];
        let deger = '';
        if (t === 's') deger = paylasilan[Number(v)] ?? '';
        else if (t === 'inlineStr') deger = metinBirlestir(ic);
        else if (t === 'b') deger = v === '1' ? 'DOĞRU' : 'YANLIŞ';
        else deger = v != null ? xmlCoz(v) : '';
        while (satir.length < col) satir.push('');
        satir[col] = deger;
      }
      while (satirlar.length < rNo) satirlar.push([]);
      satirlar[rNo] = satir;
    }
    return { ad, satirlar };
  });
}
