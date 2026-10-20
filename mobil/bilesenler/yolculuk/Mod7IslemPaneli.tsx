import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { addLaktasyonKaydi } from '@/kaynak/sut-etc';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';

type Props = {
  adim: 'laktasyon' | 'saglik-sut' | null;
  onDegisti: () => void;
};

export function Mod7IslemPaneli({ adim, onDegisti }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [disiler, setDisiler] = useState<Animal[]>([]);
  const [secili, setSecili] = useState<string | null>(null);
  const [not, setNot] = useState('');

  const load = useCallback(async () => {
    if (adim === 'laktasyon') {
      const list = (await getAnimals()).filter(
        (a) => a.sex === 'female' && a.status !== 'sold' && a.status !== 'dead',
      );
      setDisiler(list);
      setSecili(list[0]?.id ?? null);
    }
  }, [adim]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (adim === 'saglik-sut') {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.tint }]}>
        <Text style={[styles.title, { color: colors.text }]}>Meme / süt sağlığı</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          Agalaksi ve ORF kayıtlarını Sağlık bölümünden girin; önerilen plan Aşı ve İlaç ekranında.
        </Text>
      </View>
    );
  }

  if (adim === 'laktasyon') {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.tint }]}>
        <Text style={[styles.title, { color: colors.text }]}>Laktasyon başlat (süt kolu)</Text>
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
                  {hayvanAnaEtiket(a)}
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
});
