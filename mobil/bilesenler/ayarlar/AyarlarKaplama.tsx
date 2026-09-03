import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAyarlar } from '@/baglam/AyarlarBaglami';
import { AyarlarEkrani } from '@/bilesenler/ayarlar/AyarlarEkrani';

/** Modal — Stack/web z-index altında kalmaz, her zaman üstte */
export function AyarlarKaplama() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { acik, kapat } = useAyarlar();

  return (
    <Modal
      visible={acik}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={kapat}
      statusBarTranslucent>
      <View style={StyleSheet.flatten([styles.fill, { backgroundColor: colors.background }])}>
        <View
          style={StyleSheet.flatten([
            styles.topBar,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ])}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri"
            hitSlop={12}
            onPress={kapat}
            style={({ pressed }) =>
              StyleSheet.flatten([styles.geriBtn, { opacity: pressed ? 0.7 : 1 }])
            }>
            <Ionicons name="chevron-back" size={22} color={colors.tint} />
            <Text style={StyleSheet.flatten([styles.geriText, { color: colors.tint }])}>Geri</Text>
          </Pressable>
          <Text style={StyleSheet.flatten([styles.title, { color: colors.text }])}>Ayarlar</Text>
          <View style={styles.side} />
        </View>
        <AyarlarEkrani />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'web' ? 10 : 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  geriBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 72,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  geriText: { fontSize: 16, fontWeight: '700' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800' },
  side: { minWidth: 72 },
});
