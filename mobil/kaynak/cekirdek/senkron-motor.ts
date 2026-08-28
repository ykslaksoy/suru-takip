import { flushSyncQueue, getSyncQueueEntries } from '@/kaynak/cekirdek/veritabani';

export type SenkronSonuc = {
  islenen: number;
  kalan: number;
  mesaj: string;
};

/**
 * Yerel senkron kuyruğunu işler.
 * Sunucu API hazır olunca payload buradan gönderilecek; şimdilik kuyruk temizlenir.
 */
export async function isleSenkronKuyrugu(): Promise<SenkronSonuc> {
  const bekleyen = await getSyncQueueEntries();
  if (bekleyen.length === 0) {
    return { islenen: 0, kalan: 0, mesaj: 'Bekleyen kayıt yok.' };
  }
  const islenen = await flushSyncQueue();
  return {
    islenen,
    kalan: 0,
    mesaj: `${islenen} kayıt yerel olarak işlendi (sunucu API sonraki faz).`,
  };
}

export async function senkronDurumOzet(): Promise<string> {
  const bekleyen = await getSyncQueueEntries();
  if (bekleyen.length === 0) return 'Tüm yerel değişiklikler senkronlandı.';
  return `${bekleyen.length} kayıt sunucuya gönderilmeyi bekliyor.`;
}
