/** Fotoğraf senkronu: yerelde olup bulutta olmayanı yükle, bulutta olup yerelde olmayanı indir. */
export type FotoUclar = {
  yerelIdler(): Promise<string[]>;
  yerelOku(id: string): Promise<Blob | null>;
  yerelYaz(id: string, b: Blob): Promise<void>;
  uzakListe(): Promise<{ id: string; yol: string; silindi: boolean }[]>;
  yukle(id: string, b: Blob): Promise<void>;
  indir(yol: string): Promise<Blob>;
};

export async function fotoSenkron(u: FotoUclar): Promise<{ yuklenen: number; indirilen: number }> {
  const yerel = new Set(await u.yerelIdler());
  const uzak = await u.uzakListe();
  const uzakIdler = new Set(uzak.map((x) => x.id));
  let yuklenen = 0;
  let indirilen = 0;
  for (const id of yerel) {
    if (uzakIdler.has(id)) continue;
    const b = await u.yerelOku(id);
    if (!b) continue;
    await u.yukle(id, b);
    yuklenen++;
  }
  for (const x of uzak) {
    if (x.silindi) continue;
    if (await u.yerelOku(x.id)) continue;
    await u.yerelYaz(x.id, await u.indir(x.yol));
    indirilen++;
  }
  return { yuklenen, indirilen };
}
