import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { meraHaritaAktif } from '@/sabitler/ozellik-acik';
import {
  besiSekliOku,
  haritaGirisEtiketi,
  haritaGirisIpucu,
  haritaHedefRotasi,
  icBesiModu,
  type BesiSekli,
} from '@/kaynak/suru/besi-sekli-yon';

type Props = {
  padok?: string | null;
  style?: object;
};

export function suruHaritaGirisGorunur(sekil: BesiSekli): boolean {
  return icBesiModu(sekil) || meraHaritaAktif();
}

export function SuruHaritaGirisButonu({ padok, style }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [sekil, setSekil] = useState<BesiSekli>('karisik');

  const yukle = useCallback(async () => {
    setSekil(await besiSekliOku());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void yukle();
    }, [yukle]),
  );

  useEffect(() => {
    void yukle();
  }, [yukle]);

  if (!suruHaritaGirisGorunur(sekil)) return null;

  const etiket = haritaGirisEtiketi(sekil);
  const hedef = haritaHedefRotasi(sekil, padok);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiket}
      accessibilityHint={haritaGirisIpucu(sekil)}
      onPress={() =>
        router.push(
          hedef.params
            ? ({ pathname: hedef.pathname, params: hedef.params } as never)
            : (hedef.pathname as never),
        )
      }
      style={StyleSheet.flatten([styles.btn, { borderColor: colors.border, backgroundColor: colors.background }, style])}>
      <Ionicons name={icBesiModu(sekil) ? 'grid-outline' : 'map-outline'} size={20} color={colors.tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
