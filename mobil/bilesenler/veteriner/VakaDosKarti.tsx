import { StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { VakaDos } from '@/kaynak/akilli-veteriner/dos';

type Props = {
  dos: VakaDos;
  onVetGonder?: () => void;
};

export function VakaDosKarti({ dos, onVetGonder }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.tint }]}>
      <Text style={[styles.baslik, { color: colors.tint }]}>📋 Vaka dosyası hazır</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
        Semptom, cevaplar, fotoğraf ve tedavi özeti bir arada — veterinere iletilebilir.
      </Text>
      <Text style={{ color: colors.text, fontWeight: '700' }}>{dos.ozet}</Text>
      <Text style={{ color: colors.text, marginTop: 8, lineHeight: 20 }} numberOfLines={4}>
        {dos.oneri.advice}
      </Text>
      {onVetGonder ? (
        <View style={{ marginTop: 12 }}>
          <AnaButon title="Dosyayı veterinere gönder" onPress={onVetGonder} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 2 },
  baslik: { fontWeight: '800', fontSize: 16, marginBottom: 4 },
});
