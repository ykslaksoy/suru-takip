import { Platform, StyleSheet, Text, View } from 'react-native';

/** Web önizlemede üst durum çubuğu — native uygulama hissi */
export function WebDurumCubugu() {
  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={styles.side}>9:41</Text>
      <View style={styles.notch} />
      <Text style={styles.side}>●●●</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#f4f7f0',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d8e2d0',
  },
  side: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a2e1a',
    minWidth: 48,
  },
  notch: {
    width: 88,
    height: 24,
    borderRadius: 14,
    backgroundColor: '#1a2e1a',
    opacity: 0.08,
  },
});
