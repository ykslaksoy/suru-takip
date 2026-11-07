/** Baskül ölçümü — nesil tabanlı; yeniden bağlanma / kuzu / yöntem değişince geçersiz */

export type BaskulOturumNesli = {
  baglantiNesli: number;
  hayvanNesli: number;
  yontemNesli: number;
};

export type BekleyenBaskulOlcumu = {
  kg: number;
  baglantiNesli: number;
  hayvanId: string;
  okunduAt: number;
};

const OLCUM_MAX_YAS_MS = 120_000;

export function yeniBaskulOturumNesli(onceki: BaskulOturumNesli, alan: keyof BaskulOturumNesli): BaskulOturumNesli {
  return { ...onceki, [alan]: onceki[alan] + 1 };
}

export function baskulOlcumuGecerliMi(
  olcum: BekleyenBaskulOlcumu | null,
  onayliHayvanId: string | null,
  nesil: BaskulOturumNesli,
  nowMs: number,
): boolean {
  if (!olcum || !onayliHayvanId) return false;
  if (olcum.hayvanId !== onayliHayvanId) return false;
  if (olcum.baglantiNesli !== nesil.baglantiNesli) return false;
  if (nowMs - olcum.okunduAt > OLCUM_MAX_YAS_MS) return false;
  return true;
}

export function tartimYontemDegisinceKiloSifirla(
  eski: string,
  yeniYontem: string,
  oncekiYontem: string,
): string {
  if (yeniYontem === oncekiYontem) return eski;
  return '';
}

export function ciftOlcumEventiMi(
  onceki: { kg: number; atMs: number; hayvanId: string } | null,
  hayvanId: string,
  kg: number,
  nowMs: number,
  pencereMs = 2000,
): boolean {
  if (!onceki) return false;
  return onceki.hayvanId === hayvanId && onceki.kg === kg && nowMs - onceki.atMs < pencereMs;
}
