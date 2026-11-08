/** t366u — sunucu parse (mobil/besi-referans-parse.ts ile senkron tutun). */

function parseTrSayi(metin) {
  const t = String(metin).replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function tobbTarihIso(metin) {
  const m = String(metin).match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseTobbOtKuzusuHtml(html) {
  const iz = ['tobb:parse'];
  if (!html.includes('Ticaret Borsaları')) return { ok: false, hata: 'TOBB sayfa tanınmadı', iz };
  const satirlar = [];
  const trRe = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  let m;
  while ((m = trRe.exec(html))) {
    const row = m[0];
    if (!/TICARET BORSASI/i.test(row)) continue;
    const td = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((x) => x[1].replace(/<[^>]+>/g, '').trim());
    if (td.length < 5) continue;
    const borsaAd = td[0].toUpperCase();
    let kod = 'diger';
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

const UKON_BOLGE_ID = {
  'ege bölgesi': 'ukon-kuzu-ege',
  'akdeniz bölgesi': 'ukon-kuzu-akdeniz',
  'marmara bölgesi': 'ukon-kuzu-marmara',
  'iç anadolu bölgesi': 'ukon-kuzu-ic-anadolu',
  'doğu anadolu bölgesi': 'ukon-kuzu-dogu-anadolu',
  'güneydoğu anadolu bölgesi': 'ukon-kuzu-guneydogu',
  'karadeniz bölgesi': 'ukon-kuzu-karadeniz',
  ortalama: 'ukon-karkas-yagsiz-kuzu',
};

function parseUkonKuzuHtml(html) {
  const iz = ['ukon:parse'];
  const baslik = html.match(/Kuzu Fiyatları \(TL\/KG\) - (\d{2}\.\d{2}\.\d{4})/i);
  const islemTarihi = baslik ? tobbTarihIso(baslik[1]) : null;
  if (baslik) iz.push(`ukon:tarih:${baslik[1]}`);

  const bolgeler = [];
  const rowRe =
    /<td class="text-left">\s*([^<]+)\s*<\/td>\s*<td class="price-val">\s*([^<]+)\s*<\/td>\s*<td class="price-val">\s*([^<]+)\s*<\/td>/gi;
  let m;
  while ((m = rowRe.exec(html))) {
    const ad = m[1].trim();
    const key = ad.toLowerCase();
    const bolgeId = UKON_BOLGE_ID[key];
    if (!bolgeId) continue;
    if (ad.startsWith('Geçen')) break;
    bolgeler.push({ bolge: ad, bolgeId, kuzuKg: parseTrSayi(m[3]) });
    iz.push(`ukon:${bolgeId}:${m[3]}`);
  }
  if (bolgeler.length < 5) return { ok: false, hata: 'UKON bölge tablosu eksik', iz };
  return { ok: true, veri: { islemTarihi, bolgeler }, iz };
}

function uskSonAyDeger(html, baslikParca) {
  const re = /const chartArgs = (\{[\s\S]*?\});/g;
  let m;
  while ((m = re.exec(html))) {
    try {
      const o = JSON.parse(m[1]);
      const title = o?.options?.plugins?.title?.text ?? '';
      if (!title.includes(baslikParca) || !title.includes('2026')) continue;
      const data = o.data?.datasets?.[0]?.data ?? [];
      const labels = o.data?.labels ?? [];
      let last = null;
      let lastI = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] != null && Number.isFinite(data[i])) {
          last = data[i];
          lastI = i;
        }
      }
      return { fiyat: last, ay: lastI >= 0 ? String(labels[lastI]) : null };
    } catch {
      /* */
    }
  }
  return { fiyat: null, ay: null };
}

function parseUskYemHtml(html) {
  const iz = ['usk:parse'];
  const yonca = uskSonAyDeger(html, 'Yonca Kuru Otu');
  const saman = uskSonAyDeger(html, 'Saman Fiyatı');
  if (yonca.fiyat == null && saman.fiyat == null) return { ok: false, hata: 'USK grafik verisi yok', iz };
  return {
    ok: true,
    veri: [
      { id: 'yonca-kuru', fiyat: yonca.fiyat, veriAyi: yonca.ay, veriYili: '2026' },
      { id: 'saman-bugday', fiyat: saman.fiyat, veriAyi: saman.ay, veriYili: '2026' },
    ],
    iz: [`usk:yonca:${yonca.fiyat}`, `usk:saman:${saman.fiyat}`],
  };
}

module.exports = {
  parseTobbOtKuzusuHtml,
  parseUkonKuzuHtml,
  parseUskYemHtml,
};
