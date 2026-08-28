import { StyleSheet, Text } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';

type Props = {
  doz: string;
  formul?: string;
  buyuk?: boolean;
};

export function DozSatir({ doz, formul, buyuk }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <Text style={{ marginTop: 4, lineHeight: 22 }}>
      <Text style={{ color: colors.text, fontWeight: buyuk ? '700' : '600', fontSize: buyuk ? 15 : 14 }}>
        {doz}
      </Text>
      {formul ? (
        <Text style={[styles.formul, { color: colors.textSecondary }]}> {formul}</Text>
      ) : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  formul: { fontSize: 10, fontWeight: '400' },
});
