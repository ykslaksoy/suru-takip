import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';

/** Kayıt veya bulut girişi öncesi kısa şartlar onayı. */
export function KullanimSartlariNotu() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.kap}>
      <Text style={[styles.metin, { color: colors.textSecondary }]}>
        Kayıt olarak{' '}
        <Link href="/yasal/kullanim" style={[styles.baglanti, { color: colors.tint }]}>
          Kullanım Şartları
        </Link>
        ’nı kabul edersiniz.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kap: { marginTop: 4, marginBottom: 10 },
  metin: { fontSize: 13, lineHeight: 20, fontWeight: '600' },
  baglanti: { fontWeight: '800', textDecorationLine: 'underline' },
});
