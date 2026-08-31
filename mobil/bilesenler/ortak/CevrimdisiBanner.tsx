import { StyleSheet, View, Text } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { bulutSenkronAktif } from '@/sabitler/Ortam';

export function CevrimdisiBanner({ pendingSync }: { pendingSync: number }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const bulut = bulutSenkronAktif();

  let mesaj: string;
  if (bulut) {
    mesaj =
      pendingSync > 0
        ? `Çevrimdışı · ${pendingSync} kayıt buluta gönderilmeyi bekliyor`
        : 'Çevrimiçi · veriler bulutla eşitlendi';
  } else if (pendingSync > 0) {
    mesaj = `Yerel kuyruk · ${pendingSync} kayıt işlenmeyi bekliyor (bulut kapalı)`;
  } else {
    mesaj = 'Veriler bu cihazda saklanır · yedek almayı unutmayın';
  }

  return (
    <View style={[styles.banner, { backgroundColor: colors.accent }]}>
      <Text style={[styles.text, { color: colors.text }]}>{mesaj}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
