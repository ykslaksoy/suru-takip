import { Pressable, StyleSheet, Text } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/useRenkSemasi';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export function AnaButon({ title, onPress, variant = 'primary', disabled }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const bg =
    variant === 'primary' ? colors.tint : variant === 'danger' ? colors.danger : colors.border;
  const fg = variant === 'secondary' ? colors.text : '#fff';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}>
      <Text style={[styles.text, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginVertical: 6,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
