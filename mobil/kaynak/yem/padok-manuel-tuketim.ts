import { adjustStock, getStockItems } from '@/kaynak/cekirdek/veritabani';
import { islemKaydet } from '@/kaynak/gecmis/gunluk';
import { partiAdiCoz } from '@/kaynak/toplu/secim';

export type PadokManuelYemGirdi = {
  padokHam: string;
  miktarKg: number;
  yemAdi?: string;
  /** YYYY-MM-DD */
  tarih: string;
};

/**
 * Gerçek padok yem tüketimi — tek stok çıkışı, plan otomasyonu (gunlukYemDusumu) ile karışmaz.
 * Stok girişi değil; notta «Manuel padok yem» işaretli.
 */
export async function padokManuelYemKaydet(
  girdi: PadokManuelYemGirdi,
): Promise<{ ok: true } | { ok: false; neden: string }> {
  if (girdi.miktarKg <= 0) return { ok: false, neden: 'Miktar 0’dan büyük olmalı.' };
  const padok = partiAdiCoz(girdi.padokHam);
  const items = await getStockItems();
  const yemler = items.filter((i) => i.type === 'feed');
  const ad = (girdi.yemAdi ?? 'yem').trim().toLowerCase();
  const item =
    yemler.find((i) => i.name.toLowerCase().includes(ad)) ??
    yemler.find((i) => ad.includes('yem') || i.name.toLowerCase().includes('yem')) ??
    null;
  if (!item) return { ok: false, neden: 'Eşleşen yem stoğu yok; önce stok menüsünden yem tanımlayın.' };
  const not = `Manuel padok yem · ${padok} · ${girdi.tarih} · ${girdi.miktarKg} kg`;
  await adjustStock(item.id, 'out', girdi.miktarKg, not);
  await islemKaydet({
    tur: 'stok',
    ozet: `${padok} gerçek yem ${girdi.miktarKg} kg (${item.name})`,
    detay: 'Sesli komut · plan düşümünden ayrı',
  });
  return { ok: true };
}
