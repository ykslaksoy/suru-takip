import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { KiloGrafigi } from '@/bilesenler/kilo/KiloGrafigi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { addWeightRecord, calculateADG, getAnimal, getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import type { WeightRecord } from '@/kaynak/cekirdek/tipler';

export default function WeightScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, refresh } = useDatabase();
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [adg, setAdg] = useState<number | null>(null);
  const [earTag, setEarTag] = useState('');
  const [modal, setModal] = useState(false);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const animal = await getAnimal(id);
    setEarTag(animal?.earTag ?? '');
    const list = await getWeightRecords(id);
    setRecords(list);
    setAdg(await calculateADG(id));
  }, [id]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const save = async () => {
    const w = parseFloat(weight);
    if (!id || isNaN(w) || w <= 0) {
      Alert.alert('Hata', 'Geçerli bir kilo girin');
      return;
    }
    await addWeightRecord({
      animalId: id,
      weightKg: w,
      recordedAt: new Date().toISOString(),
      notes: notes.trim(),
    });
    setModal(false);
    setWeight('');
    setNotes('');
    refresh();
    load();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sub, { color: colors.textSecondary, paddingHorizontal: 16 }]}>{earTag}</Text>
      {adg != null && (
        <Text style={[styles.adg, { color: colors.tint, paddingHorizontal: 16 }]}>
          ADG: +{adg} g/gün (son 30 gün)
        </Text>
      )}
      <KiloGrafigi records={records} />
      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{item.weightKg} kg</Text>
            <Text style={{ color: colors.textSecondary }}>
              {new Date(item.recordedAt).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        )}
      />
      <View style={{ padding: 16 }}>
        <AnaButon title="+ Yeni Tartım Ekle" onPress={() => setModal(true)} />
      </View>

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Yeni Tartım</Text>
            <TextInput
              placeholder="Kilo (kg)"
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              placeholder="Not (opsiyonel)"
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <AnaButon title="Kaydet" onPress={save} />
            <AnaButon title="İptal" variant="secondary" onPress={() => setModal(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sub: { marginTop: 8 },
  adg: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 16, minHeight: 48 },
});
