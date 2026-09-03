import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { UrunMod } from '@/sabitler/Modlar';

interface Props {
  mod: UrunMod;
  secili?: boolean;
  onPress: () => void;
}

export function ModSecimKarti({ mod, secili, onPress }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!secili }}
      onPress={onPress}
      style={({ pressed }) =>
        StyleSheet.flatten([
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: secili ? colors.tint : colors.border,
            borderWidth: secili ? 2 : 1,
            opacity: pressed ? 0.9 : 1,
          },
        ])
      }>
      <View style={styles.top}>
        <Text style={styles.icon}>{mod.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.no, { color: colors.tint }]}>Mod {mod.no}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{mod.baslik}</Text>
          <Text style={[styles.kisa, { color: colors.textSecondary }]}>{mod.kisa}</Text>
        </View>
        {secili ? (
          <Text style={[styles.badge, { color: colors.tint }]}>Aktif</Text>
        ) : !mod.hazir ? (
          <Text style={[styles.badge, { color: colors.textSecondary }]}>Yakında</Text>
        ) : mod.seviye === 'pilot' ? (
          <Text style={[styles.badge, { color: colors.warning }]}>Pilot</Text>
        ) : mod.seviye === 'tam' ? (
          <Text style={[styles.badge, { color: colors.tint }]}>Hazır</Text>
        ) : null}
      </View>
      <Text style={[styles.desc, { color: colors.textSecondary }]}>{mod.aciklama}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  top: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: { fontSize: 28 },
  no: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  title: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  kisa: { fontSize: 13, marginTop: 2 },
  badge: { fontSize: 12, fontWeight: '800' },
  desc: { marginTop: 10, lineHeight: 20, fontSize: 13 },
});
