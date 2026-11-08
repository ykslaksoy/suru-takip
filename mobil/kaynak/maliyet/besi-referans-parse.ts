/** t366u — TOBB / UKON / USK HTML → normalize edilmiş referans (parse birimi; ağ ayrı). */

export type TobbKuzuSatir = {
  borsaKod: 'edirne' | 'gaziantep' | string;
  borsaAd: string;
  islemTarihi: string | null;
  min: number | null;
  max: number | null;
  ortalama: number | null;
};

export type UkonKuzuBolge = {
  bolge: string;
  bolgeId: string;
  kuzuKg: number | null;
};

export type UskYemOzet = {
  id: 'yonca-kuru' | 'saman-bugday';
  fiyat: number | null;
  veriAyi: string | null;
  veriYili: string;
};

export type ReferansParseSonuc<T> =
  | { ok: true; veri: T; iz: string[] }
  | { ok: false; hata: string; iz: string[] };

/** TR sayı: 374,800 → 374.8 */
export function parseTrSayi(metin: string): number | null {
  const t = metin.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

export function tobbTarihIso(metin: string): string | null {
  const m = metin.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export function parseTobbOtKuzusuHtml(html: string): ReferansParseSonuc<TobbKuzuSatir[]> {
  const iz: string[] = ['tobb:parse'];
  if (!html.includes('Ticaret Borsaları')) {
    return { ok: false, hata: 'TOBB sayfa tanınmadı', iz };
  }
  const satirlar: TobbKuzuSatir[] = [];
  const trRe = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = trRe.exec(html))) {
    const row = m[0];
    if (!/TICARET BORSASI/i.test(row)) continue;
    const td = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((x) =>
      x[1].replace(/<[^>]+>/g, '').trim(),
    );
    if (td.length < 5) continue;
    const borsaAd = td[0].toUpperCase();
    let kod: TobbKuzuSatir['borsaKod'] = 'diger';
    if (borsaAd.includes('EDIRNE')) kod = 'edirne';
    else if (borsaAd.includes('GAZIANTEP')) kod = 'gaziantep';
    else continue;
    satirlar.push({
      borsaKod: kod,
      borsaAd: td[0],
      islemTarihi: tobbTarihIso(td[1]),
      min: parseTrSayi(td[2]),
      max: parseTrSayi(td[3]),
      ortalama: parseTrSayi(td[4]),
    });
    iz.push(`tobb:${kod}:${td[4]}`);
  }
  if (satirlar.length === 0) return { ok: false, hata: 'TOBB kuzu satırı yok', iz };
  return { ok: true, veri: satirlar, iz };
}

const UKON_BOLGE_ID: Record<string, string> = {
  'ege bölgesi': 'ukon-kuzu-ege',
  'akdeniz bölgesi': 'ukon-kuzu-akdeniz',
  'marmara bölgesi': 'ukon-kuzu-marmara',
  'iç anadolu bölgesi': 'ukon-kuzu-ic-anadolu',
  'doğu anadolu bölgesi': 'ukon-kuzu-dogu-anadolu',
  'güneydoğu anadolu bölgesi': 'ukon-kuzu-guneydogu',
  'karadeniz bölgesi': 'ukon-kuzu-karadeniz',
  ortalama: 'ukon-karkas-yagsiz-kuzu',
};

export function parseUkonKuzuHtml(html: string): ReferansParseSonuc<{ islemTarihi: string | null; bolgeler: UkonKuzuBolge[] }> {
  const iz: string[] = ['ukon:parse'];
  const baslik = html.match(/Kuzu Fiyatları \(TL\/KG\) - (\d{2}\.\d{2}\.\d{4})/i);
  const islemTarihi = baslik ? tobbTarihIso(baslik[1]) : null;
  if (baslik) iz.push(`ukon:tarih:${baslik[1]}`);

  const bolgeler: UkonKuzuBolge[] = [];
  const rowRe =
    /<td class="text-left">\s*([^<]+)\s*<\/td>\s*<td class="price-val">\s*([^<]+)\s*<\/td>\s*<td class="price-val">\s*([^<]+)\s*<\/td>/gi;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(html))) {
    const ad = m[1].trim();
    const key = ad.toLowerCase();
    const bolgeId = UKON_BOLGE_ID[key];
    if (!bolgeId) continue;
    if (ad.startsWith('Geçen')) break;
    const kuzu = parseTrSayi(m[3]);
    bolgeler.push({ bolge: ad, bolgeId, kuzuKg: kuzu });
    iz.push(`ukon:${bolgeId}:${m[3]}`);
  }
  if (bolgeler.length < 5) return { ok: false, hata: 'UKON bölge tablosu eksik', iz };
  return { ok: true, veri: { islemTarihi, bolgeler }, iz };
}

function uskSonAyDeger(html: string, baslikParca: string): { fiyat: number | null; ay: string | null } {
  const re = /const chartArgs = (\{[\s\S]*?\});/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const o = JSON.parse(m[1]) as {
        options?: { plugins?: { title?: { text?: string } } };
        data?: { labels?: string[]; datasets?: { data?: (number | null)[] }[] };
      };
      const title = o.options?.plugins?.title?.text ?? '';
      if (!title.includes(baslikParca) || !title.includes('2026')) continue;
      const data = o.data?.datasets?.[0]?.data ?? [];
      const labels = o.data?.labels ?? [];
      let last: number | null = null;
      let lastI = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] != null && Number.isFinite(data[i])) {
          last = data[i] as number;
          lastI = i;
        }
      }
      return { fiyat: last, ay: lastI >= 0 ? String(labels[lastI]) : null };
    } catch {
      /* sonraki blok */
    }
  }
  return { fiyat: null, ay: null };
}

export function parseUskYemHtml(html: string): ReferansParseSonuc<UskYemOzet[]> {
  const iz: string[] = ['usk:parse'];
  const yonca = uskSonAyDeger(html, 'Yonca Kuru Otu');
  const saman = uskSonAyDeger(html, 'Saman Fiyatı');
  if (yonca.fiyat == null && saman.fiyat == null) {
    return { ok: false, hata: 'USK grafik verisi yok', iz };
  }
  const veri: UskYemOzet[] = [
    { id: 'yonca-kuru', fiyat: yonca.fiyat, veriAyi: yonca.ay, veriYili: '2026' },
    { id: 'saman-bugday', fiyat: saman.fiyat, veriAyi: saman.ay, veriYili: '2026' },
  ];
  iz.push(`usk:yonca:${yonca.fiyat}`, `usk:saman:${saman.fiyat}`);
  return { ok: true, veri, iz };
}

/** Kullanıcı girişi — virgül/nokta; boş = null; 0 = geçersiz fiyat */
export function parseKullaniciOndalikFiyat(metin: string): number | null | 'gecersiz_sifir' {
  const t = metin.trim();
  if (!t) return null;
  const n = parseFloat(t.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  if (n === 0) return 'gecersiz_sifir';
  if (n < 0) return null;
  return Math.round(n * 10000) / 10000;
}
