import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { KILITLI_HIZLI_ISLEMLER } from '@/sabitler/HizliIslemler';
import { KILITLI_HIZLI_IKONLAR } from '@/kaynak/ana-sayfa/kilitli-gorseller';

/** 2×4 dairesel Hızlı İşlemler — kilitli mockup */
export function KilitliHizliIslemler() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const rows = [KILITLI_HIZLI_ISLEMLER.slice(0, 4), KILITLI_HIZLI_ISLEMLER.slice(4, 8)];

  return (
    <View style={styles.wrap}>
      {rows.map((row, ri) => (
        <View key={`row-${ri}`} style={styles.row}>
          {row.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => router.push(item.href as never)}
              style={({ pressed }) => StyleSheet.flatten([styles.cell, { opacity: pressed ? 0.82 : 1 }])}>
              <View
                style={StyleSheet.flatten([
                  styles.circle,
                  {
                    backgroundColor: scheme === 'dark' ? colors.card : '#fff',
                    borderColor: colors.border,
                  },
                ])}>
                <Image source={KILITLI_HIZLI_IKONLAR[item.icon]} style={styles.icon} resizeMode="contain" />
              </View>
              <Text
                style={StyleSheet.flatten([styles.label, { color: colors.text }])}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.75}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, gap: 14, marginBottom: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    paddingHorizontal: 2,
    minHeight: 88,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  icon: { width: 28, height: 28 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    letterSpacing: -0.2,
  },
});
