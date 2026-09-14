import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { ProfesyonellikAsama } from '@/kaynak/profesyonellik';
import { etiketMetin } from '@/kaynak/profesyonellik';

export function AsamaOzetKarti({
  asama,
  vurgu,
}: {
  asama: ProfesyonellikAsama;
  vurgu?: 'mevcut' | 'sonraki';
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const border =
    vurgu === 'sonraki' ? colors.tint : vurgu === 'mevcut' ? colors.success : colors.border;

  return (
    <View style={[styles.kart, { backgroundColor: colors.card, borderColor: border }]}>
      <Text style={[styles.sira, { color: colors.tint }]}>Aşama {asama.sira}</Text>
      <Text style={[styles.baslik, { color: colors.text }]}>{asama.baslik}</Text>
      <Text style={[styles.ozet, { color: colors.textSecondary }]}>{asama.ozet}</Text>
      {asama.eylemler.some((e) => e.etiket === 'tarim-bakanligi') ? (
        <View style={[styles.badge, { backgroundColor: `${colors.tint}18` }]}>
          <Text style={[styles.badgeText, { color: colors.tint }]}>
            {etiketMetin('tarim-bakanligi')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kart: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  sira: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  baslik: { fontSize: 20, fontWeight: '800', marginTop: 4, letterSpacing: -0.3 },
  ozet: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 12, fontWeight: '800' },
});
