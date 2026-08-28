import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { VetCevaplar, VetSoru } from '@/kaynak/akilli-veteriner/netlestirme';

type Props = {
  sorular: VetSoru[];
  cevaplar: VetCevaplar;
  onCevap: (soruId: string, secenekId: string) => void;
};

export function NetlestirmeSorulari({ sorular, cevaplar, onCevap }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  if (sorular.length === 0) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.baslik, { color: colors.tint }]}>Netleştirme soruları</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12, lineHeight: 18 }}>
        Daha doğru öneri için lütfen aşağıdaki soruları yanıtlayın:
      </Text>

      {sorular.map((soru) => (
        <View key={soru.id} style={styles.soruBlok}>
          <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>{soru.soru}</Text>
          <View style={styles.secenekler}>
            {soru.secenekler.map((sec) => {
              const secili = cevaplar[soru.id] === sec.id;
              return (
                <Pressable
                  key={sec.id}
                  onPress={() => onCevap(soru.id, sec.id)}
                  style={[
                    styles.secenek,
                    {
                      borderColor: secili ? colors.tint : colors.border,
                      backgroundColor: secili ? colors.tint + '18' : colors.background,
                    },
                  ]}>
                  <Text
                    style={{
                      color: secili ? colors.tint : colors.text,
                      fontWeight: secili ? '700' : '500',
                      fontSize: 14,
                    }}>
                    {sec.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  baslik: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  soruBlok: { marginBottom: 14 },
  secenekler: { gap: 8 },
  secenek: { borderWidth: 1, borderRadius: 10, padding: 12 },
});
