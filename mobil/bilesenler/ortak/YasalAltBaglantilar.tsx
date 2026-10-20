import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { KULLANIM_KOSULLARI_BASLIK } from '@/sabitler/YasalMetinler';

/** Ayarlar / Daha altında yasal sayfa bağlantıları. */
export function YasalAltBaglantilar() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.kap}>
      <Link href="/yasal/gizlilik" style={[styles.baglanti, { color: colors.tint }]}>
        KVKK / gizlilik
      </Link>
      <Text style={[styles.ayir, { color: colors.textSecondary }]}>·</Text>
      <Link href="/yasal/kullanim" style={[styles.baglanti, { color: colors.tint }]}>
        {KULLANIM_KOSULLARI_BASLIK}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  kap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  baglanti: { fontSize: 13, fontWeight: '700' },
  ayir: { fontSize: 13 },
});
