import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AsiStokDurum } from '@/kaynak/cekirdek/asi-programi';
import { asiBuHaftaListesi } from '@/kaynak/saglik/asi-hafta-listesi';

export type { AsiBuHaftaSatir } from '@/kaynak/saglik/asi-hafta-listesi';
export { asiBuHaftaListesi } from '@/kaynak/saglik/asi-hafta-listesi';

const KEY = 'sy_asi_hatirlatma_son';

export type AsiHatirlatmaBanner = {
  tip: 'web' | 'izin_yok' | 'planlandi';
  metin: string;
  satirSayisi: number;
};

/** Yerel bildirim yalnızca native istemcide planlanır. */
export function asiNativeBildirimDestekleniyor(): boolean {
  return Platform.OS !== 'web';
}

/** Web veya izin yokken uygulama içi hatırlatma şeridi metni. */
export function asiHatirlatmaBanner(
  durumlar: AsiStokDurum[],
  opts?: { bildirimPlanlandi?: number; izinVar?: boolean },
): AsiHatirlatmaBanner | null {
  const satirlar = asiBuHaftaListesi(durumlar);
  if (satirlar.length === 0) return null;

  const yap = satirlar.filter((s) => s.durum === 'yapilacak').length;
  const yak = satirlar.length - yap;

  if (Platform.OS === 'web') {
    const parca =
      yap > 0
        ? `${yap} aşı/parazit yapılacak`
        : yak > 0
          ? `${yak} aşı/parazit yaklaşıyor`
          : `${satirlar.length} satır`;
    return {
      tip: 'web',
      metin: `${parca} (toplam ${satirlar.length}). Web’de push bildirim yok; bu listeyi takip edin veya telefonda hatırlatma açın.`,
      satirSayisi: satirlar.length,
    };
  }

  if (opts?.izinVar === false) {
    return {
      tip: 'izin_yok',
      metin: `${satirlar.length} hatırlatma satırı var; bildirim izni kapalı. Aşağıdan izin verin veya listeyi buradan takip edin.`,
      satirSayisi: satirlar.length,
    };
  }

  if (opts?.bildirimPlanlandi != null && opts.bildirimPlanlandi > 0) {
    return {
      tip: 'planlandi',
      metin: `${opts.bildirimPlanlandi} yerel hatırlatma planlandı (${satirlar.length} satır).`,
      satirSayisi: satirlar.length,
    };
  }

  return null;
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
        body: `${s.koruma} (${s.asiAdi}) ${s.mlEtiket} · ${s.etiket || s.earTag || 'hayvan'}`,
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
