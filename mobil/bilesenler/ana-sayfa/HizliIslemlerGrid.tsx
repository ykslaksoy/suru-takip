import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAnaSayfaDuzeni } from '@/bilesenler/ortak/duyarli-izgara';
import { HIZLI_ISLEMLER, type MenuOgesi } from '@/kaynak/ana-sayfa';

interface Props {
  items?: MenuOgesi[];
}

export function HizliIslemlerGrid({ items = HIZLI_ISLEMLER }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { onLayout, horizontalPadding, olcek, hizliHucreGenislik } = useAnaSayfaDuzeni();

  const rows: MenuOgesi[][] = [];
  for (let i = 0; i < items.length; i += olcek.hizliSutun) {
    rows.push(items.slice(i, i + olcek.hizliSutun));
  }

  return (
    <View onLayout={onLayout} style={[styles.grid, { paddingHorizontal: horizontalPadding, gap: olcek.hizliGap }]}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { gap: olcek.hizliGap }]}>
          {row.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => router.push(item.href as never)}
              style={({ pressed }) => [
                styles.cell,
                {
                  width: hizliHucreGenislik,
                  minHeight: olcek.hizliHucreYukseklik,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}>
              <Text style={[styles.icon, { fontSize: olcek.hizliIcon }]}>{item.icon}</Text>
              <Text
                style={[styles.label, { color: colors.text, fontSize: olcek.hizliYazi, lineHeight: olcek.hizliYazi + 4 }]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.85}>
                {item.label}
              </Text>
            </Pressable>
          ))}
          {row.length < olcek.hizliSutun
            ? Array.from({ length: olcek.hizliSutun - row.length }).map((_, i) => (
                <View key={`spacer-${rowIndex}-${i}`} style={{ width: hizliHucreGenislik }} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {},
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  icon: {
    marginBottom: 6,
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
