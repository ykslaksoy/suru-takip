import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import { countAnimals, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { validateGehisId, validateTurkvetNo } from '@/kaynak/turkvet/dogrula';
import type { AnimalSex, AnimalStatus } from '@/kaynak/cekirdek/tipler';

export default function AddAnimalScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const { limit } = useSubscription();
  const [form, setForm] = useState({
    earTag: '',
    turkvetNo: '',
    gehisId: '',
    name: '',
    breed: 'Merinos',
    sex: 'female' as AnimalSex,
    birthDate: new Date().toISOString().split('T')[0],
    paddock: 'Padok A',
    status: 'healthy' as AnimalStatus,
    motherId: '',
    notes: '',
  });

  const save = async () => {
    const count = await countAnimals();
    if (count >= limit) {
      Alert.alert('Limit aşıldı', `Mevcut paketiniz en fazla ${limit} hayvan destekler. Abonelik yükseltin.`, [
        { text: 'Tamam' },
        { text: 'Abonelik', onPress: () => router.push('/abonelik') },
      ]);
      return;
    }
    if (!form.earTag.trim()) {
      Alert.alert('Hata', 'Kulak küpe numarası zorunlu');
      return;
    }
    const tv = validateTurkvetNo(form.turkvetNo);
    if (!tv.valid) {
      Alert.alert('Hata', tv.message);
      return;
    }
    const gh = validateGehisId(form.gehisId);
    if (!gh.valid) {
      Alert.alert('Hata', gh.message);
      return;
    }

    await upsertAnimal({
      id: uuidv4(),
      earTag: form.earTag.trim(),
      turkvetNo: form.turkvetNo.replace(/\s/g, '').toUpperCase(),
      gehisId: form.gehisId.replace(/\s/g, '') || null,
      name: form.name.trim(),
      breed: form.breed.trim(),
      sex: form.sex,
      birthDate: form.birthDate,
      paddock: form.paddock.trim(),
      status: form.status,
      motherId: form.motherId.trim() || null,
      notes: form.notes.trim(),
    });
    refresh();
    router.back();
  };

  const fields: { key: keyof typeof form; label: string; placeholder: string }[] = [
    { key: 'earTag', label: 'Kulak Küpe No *', placeholder: 'TR-34-001234' },
    { key: 'turkvetNo', label: 'TÜRKVET Kimlik No', placeholder: 'TR340012345678901' },
    { key: 'gehisId', label: 'GEKİS Elektronik Kimlik', placeholder: 'Gelecek entegrasyon' },
    { key: 'name', label: 'İsim', placeholder: 'Koyun adı (opsiyonel)' },
    { key: 'breed', label: 'Irk', placeholder: 'Merinos, İvesi, Sakız...' },
    { key: 'birthDate', label: 'Doğum Tarihi', placeholder: 'YYYY-MM-DD' },
    { key: 'paddock', label: 'Padok', placeholder: 'Padok A' },
    { key: 'motherId', label: 'Anne TÜRKVET No', placeholder: 'Opsiyonel' },
    { key: 'notes', label: 'Not', placeholder: 'Ek bilgi' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        TÜRKVET ve GEKİS alanları resmi kayıt uyumu için hazırlanmıştır.
      </Text>
      {fields.map((f) => (
        <View key={f.key} style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>{f.label}</Text>
          <TextInput
            value={form[f.key]}
            onChangeText={(v) => setForm({ ...form, [f.key]: v })}
            placeholder={f.placeholder}
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          />
        </View>
      ))}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Cinsiyet</Text>
        <View style={styles.row}>
          {(['female', 'male'] as AnimalSex[]).map((s) => (
            <AnaButon
              key={s}
              title={s === 'female' ? 'Dişi ♀' : 'Erkek ♂'}
              variant={form.sex === s ? 'primary' : 'secondary'}
              onPress={() => setForm({ ...form, sex: s })}
            />
          ))}
        </View>
      </View>
      <View style={{ padding: 16 }}>
        <AnaButon title="Kaydet" onPress={save} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hint: { padding: 16, fontSize: 13 },
  field: { paddingHorizontal: 16, marginBottom: 8 },
  label: { fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, minHeight: 48 },
  row: { flexDirection: 'row', gap: 8 },
});
