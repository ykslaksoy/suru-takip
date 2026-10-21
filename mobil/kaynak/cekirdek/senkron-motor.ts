import { flushSyncQueue, getSyncQueueEntries } from '@/kaynak/cekirdek/veritabani';
import { bulutApiSenkronHazir } from '@/kaynak/bulut/api-url';
import { bulutaSenkronKuyruguGonder } from '@/kaynak/bulut/senkron-push';
import { bulutSenkronAktif } from '@/sabitler/Ortam';

function uzakSenkronAktif(): boolean {
  return bulutSenkronAktif() || bulutApiSenkronHazir();
}

export type SenkronSonuc = {
  islenen: number;
  kalan: number;
  mesaj: string;
};

/**
 * Yerel senkron kuyruğunu işler.
 * Supabase env tanımlı değilse kuyruk yalnızca yerelde temizlenir.
 */
export async function isleSenkronKuyrugu(): Promise<SenkronSonuc> {
  const bekleyen = await getSyncQueueEntries();
  if (bekleyen.length === 0) {
    return { islenen: 0, kalan: 0, mesaj: 'Bekleyen kayıt yok.' };
  }
  if (bulutApiSenkronHazir()) {
    const push = await bulutaSenkronKuyruguGonder(bekleyen);
    if (!push.ok) {
      return {
        islenen: 0,
        kalan: bekleyen.length,
        mesaj: push.mesaj,
      };
    }
  }

  const islenen = await flushSyncQueue();
  const bulut = uzakSenkronAktif();
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
    return uzakSenkronAktif()
      ? 'Bulut senkron güncel.'
      : 'Yerel kayıtlar güncel. Bulut senkron kapalı — JSON yedek önerilir.';
  }
  return uzakSenkronAktif()
    ? `${bekleyen.length} kayıt buluta gönderilmeyi bekliyor.`
    : `${bekleyen.length} kayıt yerel kuyrukta — bulut API tanımlı değil.`;
}
