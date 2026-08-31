import { flushSyncQueue, getSyncQueueEntries } from '@/kaynak/cekirdek/veritabani';
import { bulutSenkronAktif } from '@/sabitler/Ortam';

export type SenkronSonuc = {
  islenen: number;
  kalan: number;
  mesaj: string;
};

/**
 * Yerel senkron kuyruğunu işler.
 * Bulut API (EXPO_PUBLIC_API_URL) tanımlı değilse kuyruk yalnızca yerelde temizlenir.
 */
export async function isleSenkronKuyrugu(): Promise<SenkronSonuc> {
  const bekleyen = await getSyncQueueEntries();
  if (bekleyen.length === 0) {
    return { islenen: 0, kalan: 0, mesaj: 'Bekleyen kayıt yok.' };
  }
  const islenen = await flushSyncQueue();
  const bulut = bulutSenkronAktif();
  return {
    islenen,
    kalan: 0,
    mesaj: bulut
      ? `${islenen} kayıt buluta gönderildi.`
      : `${islenen} kayıt yerel kuyrukta işlendi. Bulut henüz kapalı — yedek alın.`,
  };
}

export async function senkronDurumOzet(): Promise<string> {
  const bekleyen = await getSyncQueueEntries();
  if (bekleyen.length === 0) {
    return bulutSenkronAktif()
      ? 'Bulut senkron güncel.'
      : 'Yerel kayıtlar güncel. Bulut senkron kapalı — JSON yedek önerilir.';
  }
  return bulutSenkronAktif()
    ? `${bekleyen.length} kayıt buluta gönderilmeyi bekliyor.`
    : `${bekleyen.length} kayıt yerel kuyrukta — bulut API tanımlı değil.`;
}
