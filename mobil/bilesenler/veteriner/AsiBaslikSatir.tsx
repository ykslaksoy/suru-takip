import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';

type Props = {
  /** Başa — açıklama (Klostridiyal + pastörella, İç-dış parazit…) */
  koruma: string;
  /** İğne / ürün adı — parantez içinde küçük */
  asiAdi: string;
  /** sabit 2 ml */
  mlEtiket: string;
  /** Devlet / resmi program notu */
  devletNotu?: string;
};

/** Klostridiyal + pastörella (Karma aşı) sabit 2 ml */
export function AsiBaslikSatir({ koruma, asiAdi, mlEtiket, devletNotu }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View>
      <Text style={{ lineHeight: 22 }}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{koruma}</Text>
        {asiAdi ? (
          <Text style={[styles.parantez, { color: colors.textSecondary }]}> ({asiAdi})</Text>
        ) : null}
        <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 14 }}> {mlEtiket}</Text>
      </Text>
      {devletNotu ? (
        <Text style={[styles.devlet, { color: colors.warning }]}>{devletNotu}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  parantez: { fontSize: 9, fontWeight: '400' },
  devlet: { fontSize: 11, fontWeight: '600', marginTop: 4, lineHeight: 16 },
});
