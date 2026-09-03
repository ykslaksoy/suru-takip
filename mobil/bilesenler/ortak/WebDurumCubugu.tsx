import { Platform, StyleSheet, Text, View } from 'react-native';

/** Web önizlemede ince durum şeridi — fazla yer yemesin */
export function WebDurumCubugu() {
  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={styles.side}>SürüYön</Text>
      <View style={styles.dot} />
      <Text style={styles.side}>önizleme</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#e8f0e4',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d8e2d0',
  },
  side: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4a5f4a',
    minWidth: 56,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2d6a4f',
    opacity: 0.45,
  },
});
