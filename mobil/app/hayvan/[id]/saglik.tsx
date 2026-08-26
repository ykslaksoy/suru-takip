import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { addHealthRecord, getAnimal, getHealthRecords, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import type { HealthRecord } from '@/kaynak/cekirdek/tipler';

export default function AnimalHealthScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, refresh } = useDatabase();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    recordType: 'illness' as HealthRecord['recordType'],
    symptoms: '',
    diagnosis: '',
    treatment: '',
    medicine: '',
    withdrawalDays: '0',
    vetName: '',
    notes: '',
  });

  const load = useCallback(async () => {
    if (!id) return;
    setRecords(await getHealthRecords(id));
  }, [id]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const save = async () => {
    if (!id) return;
    await addHealthRecord({
      animalId: id,
      recordType: form.recordType,
      symptoms: form.symptoms.trim(),
      diagnosis: form.diagnosis.trim(),
      treatment: form.treatment.trim(),
      medicine: form.medicine.trim(),
      withdrawalDays: parseInt(form.withdrawalDays, 10) || 0,
      vetName: form.vetName.trim(),
      recordedAt: new Date().toISOString(),
      notes: form.notes.trim(),
    });
    if (form.recordType === 'illness') {
      const animal = await getAnimal(id);
      if (animal) await upsertAnimal({ ...animal, status: 'sick' });
    }
    setModal(false);
    refresh();
    load();
  };

  const typeLabels: Record<HealthRecord['recordType'], string> = {
    illness: 'Hastalık',
    treatment: 'Tedavi',
    vaccine: 'Aşı',
    checkup: 'Kontrol',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.type, { color: colors.tint }]}>{typeLabels[item.recordType]}</Text>
            <Text style={{ color: colors.text, fontWeight: '600', marginTop: 4 }}>
              {item.symptoms || item.diagnosis || item.treatment}
            </Text>
            {item.medicine ? (
              <Text style={{ color: colors.textSecondary, marginTop: 4 }}>İlaç: {item.medicine}</Text>
            ) : null}
            {item.withdrawalDays > 0 ? (
              <Text style={{ color: colors.warning, marginTop: 4 }}>
                Bekletme: {item.withdrawalDays} gün
              </Text>
            ) : null}
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
              {new Date(item.recordedAt).toLocaleDateString('tr-TR')}
              {item.vetName ? ` · ${item.vetName}` : ''}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textSecondary }}>Kayıt yok</Text>}
      />
      <View style={{ padding: 16 }}>
        <AnaButon title="+ Yeni Kayıt" onPress={() => setModal(true)} />
      </View>

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sağlık Kaydı</Text>
            <View style={styles.typeRow}>
              {(['illness', 'treatment', 'vaccine', 'checkup'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setForm({ ...form, recordType: t })}
                  style={[styles.chip, { backgroundColor: form.recordType === t ? colors.tint : colors.background, borderColor: colors.border }]}>
                  <Text style={{ color: form.recordType === t ? '#fff' : colors.text, fontSize: 12 }}>{typeLabels[t]}</Text>
                </Pressable>
              ))}
            </View>
            {[
              { key: 'symptoms', ph: 'Belirtiler' },
              { key: 'diagnosis', ph: 'Teşhis / tanı' },
              { key: 'treatment', ph: 'Tedavi' },
              { key: 'medicine', ph: 'İlaç / aşı adı' },
              { key: 'withdrawalDays', ph: 'Bekletme süresi (gün)' },
              { key: 'vetName', ph: 'Veteriner adı' },
              { key: 'notes', ph: 'Not' },
            ].map((f) => (
              <TextInput
                key={f.key}
                placeholder={f.ph}
                value={form[f.key as keyof typeof form]}
                onChangeText={(v) => setForm({ ...form, [f.key]: v })}
                keyboardType={f.key === 'withdrawalDays' ? 'number-pad' : 'default'}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
            ))}
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
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  type: { fontWeight: '700', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8, fontSize: 15, minHeight: 44 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
});
