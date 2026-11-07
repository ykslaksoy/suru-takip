/**
 * Hızlı tartım akışı — saf mantık: kesin hayvan eşleşmesi, kilo doğrulama, kayıt önkoşulları.
 * `hayvanBul` (ses komutu) ile farklı: belirsiz aramada ilk sonucu seçmez; yanlış kuzu kaydını önler.
 */
import type { Animal } from '@/kaynak/cekirdek/tipler';

export type HayvanEslestirmeSonuc =
  | { durum: 'bulundu'; hayvan: Animal }
  | { durum: 'yok' }
  | { durum: 'belirsiz'; adaylar: Animal[] };

export function hayvanKesinEslestir(terim: string, liste: Animal[]): HayvanEslestirmeSonuc {
  const term = terim.trim();
  if (!term) return { durum: 'yok' };

  const upper = term.toUpperCase();
  const digits = term.replace(/\D/g, '');

  const tam = liste.filter((a) => {
    const sirt = a.sirtNo?.trim() ?? '';
    const sirtTam = sirt === term || (digits.length > 0 && sirt === digits);
    return (
      sirtTam ||
      a.earTag.toUpperCase() === upper ||
      (a.gehisId ?? '').toUpperCase() === upper ||
      a.turkvetNo.toUpperCase() === upper
    );
  });
  if (tam.length === 1) return { durum: 'bulundu', hayvan: tam[0] };
  if (tam.length > 1) return { durum: 'belirsiz', adaylar: tam };

  const kismi = liste.filter(
    (a) =>
      a.earTag.toUpperCase().includes(upper) ||
      a.turkvetNo.toUpperCase().includes(upper) ||
      (a.gehisId ?? '').toUpperCase().includes(upper) ||
      (digits.length > 0 && (a.sirtNo ?? '').includes(digits)),
  );
  if (kismi.length === 1) return { durum: 'bulundu', hayvan: kismi[0] };
  if (kismi.length > 1) return { durum: 'belirsiz', adaylar: kismi.slice(0, 12) };
  return { durum: 'yok' };
}

export function kiloDogrula(ham: string): { ok: true; kg: number } | { ok: false; hata: string } {
  const kg = parseFloat(ham.replace(',', '.').trim());
  if (!Number.isFinite(kg) || kg <= 0 || kg > 200) {
    return { ok: false, hata: 'Geçerli bir kilo girin (0–200 kg)' };
  }
  return { ok: true, kg };
}

/** Kayıt yalnızca onaylanmış hayvan ile ve eşleşen id ile yapılabilir */
export function tartimKaydaHazirMi(
  onayliHayvanId: string | null,
  adayHayvanId: string | null,
  kiloHam: string,
): { hazir: true; kg: number } | { hazir: false; hata: string } {
  if (!onayliHayvanId || !adayHayvanId) {
    return { hazir: false, hata: 'Önce kuzuyu seçip onaylayın' };
  }
  if (onayliHayvanId !== adayHayvanId) {
    return { hazir: false, hata: 'Onaylanan kuzu ile seçim uyuşmuyor — yeniden onaylayın' };
  }
  const k = kiloDogrula(kiloHam);
  if (!k.ok) return { hazir: false, hata: k.hata };
  return { hazir: true, kg: k.kg };
}

export function sonrakiKuzuIcinSadeceHayvanSifirla(): {
  onayliHayvanId: null;
  kiloHam: string;
  manuelArama: string;
} {
  return { onayliHayvanId: null, kiloHam: '', manuelArama: '' };
}

export function ciftTartimKaydiMi(
  onceki: { animalId: string; kg: number; atMs: number } | null,
  animalId: string,
  kg: number,
  nowMs: number,
  pencereMs = 4000,
): boolean {
  if (!onceki) return false;
  return onceki.animalId === animalId && onceki.kg === kg && nowMs - onceki.atMs < pencereMs;
}

export function hizliTartimYontemOzeti(
  kuzuEtiket: string,
  tartimEtiket: string,
  tartimYontem: 'baskul' | 'baskul-ocr' | 'diger',
  ekDurum?: string,
): string {
  if (tartimYontem === 'baskul') {
    return `Kuzu: ${kuzuEtiket} · Kilo: ${tartimEtiket} (${ekDurum ?? 'bağlantı bekleniyor'})`;
  }
  if (tartimYontem === 'baskul-ocr') {
    return `Kuzu: ${kuzuEtiket} · Kilo: ${tartimEtiket} (ekran OCR — onaylı)`;
  }
  return `Kuzu: ${kuzuEtiket} · Kilo: ${tartimEtiket}`;
}

/** Baskül yöntemi: bağlı değilken kayıt kapalı */
export function hizliTartimKayitEtkin(
  onayli: boolean,
  tartimYontem: string,
  baskulBagli: boolean,
): boolean {
  if (!onayli) return false;
  if (tartimYontem === 'baskul' && !baskulBagli) return false;
  return true;
}
