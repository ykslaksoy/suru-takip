import { bulutApiSenkronHazir, bulutApiUrl } from '@/kaynak/bulut/api-url';
import { test, type TestModul } from '../cerceve';

export const bulutApiUrlModul: TestModul = {
  grup: 'Bulut API URL',
  calistir() {
    const url = bulutApiUrl();
    const hazir = bulutApiSenkronHazir();
    const envSet = !!String(process.env.EXPO_PUBLIC_API_URL ?? '').trim();
    return [
      test(
        'Bulut API URL',
        'Env yoksa API senkron kapalı',
        !envSet ? url === null && !hazir : hazir === (url !== null),
      ),
      test(
        'Bulut API URL',
        'Geçersiz şema reddedilir',
        !url || /^https?:\/\//.test(url),
      ),
    ];
  },
};
