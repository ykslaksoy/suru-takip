/**
 * t362u — satış kaynağı kimlikleri; canlı kg / karkas kg karıştırılmaz.
 */

import type { PiyasaFiyatKaydi } from './besi-piyasa-kayit';
import { gomuluPiyasaKayitlari } from './besi-piyasa-kayit';
import type { SatisFiyatBirimi } from './besi-plan-satis';

export type PiyasaSatisKaynak =
  | 'edirne_tobb'
  | 'gaziantep_tobb'
  | 'ukon_ortalama'
  | 'ukon'
  | 'ukon_ege'
  | 'ukon_marmara'
  | 'ukon_akdeniz'
  | 'ukon_ic_anadolu'
  | 'ukon_dogu_anadolu'
  | 'ukon_guneydogu'
  | 'ukon_karadeniz'
  | 'balikesir_canli'
  | 'balikesir_kemikli'
  | 'kullanici_senaryo'
  | 'kullanici_bolge_fiyat';

export type SatisKaynakMeta = {
  kod: PiyasaSatisKaynak;
  etiket: string;
  piyasaKayitId: string | null;
  birim: SatisFiyatBirimi;
  temel: 'canli' | 'karkas_yagsiz' | 'karkas_kemikli' | 'kullanici';
  karsilastirma: boolean;
};

export const SATIS_KAYNAK_META: SatisKaynakMeta[] = [
  { kod: 'edirne_tobb', etiket: 'TOBB Edirne ot kuzusu canlı', piyasaKayitId: 'tobb-edirne-kasaplik-kuzu', birim: 'canli_kg', temel: 'canli', karsilastirma: true },
  { kod: 'gaziantep_tobb', etiket: 'TOBB Gaziantep ot kuzusu canlı', piyasaKayitId: 'tobb-gaziantep-kasaplik-kuzu', birim: 'canli_kg', temel: 'canli', karsilastirma: true },
  { kod: 'balikesir_canli', etiket: 'Balıkesir TB canlı (Ağu26 bülten)', piyasaKayitId: 'balikesir-kuzu-canli-kg-agustos2026', birim: 'canli_kg', temel: 'canli', karsilastirma: true },
  { kod: 'balikesir_kemikli', etiket: 'Balıkesir kemikli et (Eyl26)', piyasaKayitId: 'balikesir-kuzu-kemikli-eylul2026', birim: 'karkas_kg', temel: 'karkas_kemikli', karsilastirma: true },
  { kod: 'ukon_ortalama', etiket: 'UKON TR ortalama karkas', piyasaKayitId: 'ukon-karkas-yagsiz-kuzu', birim: 'karkas_kg', temel: 'karkas_yagsiz', karsilastirma: true },
  { kod: 'ukon_ege', etiket: 'UKON Ege karkas', piyasaKayitId: 'ukon-kuzu-ege', birim: 'karkas_kg', temel: 'karkas_yagsiz', karsilastirma: true },
  { kod: 'ukon_marmara', etiket: 'UKON Marmara karkas', piyasaKayitId: 'ukon-kuzu-marmara', birim: 'karkas_kg', temel: 'karkas_yagsiz', karsilastirma: true },
  { kod: 'ukon_akdeniz', etiket: 'UKON Akdeniz karkas', piyasaKayitId: 'ukon-kuzu-akdeniz', birim: 'karkas_kg', temel: 'karkas_yagsiz', karsilastirma: true },
  { kod: 'ukon_ic_anadolu', etiket: 'UKON İç Anadolu karkas', piyasaKayitId: 'ukon-kuzu-ic-anadolu', birim: 'karkas_kg', temel: 'karkas_yagsiz', karsilastirma: true },
  { kod: 'ukon_dogu_anadolu', etiket: 'UKON Doğu Anadolu karkas', piyasaKayitId: 'ukon-kuzu-dogu-anadolu', birim: 'karkas_kg', temel: 'karkas_yagsiz', karsilastirma: true },
  { kod: 'ukon_guneydogu', etiket: 'UKON Güneydoğu karkas', piyasaKayitId: 'ukon-kuzu-guneydogu', birim: 'karkas_kg', temel: 'karkas_yagsiz', karsilastirma: true },
  { kod: 'ukon_karadeniz', etiket: 'UKON Karadeniz karkas', piyasaKayitId: 'ukon-kuzu-karadeniz', birim: 'karkas_kg', temel: 'karkas_yagsiz', karsilastirma: true },
  { kod: 'kullanici_bolge_fiyat', etiket: 'İl/bölge varsayım ₺/kg (resmi değil)', piyasaKayitId: null, birim: 'canli_kg', temel: 'kullanici', karsilastirma: false },
  { kod: 'kullanici_senaryo', etiket: 'Kullanıcı senaryo ₺/kg', piyasaKayitId: null, birim: 'canli_kg', temel: 'kullanici', karsilastirma: false },
];

/** Eski kod uyumu */
export function normalizeSatisKaynak(k: PiyasaSatisKaynak): PiyasaSatisKaynak {
  if (k === 'ukon') return 'ukon_ortalama';
  return k;
}

export function satisKaynakMeta(kod: PiyasaSatisKaynak): SatisKaynakMeta | undefined {
  const n = normalizeSatisKaynak(kod);
  return SATIS_KAYNAK_META.find((m) => m.kod === n);
}

export function birimForSatisKaynak(k: PiyasaSatisKaynak): SatisFiyatBirimi {
  const m = satisKaynakMeta(k);
  if (!m) return 'canli_kg';
  if (m.kod === 'balikesir_kemikli') return 'karkas_kg';
  if (m.birim === 'karkas_kg') return 'karkas_kg';
  return 'canli_kg';
}

export type PiyasaFiyatSonuc = {
  fiyatKg: number | null;
  kayit: PiyasaFiyatKaydi | null;
  eksik: string[];
  varsayim: boolean;
};

export function cozPiyasaFiyat(
  kaynak: PiyasaSatisKaynak,
  kullaniciKg: number | null | undefined,
  kullaniciBolgeKg: number | null | undefined,
): PiyasaFiyatSonuc {
  const n = normalizeSatisKaynak(kaynak);
  const eksik: string[] = [];
  if (n === 'kullanici_senaryo') {
    return {
      fiyatKg: kullaniciKg ?? null,
      kayit: null,
      eksik: kullaniciKg == null ? ['Kullanıcı senaryo satış ₺/kg girilmedi'] : [],
      varsayim: true,
    };
  }
  if (n === 'kullanici_bolge_fiyat') {
    return {
      fiyatKg: kullaniciBolgeKg ?? null,
      kayit: null,
      eksik: kullaniciBolgeKg == null ? ['İl/bölge varsayım fiyatı girilmedi (0 sayılmaz)'] : ['Planlama varsayımı — resmi borsa değil'],
      varsayim: true,
    };
  }
  const meta = satisKaynakMeta(n);
  if (!meta?.piyasaKayitId) {
    eksik.push('Kaynak eşlemesi yok');
    return { fiyatKg: null, kayit: null, eksik, varsayim: false };
  }
  const kayit = gomuluPiyasaKayitlari().find((k) => k.id === meta.piyasaKayitId) ?? null;
  if (!kayit) {
    eksik.push(`${n} kaydı bulunamadı`);
    return { fiyatKg: null, kayit: null, eksik, varsayim: false };
  }
  if (kayit.deger == null) {
    eksik.push(`${kayit.etiket} — fiyat yok (0 değil)`);
    return { fiyatKg: null, kayit, eksik, varsayim: false };
  }
  if (kayit.durum === 'bayat') eksik.push(`${kayit.etiket} — bayat referans (${kayit.islemTarihi ?? 'tarih yok'})`);
  return { fiyatKg: kayit.deger, kayit, eksik, varsayim: false };
}

export type KarsilastirmaSatiri = {
  kod: PiyasaSatisKaynak;
  etiket: string;
  birim: SatisFiyatBirimi;
  deger: number | null;
  min: number | null;
  max: number | null;
  islemTarihi: string | null;
  durum: string;
  secili: boolean;
};

export function piyasaKarsilastirma(secili: PiyasaSatisKaynak): KarsilastirmaSatiri[] {
  const n = normalizeSatisKaynak(secili);
  const all = gomuluPiyasaKayitlari();
  return SATIS_KAYNAK_META.filter((m) => m.karsilastirma && m.piyasaKayitId).map((m) => {
    const k = all.find((x) => x.id === m.piyasaKayitId);
    return {
      kod: m.kod,
      etiket: m.etiket,
      birim: m.birim,
      deger: k?.deger ?? null,
      min: k?.min ?? null,
      max: k?.max ?? null,
      islemTarihi: k?.islemTarihi ?? null,
      durum: k?.durum ?? 'arastirma_bekleniyor',
      secili: normalizeSatisKaynak(m.kod) === n,
    };
  });
}
