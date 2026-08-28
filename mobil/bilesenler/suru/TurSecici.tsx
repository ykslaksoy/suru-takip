import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { AnimalSpecies } from '@/kaynak/cekirdek/tipler';
import { TUR_SECENEKLERI } from '@/kaynak/suru/tur';

type Props = {
  value: AnimalSpecies;
  onChange: (value: AnimalSpecies) => void;
  label?: string;
};

export function TurSecici({ value, onChange, label = 'Tür' }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.row}>
        {TUR_SECENEKLERI.map((t) => {
          const aktif = value === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => onChange(t.id)}
              style={[
                styles.chip,
                {
                  borderColor: aktif ? colors.tint : colors.border,
                  backgroundColor: aktif ? colors.tint + '22' : colors.card,
                },
              ]}>
              <Text style={{ fontSize: 18 }}>{t.emoji}</Text>
              <Text style={{ color: aktif ? colors.tint : colors.text, fontWeight: aktif ? '800' : '600' }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
});
