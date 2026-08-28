import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import {
  addPadok,
  getPadoklar,
  padokDoluluk,
  silPadok,
  type Padok,
} from '@/kaynak/suru/padok';

export function PadokYonetimiPaneli() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [liste, setListe] = useState<(Padok & { hayvan: number; bos: number; dolu: boolean })[]>([]);
  const [ad, setAd] = useState('');
  const [kapasite, setKapasite] = useState('30');
  const [karantina, setKarantina] = useState(false);

  const load = useCallback(async () => {
    const padoklar = await getPadoklar();
    const zengin = await Promise.all(
      padoklar.map(async (p) => {
        const d = await padokDoluluk(p);
        return { ...p, ...d };
      })
    );
    setListe(zengin);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ekle = async () => {
    try {
      await addPadok({
        ad,
        kapasite: parseInt(kapasite, 10) || 30,
        karantina,
      });
      setAd('');
      setKapasite('30');
      setKarantina(false);
      await load();
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Padok eklenemedi');
    }
  };

  return (
    <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Padok / ağıl</Text>
      {liste.map((p) => (
        <View key={p.id} style={[styles.row, { borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {p.karantina ? '🛡️ ' : ''}
              {p.ad}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {p.hayvan}/{p.kapasite} hayvan · {p.bos} boş
              {p.dolu ? ' · DOLU' : ''}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Alert.alert('Padok sil', `${p.ad} silinsin mi?`, [
                { text: 'Vazgeç', style: 'cancel' },
                {
                  text: 'Sil',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await silPadok(p.id);
                      await load();
                    } catch (e) {
                      Alert.alert('Hata', e instanceof Error ? e.message : 'Silinemedi');
                    }
                  },
                },
              ]);
            }}>
            <Text style={{ color: colors.danger, fontWeight: '700' }}>Sil</Text>
          </Pressable>
        </View>
      ))}

      <TextInput
        placeholder="Yeni padok adı"
        placeholderTextColor={colors.textSecondary}
        value={ad}
        onChangeText={setAd}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <TextInput
        placeholder="Kapasite"
        keyboardType="number-pad"
        placeholderTextColor={colors.textSecondary}
        value={kapasite}
        onChangeText={setKapasite}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <Pressable onPress={() => setKarantina(!karantina)} style={{ marginBottom: 8 }}>
        <Text style={{ color: karantina ? colors.tint : colors.textSecondary, fontWeight: '700' }}>
          {karantina ? '✓ Karantina padoku' : '○ Normal padok'}
        </Text>
      </Pressable>
      <AnaButon title="Padok ekle" onPress={ekle} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  title: { fontWeight: '800', fontSize: 16, marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    minHeight: 44,
  },
});
