/**
 * Toplu uygulama — seçilen her kuzuya ayrı sağlık kaydı (tarih: bugün) + stoktan düşüm.
 * Aşı/parazit: mevcut uygulaAsiHayvana akışı (stok düşümü dahil).
 * Vitamin: sağlık kaydı + birimi doz/adet ise stoktan hayvan başı 1.
 */
import { v4 as uuidv4 } from 'uuid';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { addHealthRecord, adjustStock, getStockItems } from '@/kaynak/cekirdek/veritabani';
import { uygulaAsiHayvana } from '@/kaynak/akilli-veteriner/asi-uygula';
import { VITAMIN_PROGRAMI, vitaminDozEtiketi } from '@/kaynak/akilli-veteriner/vitamin-programi';
import { ASI_PROGRAMI } from '@/kaynak/cekirdek/asi-programi';
import { islemKaydet } from '@/kaynak/gecmis/gunluk';

export type TopluUygulaSonuc = { kayit: number; stokDusum: number; mesaj: string };

function norm(s: string): string {
  return s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
}

export async function topluUygula(opts: {
  hayvanlar: Animal[];
  programId: string;
  programTur: 'asi' | 'vitamin';
  kaynak?: string;
}): Promise<TopluUygulaSonuc> {
  const bugun = new Date().toISOString().slice(0, 10);
  let kayit = 0;
  let stokDusum = 0;
  if (opts.programTur === 'asi') {
    let stokYetersiz = 0;
    for (const a of opts.hayvanlar) {
      const r = await uygulaAsiHayvana({ animal: a, programId: opts.programId, tarih: bugun });
      if (r.ok) kayit += 1;
      if (/stok −/.test(r.message)) stokDusum += 1;
      else stokYetersiz += 1;
    }
    const p = ASI_PROGRAMI.find((x) => x.id === opts.programId);
    await islemKaydet({ tur: 'asi', ozet: `${p?.ad ?? opts.programId} · ${kayit} kuzu`, detay: opts.kaynak, adet: kayit });
    return {
      kayit,
      stokDusum,
      mesaj: `${kayit} kuzuya kayıt yapıldı${stokYetersiz ? ` · ${stokYetersiz} kuzu için stok düşülemedi (stok yok/yetersiz)` : ' · stoktan düşüldü'}`,
    };
  }
  const v = VITAMIN_PROGRAMI.find((x) => x.id === opts.programId);
  if (!v) return { kayit: 0, stokDusum: 0, mesaj: 'Vitamin bulunamadı' };
  for (const a of opts.hayvanlar) {
    await addHealthRecord({
      id: uuidv4(),
      animalId: a.id,
      recordType: 'treatment',
      symptoms: '',
      diagnosis: v.detay,
      treatment: `${v.ad} · ${vitaminDozEtiketi(v)}`,
      medicine: v.ad,
      withdrawalDays: 0,
      vetName: 'Vitamin uygulaması',
      recordedAt: bugun,
      notes: opts.kaynak ?? 'Toplu kayıt',
    });
    kayit += 1;
  }
  const stok = await getStockItems();
  const anahtar = [v.ad, ...v.stokAnahtarlar].map(norm);
  const item = stok.find((s) => anahtar.some((k) => norm(s.name).includes(k)));
  if (item && /doz|adet/i.test(item.unit)) {
    stokDusum = Math.min(item.quantity, kayit);
    if (stokDusum > 0) await adjustStock(item.id, 'out', stokDusum, `Toplu vitamin · ${kayit} kuzu`);
  }
  await islemKaydet({ tur: 'ilac', ozet: `${v.ad} · ${kayit} kuzu`, detay: opts.kaynak, adet: kayit });
  return { kayit, stokDusum, mesaj: `${kayit} kuzuya ${v.ad} kaydı yapıldı${stokDusum ? ` · stok −${stokDusum}` : ''}` };
}
