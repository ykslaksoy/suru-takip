import {
  type AsamaPaketBoyutu,
  type ProfesyonellikAsama,
  getAsamaPaketi,
} from './asamalar';

/** Sistemimi gir — buton soruları (az yazı) */
export type SistemSoruId =
  | 'kayit'
  | 'asi'
  | 'tartim'
  | 'yem'
  | 'satis'
  | 'tarim';

export type SistemCevapSecenek = {
  id: string;
  label: string;
  /** Bu cevap hangi aşama sırasına kadar “tamam” sayılır (1..N üstünde) */
  asamaEsik: number;
};

export type SistemSoru = {
  id: SistemSoruId;
  baslik: string;
  secenekler: SistemCevapSecenek[];
};

export const SISTEM_SORULAR: SistemSoru[] = [
  {
    id: 'kayit',
    baslik: 'Hayvanları nasıl tutuyorsun?',
    secenekler: [
      { id: 'ezber', label: 'Ezbere / defter karışık', asamaEsik: 0 },
      { id: 'defter', label: 'Defter düzenli', asamaEsik: 2 },
      { id: 'telefon', label: 'Telefonda liste var', asamaEsik: 3 },
    ],
  },
  {
    id: 'asi',
    baslik: 'Aşıları nasıl takip ediyorsun?',
    secenekler: [
      { id: 'yok', label: 'Pek takip etmiyorum', asamaEsik: 0 },
      { id: 'hatirla', label: 'Hatırlayınca yapıyorum', asamaEsik: 1 },
      { id: 'takvim', label: 'Takvim / program var', asamaEsik: 3 },
    ],
  },
  {
    id: 'tarim',
    baslik: 'Tarım Bakanlığı aşı / işlemleri?',
    secenekler: [
      { id: 'bilmiyorum', label: 'Net bilmiyorum', asamaEsik: 0 },
      { id: 'ara-sira', label: 'Ara sıra yapılıyor', asamaEsik: 2 },
      { id: 'programli', label: 'Programlı yapılıyor', asamaEsik: 3 },
    ],
  },
  {
    id: 'tartim',
    baslik: 'Tartım ne sıklıkta?',
    secenekler: [
      { id: 'hic', label: 'Neredeyse hiç', asamaEsik: 1 },
      { id: 'ara', label: 'Ara sıra', asamaEsik: 2 },
      { id: 'duzenli', label: 'Düzenli', asamaEsik: 4 },
    ],
  },
  {
    id: 'yem',
    baslik: 'Yemi nasıl planlıyorsun?',
    secenekler: [
      { id: 'tahmin', label: 'Göz kararı', asamaEsik: 1 },
      { id: 'sabit', label: 'Sabit miktar', asamaEsik: 3 },
      { id: 'rasyon', label: 'Rasyon + stok', asamaEsik: 4 },
    ],
  },
  {
    id: 'satis',
    baslik: 'Satış zamanına nasıl karar veriyorsun?',
    secenekler: [
      { id: 'his', label: 'Hissiyat', asamaEsik: 2 },
      { id: 'sure', label: 'Süre (ör. ~3 ay)', asamaEsik: 4 },
      { id: 'adg', label: 'Tartım / gelişim ile', asamaEsik: 5 },
    ],
  },
];

export type SistemCevaplari = Partial<Record<SistemSoruId, string>>;

export type AnalizSonuc = {
  mevcutSira: number;
  mevcutAsama: ProfesyonellikAsama;
  sonraki: ProfesyonellikAsama | null;
  /** Her sorunun katkı eşiği (debug / şeffaflık) */
  esikler: number[];
};

/**
 * Skor: herhangi bir 0 eşik varsa tamam=0 (temel eksik).
 * Aksi halde eşiklerin ortalamasının tabanı — zayıf halka + genel seviye dengesi.
 * 0 → öneri aşama 1; n → öneri n+1.
 */
export function analizEt(
  cevaplar: SistemCevaplari,
  paket: AsamaPaketBoyutu = 5
): AnalizSonuc {
  const liste = getAsamaPaketi(paket);
  const maxSira = liste.length;
  const esikler: number[] = [];

  for (const soru of SISTEM_SORULAR) {
    const cevapId = cevaplar[soru.id];
    if (!cevapId) continue;
    const sec = soru.secenekler.find((s) => s.id === cevapId);
    if (sec) esikler.push(sec.asamaEsik);
  }

  let tamamSira = 0;
  if (esikler.length > 0) {
    if (esikler.some((e) => e === 0)) {
      tamamSira = 0;
    } else {
      const ort = esikler.reduce((a, b) => a + b, 0) / esikler.length;
      tamamSira = Math.floor(ort);
    }
  }

  // 10’lu pakette eşikler 1..5 ölçeğinde; orantıla
  if (paket === 10 && tamamSira > 0) {
    tamamSira = Math.min(maxSira, Math.max(1, Math.round((tamamSira / 5) * 10)));
  }

  tamamSira = Math.max(0, Math.min(maxSira, tamamSira));

  const gosterimSira = tamamSira === 0 ? 1 : tamamSira;
  const mevcutAsama = liste.find((a) => a.sira === gosterimSira) ?? liste[0];
  const sonrakiSira = Math.min(maxSira, tamamSira + 1);
  const sonraki = liste.find((a) => a.sira === sonrakiSira) ?? null;

  return {
    mevcutSira: gosterimSira,
    mevcutAsama,
    sonraki,
    esikler,
  };
}
