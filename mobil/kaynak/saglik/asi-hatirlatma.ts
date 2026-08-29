import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AsiStokDurum } from '@/kaynak/cekirdek/asi-programi';

const KEY = 'sy_asi_hatirlatma_son';

export type AsiBuHaftaSatir = {
  programId: string;
  koruma: string;
  asiAdi: string;
  mlEtiket: string;
  animalId: string;
  earTag: string;
  durum: 'yapilacak' | 'yaklasiyor';
  kalanGun: number | null;
};

/** Bu hafta / yapılacak + yaklaşan hayvan satırları */
export function asiBuHaftaListesi(durumlar: AsiStokDurum[]): AsiBuHaftaSatir[] {
  const out: AsiBuHaftaSatir[] = [];
  for (const d of durumlar) {
    for (const h of d.hayvanlar) {
      if (h.durum !== 'yapilacak' && h.durum !== 'yaklasiyor') continue;
      // yaklaşan: hatırlatma penceresinde; yapılacak: gecikmiş
      if (h.durum === 'yaklasiyor' && h.kalanGun != null && h.kalanGun > 7) continue;
      out.push({
        programId: d.programId,
        koruma: d.koruma,
        asiAdi: d.asiAdi,
        mlEtiket: d.mlEtiket,
        animalId: h.animalId,
        earTag: h.earTag,
        durum: h.durum,
        kalanGun: h.kalanGun,
      });
    }
  }
  return out.sort((a, b) => {
    if (a.durum !== b.durum) return a.durum === 'yapilacak' ? -1 : 1;
    return (a.kalanGun ?? -999) - (b.kalanGun ?? -999);
  });
}

async function notificationsModulu() {
  if (Platform.OS === 'web') return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

/** Yerel bildirim izni + kanal (Android). Web’de no-op. */
export async function asiBildirimIzinIste(): Promise<boolean> {
  const Notifications = await notificationsModulu();
  if (!Notifications) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('asi', {
      name: 'Aşı hatırlatmaları',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return final === 'granted';
}

/**
 * Yapılacak/yaklaşan aşılar için yerel hatırlatma planlar.
 * Günde bir kez yeniden planlanır (AsyncStorage damgası); force=true ile zorla.
 */
export async function asiHatirlatmalariYenile(
  durumlar: AsiStokDurum[],
  force = false
): Promise<number> {
  const Notifications = await notificationsModulu();
  if (!Notifications) return 0;

  const izin = await asiBildirimIzinIste();
  if (!izin) return 0;

  const bugun = new Date().toISOString().slice(0, 10);
  const son = await AsyncStorage.getItem(KEY);
  if (!force && son === bugun) return 0;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const satirlar = asiBuHaftaListesi(durumlar).slice(0, 8);
  let n = 0;
  for (let i = 0; i < satirlar.length; i++) {
    const s = satirlar[i];
    const triggerSeconds = Math.max(60, 60 * (30 + i * 15));
    await Notifications.scheduleNotificationAsync({
      content: {
        title: s.durum === 'yapilacak' ? 'Aşı yapılacak' : 'Aşı yaklaşıyor',
        body: `${s.koruma} (${s.asiAdi}) ${s.mlEtiket} · ${s.earTag || 'hayvan'}`,
        data: { animalId: s.animalId, programId: s.programId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
        repeats: false,
        channelId: Platform.OS === 'android' ? 'asi' : undefined,
      },
    });
    n += 1;
  }

  await AsyncStorage.setItem(KEY, bugun);
  return n;
}
