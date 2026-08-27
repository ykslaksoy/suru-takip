import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import {
  addLaktasyonKaydi,
  getSutYonlendirme,
  saveSutYonlendirme,
  type SutYonlendirme,
} from '@/kaynak/sut';
import type { Animal } from '@/kaynak/cekirdek/tipler';

type Props = {
  adim: 'laktasyon' | 'yonlendirme' | null;
  onDegisti: () => void;
};

export function Mod4IslemPaneli({ adim, onDegisti }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [disiler, setDisiler] = useState<Animal[]>([]);
  const [secili, setSecili] = useState<string | null>(null);
  const [not, setNot] = useState('');
  const [yon, setYon] = useState<SutYonlendirme | null>(null);

  const load = useCallback(async () => {
    if (adim === 'laktasyon') {
      const list = (await getAnimals()).filter(
        (a) => a.sex === 'female' && a.status !== 'sold' && a.status !== 'dead'
      );
      setDisiler(list);
      setSecili(list[0]?.id ?? null);
    } else if (adim === 'yonlendirme') {
      setYon(await getSutYonlendirme());
    }
  }, [adim]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (adim === 'laktasyon') {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.tint }]}>
        <Text style={[styles.title, { color: colors.text }]}>Laktasyon başlat</Text>
        <View style={styles.chips}>
          {disiler.slice(0, 12).map((a) => {
            const aktif = secili === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => setSecili(a.id)}
                style={[
                  styles.chip,
                  {
                    borderColor: aktif ? colors.tint : colors.border,
                    backgroundColor: aktif ? colors.tint : colors.background,
                  },
                ]}>
                <Text style={{ color: aktif ? '#fff' : colors.text, fontWeight: '700', fontSize: 12 }}>
                  {a.earTag || a.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          placeholder="Not (opsiyonel)"
          placeholderTextColor={colors.textSecondary}
          value={not}
          onChangeText={setNot}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        />
        <AnaButon
          title="Laktasyonu kaydet"
          onPress={async () => {
            if (!secili) {
              Alert.alert('Eksik', 'Dişi seçin');
              return;
            }
            await addLaktasyonKaydi({
              hayvanId: secili,
              baslangic: new Date().toISOString().slice(0, 10),
              notes: not.trim(),
            });
            setNot('');
            onDegisti();
            Alert.alert('Tamam', 'Laktasyon kaydı eklendi');
          }}
        />
      </View>
    );
  }

  if (adim === 'yonlendirme' && yon) {
    const toggle = async (key: 'pazar' | 'kuzu' | 'ev') => {
      const next = await saveSutYonlendirme({ ...yon, [key]: !yon[key] });
      setYon(next);
      onDegisti();
    };
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.tint }]}>
        <Text style={[styles.title, { color: colors.text }]}>Süt yönlendirme</Text>
        <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
          Süt nereye gidiyor? En az birini seçin.
        </Text>
        {(
          [
            ['pazar', 'Pazar / satış'],
            ['kuzu', 'Kuzu besleme'],
            ['ev', 'Ev tüketimi'],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => toggle(key)}
            style={[
              styles.checkRow,
              {
                borderColor: yon[key] ? colors.tint : colors.border,
                backgroundColor: yon[key] ? `${colors.tint}22` : colors.background,
              },
            ]}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {yon[key] ? '✓ ' : '○ '}
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  title: { fontWeight: '800', marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    fontSize: 15,
    minHeight: 44,
  },
  checkRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
});
