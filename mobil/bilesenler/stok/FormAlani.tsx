import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';

type Props = TextInputProps & {
  label: string;
  helper?: string;
  required?: boolean;
};

/** Saha dostu etiketli form alanı — placeholder tek başına kullanılmaz */
export function FormAlani({ label, helper, required, style, ...inputProps }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label}
        {required ? ' *' : ''}
      </Text>
      {helper ? (
        <Text style={[styles.helper, { color: colors.textSecondary }]}>{helper}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        {...inputProps}
        style={[
          styles.input,
          { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  helper: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 18,
    minHeight: 56,
  },
});
