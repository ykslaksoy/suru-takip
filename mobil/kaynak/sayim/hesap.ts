/**
 * Sayım listesi — saf mantık. Küpe/sırt no yazarak veya sesle sayılır; sonunda sürü listesiyle karşılaştırılır.
 * Eksik: kapsamda (sürü / padok) olup sayılmayan · Fazla: sayılan ama sürüde (aktif) olmayan küpe.
 * Başka padokta: sürüde var ama sayılan padokta kayıtlı değil (padok sayımında).
 */
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { aktifHayvanMi, kupeListesiAyikla, topluSec } from '@/kaynak/toplu/secim';
import { kupeOku } from '@/kaynak/ses/sayi-oku';

/** 'tum' = tüm sürü, aksi hâlde padok adı */
export type SayimKapsam = 'tum' | string;

export type SayilanKupe = {
  /** Girilen / duyulan metin (büyük harf) */
  ham: string;
  /** Eşleşen hayvan (aktif sürüde) — yoksa null (fazla) */
  animalId: string | null;
  zaman: string;
  yontem: 'yazi' | 'ses';
};

export type SayimOturumu = {
  id: string;
  kapsam: SayimKapsam;
  baslangic: string;
  sayilan: SayilanKupe[];
};

export type EkleDurum = 'eklendi' | 'tekrar' | 'fazla' | 'gecersiz';

export type EkleSonuc = {
  durum: EkleDurum;
  oturum: SayimOturumu;
  animal?: Animal;
  mesaj: string;
};

function normKupe(ham: string): string {
  return ham.trim().toUpperCase().replace(/\s+/g, '');
}

export function kapsamHayvanlari(animals: Animal[], kapsam: SayimKapsam): Animal[] {
  const aktif = animals.filter(aktifHayvanMi);
  return kapsam === 'tum' ? aktif : aktif.filter((a) => a.paddock === kapsam);
}

export function kapsamEtiketi(kapsam: SayimKapsam): string {
  return kapsam === 'tum' ? 'Tüm sürü' : kapsam;
}

/** Küpe / sırt no / küpenin son ≥3 hanesi ile aktif hayvan bul */
export function kupeEsle(animals: Animal[], ham: string): Animal | null {
  const k = normKupe(ham);
  if (!k || !/\d/.test(k)) return null;
  return topluSec(animals, { tur: 'liste', kupeler: [k] }).secilen[0] ?? null;
}

function etiket(a: Animal): string {
  return a.sirtNo ? `Sırt ${a.sirtNo}` : a.earTag || a.id;
}

/** Tek küpe ekle — tekrar okutma yok sayılır (bildirimle) */
export function sayimaEkle(
  oturum: SayimOturumu,
  animals: Animal[],
  ham: string,
  yontem: 'yazi' | 'ses' = 'yazi',
  zaman = new Date().toISOString(),
): EkleSonuc {
  const k = normKupe(ham);
  if (!k || !/\d/.test(k)) return { durum: 'gecersiz', oturum, mesaj: 'Küpe numarası okunamadı.' };
  const a = kupeEsle(animals, k);
  if (a) {
    if (oturum.sayilan.some((s) => s.animalId === a.id)) {
      return { durum: 'tekrar', oturum, animal: a, mesaj: `${etiket(a)} zaten sayıldı — tekrar sayılmadı.` };
    }
    const yeni = { ...oturum, sayilan: [...oturum.sayilan, { ham: k, animalId: a.id, zaman, yontem }] };
    const yerinde = oturum.kapsam === 'tum' || a.paddock === oturum.kapsam;
    return {
      durum: 'eklendi',
      oturum: yeni,
      animal: a,
      mesaj: yerinde ? `✓ ${etiket(a)} sayıldı` : `✓ ${etiket(a)} sayıldı · kayıtta ${a.paddock}`,
    };
  }
  if (oturum.sayilan.some((s) => s.animalId == null && s.ham === k)) {
    return { durum: 'tekrar', oturum, mesaj: `${k} zaten listede (sürüde yok) — tekrar sayılmadı.` };
  }
  const yeni = { ...oturum, sayilan: [...oturum.sayilan, { ham: k, animalId: null, zaman, yontem }] };
  return { durum: 'fazla', oturum: yeni, mesaj: `${k} sürü listesinde yok — fazla olarak not edildi.` };
}

/** Sesli girişten küpe numaraları ("TR 34 200001" birleştirilir; birden çok küpe olabilir) */
export function sestenKupeler(metin: string): string[] {
  const birlesik = metin
    .replace(/\b(?:küpe|kupe|numara|no|sırt|sirt|ve)\b/gi, ' ')
    .replace(/\bTR[\s-]*(\d{2})[\s-]+(\d{3,})\b/gi, 'TR-$1-$2');
  return kupeListesiAyikla(birlesik);
}

/** Onaydan önce okunacak metin */
export function sesGeriOkuma(kupeler: string[]): string {
  if (kupeler.length === 0) return 'Küpe numarası anlaşılmadı. Tekrar söyle.';
  const liste = kupeler.map(kupeOku).join('; ');
  return `${kupeler.length === 1 ? 'Küpe' : `${kupeler.length} küpe`}: ${liste}. Eklemek için "tamam" de, yanlışsa "dur" de.`;
}

export type SayimRaporu = {
  kapsam: SayimKapsam;
  beklenen: number;
  sayilan: number;
  /** Kapsamda olup sayılan */
  eslesen: number;
  eksik: Animal[];
  /** Sürüde olmayan küpeler */
  fazla: string[];
  /** Sürüde var ama başka padokta kayıtlı (padok sayımında) */
  baskaPadok: Animal[];
};

export function sayimRaporu(oturum: SayimOturumu, animals: Animal[]): SayimRaporu {
  const kapsam = kapsamHayvanlari(animals, oturum.kapsam);
  const sayilanIds = new Set(oturum.sayilan.map((s) => s.animalId).filter(Boolean) as string[]);
  const kapsamIds = new Set(kapsam.map((a) => a.id));
  const byId = new Map(animals.map((a) => [a.id, a]));
  return {
    kapsam: oturum.kapsam,
    beklenen: kapsam.length,
    sayilan: oturum.sayilan.length,
    eslesen: kapsam.filter((a) => sayilanIds.has(a.id)).length,
    eksik: kapsam.filter((a) => !sayilanIds.has(a.id)),
    fazla: oturum.sayilan.filter((s) => s.animalId == null).map((s) => s.ham),
    baskaPadok: [...sayilanIds].filter((id) => !kapsamIds.has(id)).map((id) => byId.get(id)!).filter(Boolean),
  };
}

/** Geçmiş kaydı — hayvan silinse de okunabilsin diye etiketler saklanır */
export type SayimGecmisKaydi = {
  id: string;
  kapsam: SayimKapsam;
  baslangic: string;
  bitis: string;
  beklenen: number;
  sayilan: number;
  eslesen: number;
  eksik: { id: string; etiket: string }[];
  fazla: string[];
  baskaPadok: { id: string; etiket: string; paddock: string }[];
};

export function gecmisKaydiOlustur(oturum: SayimOturumu, r: SayimRaporu, bitis = new Date().toISOString()): SayimGecmisKaydi {
  return {
    id: oturum.id,
    kapsam: oturum.kapsam,
    baslangic: oturum.baslangic,
    bitis,
    beklenen: r.beklenen,
    sayilan: r.sayilan,
    eslesen: r.eslesen,
    eksik: r.eksik.map((a) => ({ id: a.id, etiket: etiket(a) })),
    fazla: r.fazla,
    baskaPadok: r.baskaPadok.map((a) => ({ id: a.id, etiket: etiket(a), paddock: a.paddock })),
  };
}

export function hayvanSayimEtiketi(a: Animal): string {
  return etiket(a);
}
