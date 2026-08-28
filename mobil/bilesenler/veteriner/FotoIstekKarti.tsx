import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { FotoIstek } from '@/kaynak/akilli-veteriner/foto-istek';

type Props = {
  istekler: FotoIstek[];
};

export function FotoIstekKarti({ istekler }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  if (istekler.length === 0) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.warning + '22', borderColor: colors.warning }]}>
      <Text style={[styles.baslik, { color: colors.warning }]}>📷 Ek fotoğraf gerekli</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 10 }}>
        Daha emin teşhis için şu açılardan fotoğraf ekleyin:
      </Text>
      {istekler.map((i) => (
        <View key={i.id} style={[styles.kart, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>
            {i.zorunlu ? '● Zorunlu' : '○ Önerilen'} · {i.tur.toUpperCase()}
          </Text>
          <Text style={{ color: colors.text, marginTop: 6, lineHeight: 20 }}>{i.talimat}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>Örnek: {i.ornek}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  baslik: { fontWeight: '800', fontSize: 16, marginBottom: 4 },
  kart: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
});
