import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { BesiAdim } from '@/kaynak/besi-ortak';

interface Props {
  adim: BesiAdim;
  durum: 'kilitli' | 'aktif' | 'tamam';
  onPress?: () => void;
  onTamamla?: () => void;
}

export function YolculukAdimi({ adim, durum, onPress, onTamamla }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const kilitli = durum === 'kilitli';

  const border =
    durum === 'tamam' ? colors.success : durum === 'aktif' ? colors.tint : colors.border;
  const badge =
    durum === 'tamam' ? 'Tamam' : durum === 'aktif' ? 'Sırada' : 'Kilitli';
  const badgeColor =
    durum === 'tamam' ? colors.success : durum === 'aktif' ? colors.tint : colors.textSecondary;

  return (
    <Pressable
      disabled={kilitli}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: border,
          opacity: kilitli ? 0.55 : pressed ? 0.9 : 1,
        },
      ]}>
      <View style={styles.row}>
        <View style={[styles.num, { backgroundColor: border }]}>
          <Text style={styles.numText}>{adim.sira}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{adim.baslik}</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{adim.aciklama}</Text>
        </View>
        <Text style={[styles.badge, { color: badgeColor }]}>{badge}</Text>
      </View>
      {durum === 'aktif' && onTamamla ? (
        <Pressable onPress={onTamamla} style={[styles.doneBtn, { borderColor: colors.tint }]}>
          <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>Adımı tamamla</Text>
        </Pressable>
      ) : null}
      {durum === 'tamam' && onPress ? (
        <Text style={[styles.link, { color: colors.tint }]}>Aç →</Text>
      ) : null}
      {durum === 'aktif' && onPress ? (
        <Text style={[styles.link, { color: colors.tint }]}>İlgili ekrana git →</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  num: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  title: { fontSize: 15, fontWeight: '800' },
  desc: { marginTop: 4, lineHeight: 18, fontSize: 13 },
  badge: { fontSize: 11, fontWeight: '800' },
  doneBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  link: { marginTop: 8, fontWeight: '700', fontSize: 13 },
});
