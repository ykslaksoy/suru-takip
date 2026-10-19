/** Maliyet ekranı ve dışa aktarma için ortak veri toplama */
import { getAnimals, getLatestWeight, getStockItems, getStockMovements, getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import { getBirimFiyatlar } from '@/kaynak/stok/fiyat';
import { alisTahmini, etkinFiyatlar, type FiyatDurum } from '@/kaynak/maliyet/tahmini-fiyat';
import { partiMaliyetleri, type MaliyetAyar, type PartiMaliyet } from '@/kaynak/maliyet/hesap';
import { getMaliyetAyar } from '@/kaynak/maliyet/depo';
import { getPoliceler, hayvanPrimPaylari } from '@/kaynak/sigorta';

export async function maliyetTopla(a?: MaliyetAyar): Promise<{ satirlar: PartiMaliyet[]; durumlar: FiyatDurum[]; ayar: MaliyetAyar }> {
  const [animals, items, movements, gercekFiyatlar, ayar, policeler] = await Promise.all([
    getAnimals(),
    getStockItems(),
    getStockMovements(),
    getBirimFiyatlar(),
    a ? Promise.resolve(a) : getMaliyetAyar(),
    getPoliceler().catch(() => []),
  ]);
  const sonKg: Record<string, number | null> = {};
  const alisTahminleri: Record<string, number> = {};
  await Promise.all(
    animals.map(async (x) => {
      sonKg[x.id] = await getLatestWeight(x.id).catch(() => null);
      const wr = await getWeightRecords(x.id).catch(() => []);
      const t = alisTahmini(wr.length ? wr[wr.length - 1].weightKg : null);
      if (t != null) alisTahminleri[x.id] = t;
    }),
  );
  const kullanilan = new Set(movements.filter((m) => m.movementType === 'out').map((m) => m.stockId));
  const { fiyatlar, durumlar } = etkinFiyatlar(items.filter((i) => kullanilan.has(i.id)), gercekFiyatlar);
  return {
    satirlar: partiMaliyetleri({ animals, sonKg, items, movements, fiyatlar, ayar, alisTahminleri, sigortaPrimleri: hayvanPrimPaylari(policeler) }),
    durumlar,
    ayar,
  };
}
