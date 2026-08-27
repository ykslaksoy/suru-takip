import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { STOCK_TYPE_LABELS } from '@/kaynak/cekirdek/tipler';
import type { StokListeSatiri } from '@/kaynak/stok';
import { terim } from '@/sabitler/Metinler';

export function StokKarti({
  satir,
  onPress,
}: {
  satir: StokListeSatiri;
  onPress?: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const item = satir.item;
  const qty = item?.quantity ?? 0;
  const minQ = item?.minQuantity ?? satir.minMiktar;
  const isLow = item ? qty <= minQ : false;
  const stoktaYok = !item;
  const isExpiring =
    item?.expiryDate && new Date(item.expiryDate).getTime() - Date.now() < 90 * 86400000;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isLow ? colors.warning : stoktaYok ? colors.border : colors.border,
          opacity: pressed ? 0.9 : stoktaYok ? 0.92 : 1,
        },
      ]}>
      <View style={styles.row}>
        <Text style={[styles.name, { color: colors.text }]}>{satir.ad}</Text>
        <Text style={[styles.type, { color: colors.tint }]}>{STOCK_TYPE_LABELS[satir.type]}</Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{satir.aciklama}</Text>
      {stoktaYok ? (
        <Text style={[styles.qty, { color: colors.textSecondary }]}>Stokta yok · dokunarak ekle</Text>
      ) : (
        <Text style={[styles.qty, { color: isLow ? colors.warning : colors.text }]}>
          {qty} {item!.unit}
          {isLow ? ' · Düşük stok!' : ''}
          {satir.kullanim > 0 ? ` · kullanım ${satir.kullanim}` : ''}
        </Text>
      )}
      {!stoktaYok && item?.expiryDate ? (
        <Text style={{ color: isExpiring ? colors.danger : colors.textSecondary, fontSize: 12 }}>
          {terim('SKT')}: {new Date(item.expiryDate).toLocaleDateString('tr-TR')}
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
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
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
