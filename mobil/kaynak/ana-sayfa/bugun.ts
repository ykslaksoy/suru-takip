import {
  getActiveWithdrawals,
  getAnimals,
  getHealthRecords,
  getLatestWeight,
  getLowStockItems,
  getStockItems,
} from '@/kaynak/cekirdek/veritabani';
import { asiStokUyarilari, hesaplaAsiStokDurumu } from '@/kaynak/cekirdek/asi-programi';
import type { StockItem } from '@/kaynak/cekirdek/tipler';

export type BugunSeviye = 'uyari' | 'sira' | 'bilgi';

export type BugunMadde = {
  id: string;
  seviye: BugunSeviye;
  baslik: string;
  aciklama: string;
  href: string;
  cta: string;
};

const MAX_MADDE = 3;

function kalanGun(recordedAt: string, withdrawalDays: number): number {
  const bitis = new Date(recordedAt).getTime() + withdrawalDays * 86400000;
  return Math.max(0, Math.ceil((bitis - Date.now()) / 86400000));
}

function dusukTakviyeler(items: StockItem[]): StockItem[] {
  return items.filter((i) => i.type === 'supplement' && i.quantity <= i.minQuantity);
}

function sktYakinTakviyeler(items: StockItem[], gun = 60): StockItem[] {
  const limit = Date.now() + gun * 86400000;
  return items.filter(
    (i) =>
      i.type === 'supplement' &&
      i.expiryDate &&
      new Date(i.expiryDate).getTime() <= limit &&
      new Date(i.expiryDate).getTime() >= Date.now()
  );
}

/**
 * Ana sayfa “Bugün” kartı — en fazla 3 madde.
 * Sıra: bekletme → aşı stoğu → takviye → düşük stok → sağlık → tartım.
 */
export async function getBugunMaddeleri(): Promise<BugunMadde[]> {
  const out: BugunMadde[] = [];

  const withdrawals = await getActiveWithdrawals();
  if (withdrawals.length > 0) {
    const sorted = [...withdrawals].sort(
      (a, b) =>
        kalanGun(a.recordedAt, a.withdrawalDays) - kalanGun(b.recordedAt, b.withdrawalDays)
    );
    const first = sorted[0];
    const gun = kalanGun(first.recordedAt, first.withdrawalDays);
    out.push({
      id: 'bekletme',
      seviye: 'uyari',
      baslik: 'Bekletme',
      aciklama:
        withdrawals.length === 1
          ? `${first.earTag ?? 'Hayvan'} · ${first.medicine} · ${gun} gün kaldı`
          : `${withdrawals.length} hayvan bekletmede · en yakın ${gun} gün`,
      href: '/(tabs)/saglik',
      cta: 'Sağlığa bak',
    });
  }

  const animals = await getAnimals();
  const health = await getHealthRecords();
  const stock = await getStockItems();
  const asiDurum = hesaplaAsiStokDurumu(animals, health, stock);
  const asiUyarilar = asiStokUyarilari(asiDurum);

  for (const u of asiUyarilar) {
    if (out.length >= MAX_MADDE) break;
    out.push({
      id: u.id,
      seviye: u.seviye,
      baslik: u.baslik,
      aciklama: u.aciklama,
      href: u.baslik.includes('stok') || u.baslik.includes('SKT') ? '/(tabs)/stok' : '/(tabs)/saglik',
      cta: u.baslik.includes('stok') || u.baslik.includes('SKT') ? 'Stoka git' : 'Aşıya bak',
    });
  }

  const dusukTakviye = dusukTakviyeler(stock);
  const sktTakviye = sktYakinTakviyeler(stock);
  if (dusukTakviye.length > 0 && out.length < MAX_MADDE) {
    const first = dusukTakviye[0];
    out.push({
      id: 'takviye-stok',
      seviye: 'uyari',
      baslik: 'Takviye stoğu düşük',
      aciklama:
        dusukTakviye.length === 1
          ? `${first.name} · ${first.quantity} ${first.unit} (min ${first.minQuantity})`
          : `${dusukTakviye.length} takviye düşük · örn. ${first.name}`,
      href: '/(tabs)/stok',
      cta: 'Stoka git',
    });
  } else if (sktTakviye.length > 0 && out.length < MAX_MADDE) {
    const first = sktTakviye[0];
    out.push({
      id: 'takviye-skt',
      seviye: 'sira',
      baslik: 'Takviye SKT yakın',
      aciklama: `${first.name} · son kullanma yaklaşıyor`,
      href: '/(tabs)/stok',
      cta: 'Stoka git',
    });
  }

  const asiStokAdlari = new Set(
    asiDurum.map((d) => d.stokAdi?.toLocaleLowerCase('tr-TR')).filter(Boolean) as string[]
  );
  const takviyeIds = new Set(dusukTakviye.map((i) => i.id));
  const lowStock = (await getLowStockItems()).filter(
    (i) =>
      !(i.type === 'vaccine' && asiStokAdlari.has(i.name.toLocaleLowerCase('tr-TR'))) &&
      !takviyeIds.has(i.id)
  );
  if (lowStock.length > 0 && out.length < MAX_MADDE) {
    const first = lowStock[0];
    out.push({
      id: 'stok',
      seviye: 'uyari',
      baslik: 'Düşük stok',
      aciklama:
        lowStock.length === 1
          ? `${first.name} · ${first.quantity} ${first.unit} (min ${first.minQuantity})`
          : `${lowStock.length} kalem düşük · örn. ${first.name}`,
      href: '/(tabs)/stok',
      cta: 'Stoka git',
    });
  }

  const hasta = animals.find((a) => a.status === 'sick');
  if (hasta && out.length < MAX_MADDE) {
    out.push({
      id: 'saglik-takip',
      seviye: 'sira',
      baslik: 'Sağlık takibi',
      aciklama: `${hasta.earTag} hasta kayıtlı — tedavi / aşıya bak`,
      href: '/(tabs)/saglik',
      cta: 'Sağlığa bak',
    });
  }

  if (out.length < MAX_MADDE && animals.length > 0) {
    let tartimEksik = 0;
    for (const a of animals.slice(0, 40)) {
      const w = await getLatestWeight(a.id);
      if (w == null) tartimEksik += 1;
    }
    if (tartimEksik > 0) {
      out.push({
        id: 'tartim',
        seviye: 'sira',
        baslik: 'Tartım sırası',
        aciklama:
          tartimEksik === 1
            ? '1 hayvanda henüz tartım yok'
            : `${tartimEksik} hayvanda henüz tartım yok`,
        href: '/(tabs)/suru',
        cta: 'Sürüye git',
      });
    }
  }

  if (out.length === 0) {
    out.push({
      id: 'bos',
      seviye: 'bilgi',
      baslik: 'Bugün acil iş yok',
      aciklama: 'Sürüye göz atabilir veya Planla ile ana ekranı düzenleyebilirsiniz.',
      href: '/(tabs)/suru',
      cta: 'Sürüye git',
    });
  }

  return out.slice(0, MAX_MADDE);
}
