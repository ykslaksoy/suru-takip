import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import {
  getHayvanKoluMap,
  getPadokKoluMap,
  hayvanSuruKoluSync,
  setHayvanKoluBulk,
  setPadokKolu,
  type SuruKolu,
} from '@/kaynak/suru-kolu';

type Props = { onDegisti: () => void };

export function SuruKoluEtiketPaneli({ onDegisti }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [hayvanlar, setHayvanlar] = useState<import('@/kaynak/cekirdek/tipler').Animal[]>([]);
  const [padokMap, setPadokMap] = useState<Record<string, SuruKolu>>({});
  const [hayvanMap, setHayvanMap] = useState<Record<string, SuruKolu>>({});
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [padokAd, setPadokAd] = useState('');
  const [padokKol, setPadokKol] = useState<SuruKolu>('sut');

  const load = useCallback(async () => {
    const list = (await getAnimals()).filter((a) => a.status !== 'sold' && a.status !== 'dead');
    setHayvanlar(list.slice(0, 40));
    setPadokMap(await getPadokKoluMap());
    setHayvanMap(await getHayvanKoluMap());
    setSecili(new Set());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggle = (id: string) => {
    const s = new Set(secili);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSecili(s);
  };

  const etiketle = async (kol: SuruKolu) => {
    const ids = [...secili];
    if (!ids.length) {
      Alert.alert('Seçim', 'Hayvan seçin');
      return;
    }
    await setHayvanKoluBulk(ids, kol);
    await load();
    onDegisti();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.tint }]}>
      <Text style={[styles.title, { color: colors.text }]}>Süt / et sürüsü etiketi</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
        Hayvan veya padok işaretleyin — doğru yolculuk ve sağlık paketi uygulanır.
      </Text>
      <View style={styles.row}>
        <TextInput
          placeholder="Padok adı"
          placeholderTextColor={colors.textSecondary}
          value={padokAd}
          onChangeText={setPadokAd}
          style={[styles.input, { borderColor: colors.border, color: colors.text, flex: 1 }]}
        />
        <Pressable
          onPress={() => setPadokKol('sut')}
          style={[styles.kolBtn, padokKol === 'sut' && { backgroundColor: colors.tint }]}>
          <Text style={{ color: padokKol === 'sut' ? '#fff' : colors.text, fontWeight: '800' }}>Süt</Text>
        </Pressable>
        <Pressable
          onPress={() => setPadokKol('et')}
          style={[styles.kolBtn, padokKol === 'et' && { backgroundColor: colors.tint }]}>
          <Text style={{ color: padokKol === 'et' ? '#fff' : colors.text, fontWeight: '800' }}>Et</Text>
        </Pressable>
        <AnaButon
          title="Padok"
          onPress={async () => {
            if (!padokAd.trim()) {
              Alert.alert('Padok', 'Padok adı girin');
              return;
            }
            await setPadokKolu(padokAd.trim(), padokKol);
            setPadokAd('');
            await load();
            onDegisti();
          }}
        />
      </View>
      <View style={styles.chips}>
        {hayvanlar.map((a) => {
          const aktif = secili.has(a.id);
          const kol = hayvanSuruKoluSync(a, padokMap, hayvanMap);
          return (
            <Pressable
              key={a.id}
              onPress={() => toggle(a.id)}
              style={[
                styles.chip,
                {
                  borderColor: aktif ? colors.tint : colors.border,
                  backgroundColor: aktif ? colors.tint : colors.background,
                },
              ]}>
              <Text style={{ color: aktif ? '#fff' : colors.text, fontSize: 11, fontWeight: '700' }}>
                {hayvanAnaEtiket(a)}
                {kol ? ` · ${kol === 'sut' ? 'Süt' : 'Et'}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.row}>
        <AnaButon title="Süt sürüsü" onPress={() => etiketle('sut')} />
        <AnaButon title="Et sürüsü" onPress={() => etiketle('et')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, minWidth: 100 },
  kolBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderColor: '#ccc' },
});
