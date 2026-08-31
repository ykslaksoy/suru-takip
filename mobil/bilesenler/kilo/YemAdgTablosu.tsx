import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { yemAdgPerformansTablosu, type YemAdgTabloSatiri } from '@/sabitler/Metinler';

function Satir({
  s,
  colors,
  son,
}: {
  s: YemAdgTabloSatiri;
  colors: (typeof Colors)['light'];
  son: boolean;
}) {
  return (
    <View style={[styles.row, !son && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text style={[styles.gosterge, { color: s.vurgu ? colors.tint : colors.text }]}>{s.gosterge}</Text>
      <View style={styles.degerBlok}>
        <Text style={[styles.deger, { color: colors.text }]}>{s.deger}</Text>
        <Text style={[styles.birim, { color: colors.textSecondary }]}>{s.birim}</Text>
      </View>
      <Text style={[styles.not, { color: colors.textSecondary }]}>{s.not}</Text>
    </View>
  );
}

export function YemAdgTablosu({
  gunlukYemKg,
  adgGram,
}: {
  gunlukYemKg?: number | null;
  adgGram?: number | null;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const satirlar = yemAdgPerformansTablosu({ gunlukYemKg, adgGram });

  return (
    <View style={[styles.table, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <View style={[styles.head, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headCell, styles.gosterge, { color: colors.textSecondary }]}>Gösterge</Text>
        <Text style={[styles.headCell, styles.degerBlok, { color: colors.textSecondary }]}>Değer</Text>
        <Text style={[styles.headCell, styles.not, { color: colors.textSecondary }]}>Not</Text>
      </View>
      {satirlar.map((s, i) => (
        <Satir key={s.gosterge} s={s} colors={colors} son={i === satirlar.length - 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  head: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 8, paddingHorizontal: 10, gap: 8 },
  headCell: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  row: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, gap: 8, alignItems: 'flex-start' },
  gosterge: { width: 88, fontSize: 13, fontWeight: '700' },
  degerBlok: { width: 96 },
  deger: { fontSize: 14, fontWeight: '700' },
  birim: { fontSize: 11, marginTop: 2 },
  not: { flex: 1, fontSize: 12, lineHeight: 17 },
});
