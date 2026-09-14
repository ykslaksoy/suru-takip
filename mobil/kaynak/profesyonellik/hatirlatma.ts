import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProfesyonellikAsama } from './asamalar';

const KEY = 'sy_profesyonellik_hatirlatma_son';

async function notificationsModulu() {
  if (Platform.OS === 'web') return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

/** Yerel bildirim izni (web no-op). */
export async function profesyonellikBildirimIzinIste(): Promise<boolean> {
  const Notifications = await notificationsModulu();
  if (!Notifications) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('profesyonellik', {
      name: 'Profesyonellik hatırlatmaları',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return final === 'granted';
}

/**
 * Onaylanan aşama için basit hatırlatma (ertesi sabah).
 * Web’de false döner — görev listesi yeterli.
 */
export async function profesyonellikHatirlatmalariKur(
  asama: ProfesyonellikAsama,
  gorevAdedi: number
): Promise<boolean> {
  const Notifications = await notificationsModulu();
  if (!Notifications) {
    await AsyncStorage.setItem(KEY, new Date().toISOString());
    return false;
  }

  const ok = await profesyonellikBildirimIzinIste();
  if (!ok) return false;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Aşama ${asama.sira}: ${asama.baslik}`,
        body: `${gorevAdedi} görev eklendi. Bugün birini tamamla.`,
        data: { href: '/gorevler', asamaId: asama.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60 * 60 * 20,
        channelId: Platform.OS === 'android' ? 'profesyonellik' : undefined,
      },
    });
    await AsyncStorage.setItem(KEY, new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}
