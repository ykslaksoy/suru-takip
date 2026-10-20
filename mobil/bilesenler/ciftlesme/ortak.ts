import { Alert, Platform } from 'react-native';
import type { CiftlesmeDurum } from '@/kaynak/ciftlesme/hesap';

export function onayla(mesaj: string, evet: () => void, dugme = 'Sil') {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(mesaj)) evet();
    return;
  }
  Alert.alert('Onay', mesaj, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: dugme, style: 'destructive', onPress: evet },
  ]);
}

export function bildir(mesaj: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(mesaj);
    return;
  }
  Alert.alert('', mesaj);
}

export const DURUM_SIMGE: Record<CiftlesmeDurum, string> = {
  sunger: '🧽',
  bekleniyor: '🐏',
  gebe: '🤰',
  bos: '⭕',
  dogurdu: '🐑',
  gecikti: '⏰',
};

export function durumRenk(d: CiftlesmeDurum, c: { tint: string; warning: string; danger: string; textSecondary: string; success: string }): string {
  return d === 'gebe' ? c.success : d === 'gecikti' ? c.danger : d === 'bos' ? c.textSecondary : d === 'sunger' ? c.warning : c.tint;
}
