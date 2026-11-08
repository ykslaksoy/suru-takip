/**
 * t368u — upstream çekim + parse (gizli anahtar yok; timeout ile).
 */

const { parseTobbOtKuzusuHtml, parseUkonKuzuHtml, parseUskYemHtml } = require('./_referans-parse');

const UA = 'SuruYon-besi-referans/1.0 (+https://github.com/ykslaksoy/suru-takip)';
const FETCH_TIMEOUT_MS = 25_000;

const KAYNAKLAR = {
  tobb: 'https://borsa.tobb.org.tr/fiyat_urun3.php?alt_kod=108&ana_kod=13',
  ukon: 'https://www.ukon.org.tr/fiyatlar',
  usk: 'https://ulusalsutkonseyi.org.tr/yemlerin-ortalama-fiyatlari/',
};

async function cek(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: ctrl.signal,
    });
    const metin = await r.text();
    if (!r.ok) {
      const err = new Error(`HTTP ${r.status}`);
      err.status = r.status;
      throw err;
    }
    return metin;
  } finally {
    clearTimeout(t);
  }
}

function kaynakIslemTarihleri(tobb, ukon, usk) {
  const out = {
    tobb_edirne: null,
    tobb_gaziantep: null,
    ukon_karkas: null,
    usk_yonca_ay: null,
    usk_saman_ay: null,
  };
  if (tobb?.ok) {
    for (const s of tobb.veri) {
      if (s.borsaKod === 'edirne') out.tobb_edirne = s.islemTarihi;
      if (s.borsaKod === 'gaziantep') out.tobb_gaziantep = s.islemTarihi;
    }
  }
  if (ukon?.ok) out.ukon_karkas = ukon.veri.islemTarihi;
  if (usk?.ok) {
    const y = usk.veri.find((u) => u.id === 'yonca-kuru');
    const s = usk.veri.find((u) => u.id === 'saman-bugday');
    if (y?.veriAyi) out.usk_yonca_ay = `${y.veriYili}-${y.veriAyi}`;
    if (s?.veriAyi) out.usk_saman_ay = `${s.veriYili}-${s.veriAyi}`;
  }
  return out;
}

async function referansKaynaklariniCek() {
  const iz = [];
  const hatalar = [];
  const nowIso = new Date().toISOString();

  let tobb = null;
  let ukon = null;
  let usk = null;

  try {
    const html = await cek(KAYNAKLAR.tobb);
    iz.push('fetch:tobb:ok');
    tobb = parseTobbOtKuzusuHtml(html);
    if (tobb.ok) iz.push(...tobb.iz);
    else hatalar.push(`TOBB: ${tobb.hata}`);
  } catch (e) {
    hatalar.push(`TOBB ağ: ${e.message}`);
    iz.push('fetch:tobb:fail');
  }

  try {
    const html = await cek(KAYNAKLAR.ukon);
    iz.push('fetch:ukon:ok');
    ukon = parseUkonKuzuHtml(html);
    if (ukon.ok) iz.push(...ukon.iz);
    else hatalar.push(`UKON: ${ukon.hata}`);
  } catch (e) {
    hatalar.push(`UKON ağ: ${e.message}`);
    iz.push('fetch:ukon:fail');
  }

  try {
    const html = await cek(KAYNAKLAR.usk);
    iz.push('fetch:usk:ok');
    usk = parseUskYemHtml(html);
    if (usk.ok) iz.push(...usk.iz);
    else hatalar.push(`USK: ${usk.hata}`);
  } catch (e) {
    hatalar.push(`USK ağ: ${e.message}`);
    iz.push('fetch:usk:fail');
  }

  const piyasaTamam = tobb?.ok && ukon?.ok;
  const yemTamam = usk?.ok;
  const ok = piyasaTamam || yemTamam;

  const alinmaTarihi = nowIso.slice(0, 10);

  return {
    govde: {
      ok,
      alinmaTarihi,
      yenilemeSonuc: ok ? (hatalar.length ? 'kısmi' : 'ag_ok') : 'hata',
      kaynaklar: KAYNAKLAR,
      otomatik: {
        tobb: true,
        ukon: true,
        usk_yonca_saman: true,
        balikesir_pdf: false,
        besi_yemi_tzob: false,
      },
      parse: { tobb, ukon, usk },
      uyari: hatalar,
      iz,
      kaynakIslemTarihleri: kaynakIslemTarihleri(tobb, ukon, usk),
      not: 'Besi yemi ve Balıkesir bülteni manuel/gömülü — aylık USK yonca/saman ile karıştırılmaz.',
    },
    cekimBasarili: ok,
    cekimZamanIso: nowIso,
  };
}

module.exports = {
  KAYNAKLAR,
  referansKaynaklariniCek,
};
