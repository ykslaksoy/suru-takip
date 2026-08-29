import { StyleSheet, Text } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';

type Props = {
  /** Ne için — hastalık / koruma */
  koruma: string;
  /** Aşı adı — parantez içinde küçük */
  asiAdi: string;
  /** sabit 2 ml */
  mlEtiket: string;
};

/** Enterotoksemi / çelertme (Enterotoksemi aşısı) sabit 1 ml */
export function AsiBaslikSatir({ koruma, asiAdi, mlEtiket }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <Text style={{ lineHeight: 22 }}>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{koruma}</Text>
      <Text style={[styles.parantez, { color: colors.textSecondary }]}> ({asiAdi})</Text>
      <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 14 }}> {mlEtiket}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  parantez: { fontSize: 10, fontWeight: '400' },
});
