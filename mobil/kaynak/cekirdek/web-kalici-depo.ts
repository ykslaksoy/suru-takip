/**
 * Web kalıcı depo — AsyncStorage (localStorage) yazımlarını doğrular.
 * Bulut senkron yokken tarayıcıda kayıt kaybını erken yakalar.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

function webMi(): boolean {
  return Platform.OS === 'web' || (typeof window !== 'undefined' && typeof localStorage !== 'undefined');
}

/** localStorage kullanılabilir mi (gizli sekme kotası vb.) */
export function webDepoKullanilabilir(): boolean {
  if (!webMi() || typeof localStorage === 'undefined') return false;
  try {
    const k = '__sy_depo_probe__';
    localStorage.setItem(k, '1');
    const ok = localStorage.getItem(k) === '1';
    localStorage.removeItem(k);
    return ok;
  } catch {
    return false;
  }
}

/** Yaz → oku doğrula; web’de tutarsızlıkta localStorage’a doğrudan yazıp tekrar dene */
export async function kaliciSetItem(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
  const okundu = await AsyncStorage.getItem(key);
  if (okundu === value) return;

  if (webMi() && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      throw new Error(
        `Kayıt yazılamadı (${key}). Tarayıcı depolaması dolu veya engelli. ${e instanceof Error ? e.message : ''}`,
      );
    }
    const tekrar = await AsyncStorage.getItem(key);
    if (tekrar === value) return;
    // AsyncStorage farklı anahtar öneki kullanıyorsa doğrudan localStorage yeterli sayılır
    if (localStorage.getItem(key) === value) return;
  }

  throw new Error(`Kayıt doğrulanamadı: ${key}`);
}

export async function kaliciGetItem(key: string): Promise<string | null> {
  const v = await AsyncStorage.getItem(key);
  if (v != null) return v;
  if (webMi() && typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
}

export async function kaliciRemoveItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
  if (webMi() && typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
