import { useSyncExternalStore } from 'react';
import { Alert, Platform } from 'react-native';
import { aktifKisi, ekipAnlik, ekipDinle } from '@/kaynak/ekip/depo';
import { yetkiVar, yetkiMesaji, type Kisi, type Yetki } from '@/kaynak/ekip/hesap';

/** Aktif kullanıcı ve yetkiler — değişince yeniden çizer */
export function useEkip() {
  const d = useSyncExternalStore(ekipDinle, ekipAnlik, ekipAnlik);
  const aktif: Kisi = d.kisiler.find((k) => k.id === d.aktifId) ?? d.kisiler[0];
  return { ...d, aktif, yetki: (y: Yetki) => yetkiVar(aktif, y) };
}

/** Yetki yoksa uyarı gösterir ve false döner (onPress başında kullan) */
export function yetkiUyar(y: Yetki): boolean {
  const k = aktifKisi();
  if (yetkiVar(k, y)) return true;
  const m = yetkiMesaji(y, k);
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(m);
  } else Alert.alert('Yetki yok', m);
  return false;
}
