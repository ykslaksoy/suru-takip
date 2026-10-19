/** İşlem kaydı — saf tipler ve yardımcılar (test edilebilir) */
export type DenetimEylem = 'ekleme' | 'guncelleme' | 'silme' | 'geri_alma' | 'kalici_silme';
export type DenetimTablo =
  | 'hayvan'
  | 'saglik'
  | 'tartim'
  | 'stok'
  | 'stok_hareket'
  | 'police'
  | 'sablon'
  | 'yem'
  | 'ureme'
  | 'ekip'
  | 'foto'
  | 'diger';

export type Degisiklik = { alan: string; eski: string; yeni: string };

export type DenetimKaydi = {
  id: string;
  zaman: string;
  kim: string;
  kimId: string;
  eylem: DenetimEylem;
  tablo: DenetimTablo;
  kayitId: string;
  ozet: string;
  degisiklikler?: Degisiklik[];
  animalId?: string;
};

export const DENETIM_KEY = 'sy_denetim_kaydi_v1';
export const DENETIM_MAKS = 3000;

export const EYLEM_ETIKET: Record<DenetimEylem, string> = {
  ekleme: 'Ekledi',
  guncelleme: 'Değiştirdi',
  silme: 'Sildi',
  geri_alma: 'Geri aldı',
  kalici_silme: 'Kalıcı sildi',
};

export const TABLO_ETIKET: Record<DenetimTablo, string> = {
  hayvan: 'Kuzu',
  saglik: 'Sağlık kaydı',
  tartim: 'Tartım',
  stok: 'Stok',
  stok_hareket: 'Stok hareketi',
  police: 'Sigorta',
  sablon: 'Şablon',
  yem: 'Yem / rasyon',
  ureme: 'Çiftleşme / doğum',
  ekip: 'Ekip / yetki',
  foto: 'Fotoğraf',
  diger: 'Diğer',
};

/** Kuzu alanlarının Türkçe adları (değişiklik satırı için) */
export const HAYVAN_ALANLARI: Record<string, string> = {
  earTag: 'Küpe',
  sirtNo: 'Sırt no',
  turkvetNo: 'TÜRKVET',
  gehisId: 'Aref / GEKİS',
  name: 'İsim',
  breed: 'Irk',
  sex: 'Cinsiyet',
  birthDate: 'Doğum',
  paddock: 'Parti / padok',
  status: 'Durum',
  motherId: 'Ana',
  fatherId: 'Baba',
  notes: 'Not',
  modId: 'Mod',
};

function deger(v: unknown): string {
  if (v == null || v === '') return '—';
  return String(v);
}

/** İki kayıt arasındaki farklar (yalnız verilen alanlar) */
export function farklar(eski: Record<string, unknown> | null | undefined, yeni: Record<string, unknown>, alanlar: Record<string, string>): Degisiklik[] {
  if (!eski) return [];
  const out: Degisiklik[] = [];
  for (const [k, ad] of Object.entries(alanlar)) {
    const a = deger(eski[k]);
    const b = deger(yeni[k]);
    if (a !== b) out.push({ alan: ad, eski: a.length > 60 ? `${a.slice(0, 57)}…` : a, yeni: b.length > 60 ? `${b.slice(0, 57)}…` : b });
  }
  return out;
}

/** Filtre: tablo, kuzu, kişi */
export function denetimFiltrele(l: DenetimKaydi[], f: { tablo?: DenetimTablo | null; animalId?: string; kimId?: string }): DenetimKaydi[] {
  return l.filter((k) => (!f.tablo || k.tablo === f.tablo) && (!f.animalId || k.animalId === f.animalId) && (!f.kimId || k.kimId === f.kimId));
}

