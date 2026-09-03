import { Pressable, StyleSheet, Text } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
}

/** Düz modern CTA */
export function AnaButon({ title, onPress, variant = 'primary', disabled }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const bg =
    variant === 'primary'
      ? colors.tint
      : variant === 'danger'
        ? colors.danger
        : variant === 'ghost'
          ? 'transparent'
          : colors.card;
  const fg = variant === 'secondary' || variant === 'ghost' ? colors.tint : '#fff';
  const border = variant === 'secondary' || variant === 'ghost' ? colors.tint : 'transparent';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) =>
        StyleSheet.flatten([
          styles.btn,
          {
            backgroundColor: bg,
            borderColor: border,
            opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
          },
        ])
      }>
      <Text style={StyleSheet.flatten([styles.text, { color: fg }])}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginVertical: 4,
    borderWidth: 1.5,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
