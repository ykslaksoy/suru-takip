import { View, Text, TextInput, StyleSheet } from 'react-native';
import { TartimGirisPaneli } from '@/bilesenler/giris-yontemi/TartimGirisPaneli';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';

type Props = {
  weight: string;
  notes: string;
  onWeightChange: (v: string) => void;
  onNotesChange: (v: string) => void;
};

/** Tartım giriş formu — kayıtlı tartım yöntemine göre */
export function TartimFormu({ weight, notes, onWeightChange, onNotesChange }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View>
      <TartimGirisPaneli value={weight} onChange={onWeightChange} />
      <TextInput
        placeholder="Not (opsiyonel)"
        value={notes}
        onChangeText={onNotesChange}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 16, minHeight: 48 },
});
