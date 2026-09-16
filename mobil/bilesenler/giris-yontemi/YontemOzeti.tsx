import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useGirisYontemi } from '@/baglam/GirisYontemiBaglami';
import { etkinKuzuSecim, etkinTartimGiris, kuzuSecimEtiket, tartimGirisEtiket } from '@/kaynak/giris-yontemi';

type Props = {
  /** Ayarlar linki göster */
  ayarlarLink?: boolean;
};

/** Akışlarda seçili yöntem özeti — per-ekran seçici yok */
export function YontemOzeti({ ayarlarLink = false }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tercih } = useGirisYontemi();

  const kuzu = kuzuSecimEtiket(etkinKuzuSecim(tercih.kuzuSecim));
  const tartim = tartimGirisEtiket(etkinTartimGiris(tercih.tartimGiris));

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
        Kayıtlı giriş yöntemleri
      </Text>
      <Text style={{ color: colors.text, marginTop: 4, lineHeight: 20 }}>
        Kuzu: <Text style={{ fontWeight: '800', color: colors.tint }}>{kuzu}</Text>
        {' · '}
        Tartım: <Text style={{ fontWeight: '800', color: colors.tint }}>{tartim}</Text>
      </Text>
      {ayarlarLink ? (
        <Pressable onPress={() => router.push('/giris-yontemi' as never)} style={{ marginTop: 8 }}>
          <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>Ayarlar → değiştir</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
});
