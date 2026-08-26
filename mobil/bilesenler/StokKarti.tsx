import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/useRenkSemasi';
import type { StockItem } from '@/kaynak/tipler';
import { STOCK_TYPE_LABELS } from '@/kaynak/tipler';

export function StokKarti({ item, onPress }: { item: StockItem; onPress?: () => void }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isLow = item.quantity <= item.minQuantity;
  const isExpiring =
    item.expiryDate && new Date(item.expiryDate).getTime() - Date.now() < 90 * 86400000;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isLow ? colors.warning : colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <View style={styles.row}>
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.type, { color: colors.tint }]}>{STOCK_TYPE_LABELS[item.type]}</Text>
      </View>
      <Text style={[styles.qty, { color: isLow ? colors.warning : colors.text }]}>
        {item.quantity} {item.unit}
        {isLow ? ' · Düşük stok!' : ''}
      </Text>
      {item.expiryDate ? (
        <Text style={{ color: isExpiring ? colors.danger : colors.textSecondary, fontSize: 12 }}>
          SKT: {new Date(item.expiryDate).toLocaleDateString('tr-TR')}
          {isExpiring ? ' ⚠' : ''}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  type: {
    fontSize: 12,
    fontWeight: '600',
  },
  qty: {
    fontSize: 15,
    marginTop: 6,
    fontWeight: '500',
  },
});
