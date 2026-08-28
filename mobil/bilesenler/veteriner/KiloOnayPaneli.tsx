import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { PRAKTIK_KILO_SECENEKLERI } from '@/kaynak/akilli-veteriner/doz-hesap';

type Props = {
  earTag?: string;
  kayitliKg: number | null;
  onayliKg: number | null;
  onOnay: (kg: number) => void;
  onSifirla?: () => void;
};

export function KiloOnayPaneli({ earTag, kayitliKg, onayliKg, onOnay, onSifirla }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [manuel, setManuel] = useState('');

  if (onayliKg != null && onayliKg > 0) {
    return (
      <View style={[styles.onayli, { backgroundColor: colors.success + '22', borderColor: colors.success }]}>
        <Text style={{ color: colors.success, fontWeight: '700' }}>
          ✓ {earTag ? `${earTag} · ` : ''}{onayliKg} kg onaylandı
        </Text>
        {onSifirla ? (
          <Pressable onPress={onSifirla} style={{ marginTop: 6 }}>
            <Text style={{ color: colors.tint, fontSize: 13 }}>Kilo değiştir</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const manuelKg = parseFloat(manuel.replace(',', '.'));
  const gecerliManuel = !Number.isNaN(manuelKg) && manuelKg > 0 && manuelKg < 200;

  return (
    <View style={[styles.wrap, { borderColor: colors.warning, backgroundColor: colors.warning + '18' }]}>
      <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 6 }}>Kilo teyidi</Text>
      {kayitliKg != null ? (
        <>
          <Text style={{ color: colors.text, lineHeight: 22 }}>
            {earTag ? `${earTag} · ` : 'Hayvan '}son tartım: <Text style={{ fontWeight: '800' }}>{kayitliKg} kg</Text>
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 6 }}>
            Kuzu genelde 8–18 kg — yanlış kilo yanlış ml demek, tedavi tutmaz.
          </Text>
          <AnaButon title={`${kayitliKg} kg — Onayla`} onPress={() => onOnay(kayitliKg)} />
        </>
      ) : (
        <Text style={{ color: colors.textSecondary, marginBottom: 8, lineHeight: 20 }}>
          Kayıtlı tartım yok. Kilo seçin veya girin — şırıngaya çekilecek ml buna göre hesaplanır.
        </Text>
      )}

      <Text style={{ color: colors.textSecondary, fontSize: 12, marginVertical: 8 }}>Pratik seçim:</Text>
      <View style={styles.chipRow}>
        {PRAKTIK_KILO_SECENEKLERI.map((k) => (
          <Pressable
            key={k}
            onPress={() => onOnay(k)}
            style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>{k} kg</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        placeholder="Farklı kilo (ör: 23,5)"
        value={manuel}
        onChangeText={setManuel}
        keyboardType="decimal-pad"
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      {gecerliManuel ? (
        <AnaButon title={`${manuelKg} kg — Onayla`} variant="secondary" onPress={() => onOnay(manuelKg)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  onayli: { marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 10, fontSize: 16 },
});
