import {
  getAnimals,
  getHealthRecords,
  getStockItems,
  getWeightRecords,
} from '@/kaynak/cekirdek/veritabani';
import { planlariOku } from '@/kaynak/akilli-veteriner/mod-takviye';
import { getIsletmeProfil } from '@/kaynak/cekirdek/isletme-profil';
import { appOrtamEtiketi } from '@/sabitler/Ortam';

export type SuruyonYedek = {
  surum: '1';
  uygulama: 'suruyon';
  ortam: string;
  olusturuldu: string;
  isletme: Awaited<ReturnType<typeof getIsletmeProfil>>;
  hayvanlar: Awaited<ReturnType<typeof getAnimals>>;
  tartimlar: Record<string, Awaited<ReturnType<typeof getWeightRecords>>>;
  saglik: Record<string, Awaited<ReturnType<typeof getHealthRecords>>>;
  stok: Awaited<ReturnType<typeof getStockItems>>;
  modPlanlari: Awaited<ReturnType<typeof planlariOku>>;
};

/** Tüm yerel veriyi JSON yedek paketi olarak döner */
export async function suruyonYedekOlustur(): Promise<SuruyonYedek> {
  const hayvanlar = await getAnimals();
  const tartimlar: SuruyonYedek['tartimlar'] = {};
  const saglik: SuruyonYedek['saglik'] = {};
  for (const h of hayvanlar) {
    tartimlar[h.id] = await getWeightRecords(h.id);
    saglik[h.id] = await getHealthRecords(h.id);
  }
  return {
    surum: '1',
    uygulama: 'suruyon',
    ortam: appOrtamEtiketi(),
    olusturuldu: new Date().toISOString(),
    isletme: await getIsletmeProfil(),
    hayvanlar,
    tartimlar,
    saglik,
    stok: await getStockItems(),
    modPlanlari: await planlariOku(),
  };
}

export async function suruyonYedekJson(): Promise<string> {
  const paket = await suruyonYedekOlustur();
  return JSON.stringify(paket, null, 2);
}
