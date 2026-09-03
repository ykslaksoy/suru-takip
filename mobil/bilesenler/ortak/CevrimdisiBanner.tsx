import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { bulutSenkronAktif } from '@/sabitler/Ortam';

/**
 * İnce senkron çipi — eski tam genişlik yeşil şerit kaldırıldı.
 * Bekleyen kayıt yoksa hiç yer kaplamaz.
 */
export function CevrimdisiBanner({ pendingSync }: { pendingSync: number }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const cloud = bulutSenkronAktif();
  const [gizli, setGizli] = useState(false);

  useEffect(() => {
    // Yeni bekleyen kayıt gelince tekrar göster
    if (pendingSync > 0) setGizli(false);
  }, [pendingSync]);

  if (gizli) return null;

  // Boşta ve bulut kapalıyken şerit gösterme — gereksiz yer
  if (!cloud && pendingSync <= 0) return null;
  // Bulut açık ve kuyruk boşsa da gösterme
  if (cloud && pendingSync <= 0) return null;

  const kisa = cloud
    ? `${pendingSync} bekliyor`
    : `${pendingSync} yerel · bulut kapalı`;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${kisa}. Kapat`}
        onPress={() => setGizli(true)}
        style={StyleSheet.flatten([
          styles.chip,
          {
            backgroundColor: scheme === 'dark' ? colors.card : '#e7f2ea',
            borderColor: colors.border,
          },
        ])}>
        <View style={StyleSheet.flatten([styles.dot, { backgroundColor: colors.tint }])} />
        <Text
          numberOfLines={1}
          style={StyleSheet.flatten([styles.text, { color: colors.text }])}>
          {kisa}
        </Text>
        <Text style={StyleSheet.flatten([styles.kapat, { color: colors.textSecondary }])}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
    paddingHorizontal: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  kapat: {
    fontSize: 11,
    fontWeight: '700',
    paddingLeft: 2,
  },
});
