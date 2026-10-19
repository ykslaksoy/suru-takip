import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { tartimSil } from '@/kaynak/gecmis/hayvan-sil';
import { useLocalSearchParams } from 'expo-router';
import { KiloGrafigi } from '@/bilesenler/kilo/KiloGrafigi';
import { PerformansMetrikleri } from '@/bilesenler/kilo/PerformansMetrikleri';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { addWeightRecord, calculateADG, getAnimal, getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket, hayvanAltEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { WeightRecord } from '@/kaynak/cekirdek/tipler';
import { upsertRationPlanFromWeight } from '@/kaynak/rasyon/hayvan-plani';
import { islemKaydet } from '@/kaynak/gecmis/gunluk';
import {
  analizOzeti,
  referansKg,
  tartimAnaliz,
  VARSAYILAN_TARTIM_AYAR,
  type TartimAyar,
} from '@/kaynak/kilo/hizli-tartim';
import { getTartimAyar } from '@/kaynak/kilo/tartim-ayar';

export default function WeightScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, refresh } = useDatabase();
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [adg, setAdg] = useState<number | null>(null);
  const [baslik, setBaslik] = useState('');
  const [altBaslik, setAltBaslik] = useState('');
  const [modal, setModal] = useState(false);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [ayar, setAyar] = useState<TartimAyar>(VARSAYILAN_TARTIM_AYAR);
  useEffect(() => {
    getTartimAyar().then(setAyar).catch(() => {});
  }, []);
  const sirali = [...records].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const son = sirali[sirali.length - 1];
  const analiz = son ? tartimAnaliz(sirali.slice(0, -1), { kg: son.weightKg, at: son.recordedAt }, ayar) : null;

  const load = useCallback(async () => {
    if (!id) return;
    const animal = await getAnimal(id);
    if (animal) {
      setBaslik(hayvanAnaEtiket(animal));
      setAltBaslik(hayvanAltEtiket(animal));
    }
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
    const animal = await getAnimal(id);
    if (animal) await upsertRationPlanFromWeight(animal, w);
    await islemKaydet({ tur: 'tartim', ozet: `${animal ? hayvanAnaEtiket(animal) : id} · ${w} kg`, animalId: id });
    setModal(false);
    setWeight('');
    setNotes('');
    refresh();
    load();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={[...sirali].reverse()}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListHeaderComponent={
          <>
      <Text style={[styles.sub, { color: colors.text, paddingHorizontal: 16, fontWeight: '700' }]}>{baslik}</Text>
      {altBaslik ? (
        <Text style={[styles.sub, { color: colors.textSecondary, paddingHorizontal: 16 }]}>{altBaslik}</Text>
      ) : null}
      {analiz ? (
        <View style={[styles.analiz, { backgroundColor: colors.card, borderColor: analiz.egriAltinda ? colors.warning : colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Son tartım: {String(analiz.kg).replace('.', ',')} kg</Text>
          <Text style={{ color: analiz.egriAltinda ? colors.warning : colors.textSecondary, marginTop: 2 }}>
            {analizOzeti(analiz, ayar) || 'Günlük artış için en az iki farklı günde tartım gerekir'}
          </Text>
          {analiz.beklenenKg != null ? (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              Referans eğriye göre beklenen: {String(analiz.beklenenKg).replace('.', ',')} kg
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={{ marginHorizontal: 16 }}>
        <KiloGrafigi records={records} referans={(at) => referansKg(records, at, ayar)} />
      </View>
      {id ? <PerformansMetrikleri animalId={id} adg={adg} records={records} /> : null}
            <Text style={{ color: colors.textSecondary, fontWeight: '800', fontSize: 12, marginHorizontal: 16, marginTop: 8 }}>TARTIM GEÇMİŞİ</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: colors.border, marginHorizontal: 16 }]}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{item.weightKg} kg</Text>
            <Text style={{ color: colors.textSecondary, flex: 1, textAlign: 'right', marginRight: 12 }}>
              {new Date(item.recordedAt).toLocaleDateString('tr-TR')}
            </Text>
            <Pressable
              hitSlop={8}
              onPress={() => {
                const yap = async () => {
                  await tartimSil(item, baslik);
                  refresh();
                  load();
                };
                const m = `${item.weightKg} kg tartım silinsin mi? 30 gün geri dönüşüm kutusunda kalır.`;
                if (Platform.OS === 'web') {
                  if (typeof window !== 'undefined' && window.confirm(m)) void yap();
                } else Alert.alert('Sil', m, [{ text: 'İptal', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: () => void yap() }]);
              }}>
              <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>Sil</Text>
            </Pressable>
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
  sub: { marginTop: 8, marginBottom: 4 },
  analiz: { borderWidth: 1, borderRadius: 12, padding: 12, marginHorizontal: 16, marginTop: 8 },
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
