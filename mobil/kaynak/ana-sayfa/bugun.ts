import {
  getActiveWithdrawals,
  getAnimals,
  getLatestWeight,
  getLowStockItems,
} from '@/kaynak/cekirdek/veritabani';

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

/**
 * Ana sayfa “Bugün” kartı — en fazla 3 madde.
 * Sıra: bekletme → düşük stok → aşı/tartım ihtiyacı.
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

  const lowStock = await getLowStockItems();
  if (lowStock.length > 0) {
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

  const animals = await getAnimals();
  const hasta = animals.find((a) => a.status === 'sick');
  if (hasta) {
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
