/**
 * Hızlı tartım kuzu tanıma — gecikmiş arama yoksayma, ses/kilo ayrımı, onay kontrolü.
 */
import { kiloAyikla, kupeNumarasiAyikla, sirtNumarasiAyikla } from '@/kaynak/giris-yontemi';

export function aramaJetonuUret(onceki: number): number {
  return onceki + 1;
}

export function gecikmisAramaMi(beklenen: number, guncel: number): boolean {
  return beklenen !== guncel;
}

/** Konuşulan metin yalnızca kilo gibi görünüyorsa küpe araması yapma */
export function metinSadeceKiloGibiMi(metin: string): boolean {
  const t = metin.trim();
  if (!t) return false;
  if (!/kilo|kg|kilogram/i.test(t)) return false;
  const kilo = kiloAyikla(t);
  if (kilo == null) return false;
  const gercekKupe = /küpe|kupe|ear|TR-/i.test(t);
  const gercekSirt = /(?:sırt|sirt)\s*(?:no|numara|:)/i.test(t);
  if (gercekKupe || gercekSirt) return false;
  return true;
}

export function kuzuAramaTerimiHamdan(metin: string): string | null {
  if (metinSadeceKiloGibiMi(metin)) return null;
  const kupe = kupeNumarasiAyikla(metin);
  const sirt = sirtNumarasiAyikla(metin);
  if (kupe && sirt) return `${kupe} ${sirt}`;
  if (kupe) return kupe;
  if (sirt) return sirt;
  const d = metin.trim();
  return d.length >= 2 ? d : null;
}

export function tanimaNesliArtti(onceki: number): number {
  return onceki + 1;
}

export function onayHalaGecerli(
  onayliHayvanId: string | null,
  adayHayvanId: string | null,
  tanimaNesli: number,
  onayNesli: number,
): boolean {
  if (!onayliHayvanId || !adayHayvanId) return false;
  if (onayliHayvanId !== adayHayvanId) return false;
  return onayNesli === tanimaNesli;
}

/** Onay anında nesil sabitlenir; aday değişince onay düşer */
export function yeniOnayNesli(tanimaNesli: number): number {
  return tanimaNesli;
}
