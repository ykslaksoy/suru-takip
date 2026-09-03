import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { getPadoklar, type Padok } from '@/kaynak/suru/padok';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

export function PadokSecici({ value, onChange, label = 'Padok' }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [padoklar, setPadoklar] = useState<Padok[]>([]);

  const load = useCallback(async () => {
    setPadoklar(await getPadoklar());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!value && padoklar.length > 0) {
      onChange(padoklar[0].ad);
    }
  }, [value, padoklar, onChange]);

  return (
    <View style={styles.wrap}>
      <Text style={StyleSheet.flatten([styles.label, { color: colors.text }])}>{label}</Text>
      <View style={styles.row}>
        {padoklar.map((p) => {
          const aktif = value === p.ad;
          return (
            <Pressable
              key={p.id}
              onPress={() => onChange(p.ad)}
              style={StyleSheet.flatten([
                styles.chip,
                {
                  borderColor: aktif ? colors.tint : colors.border,
                  backgroundColor: aktif ? colors.tint + '22' : colors.card,
                },
              ])}>
              <Text
                style={{
                  color: aktif ? colors.tint : colors.text,
                  fontWeight: aktif ? '800' : '600',
                }}>
                {p.karantina ? '🛡 ' : ''}
                {p.ad}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                {p.kapasite} kap · {p.karantina ? 'karantina' : 'normal'}
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minWidth: '47%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    minHeight: 48,
  },
});
