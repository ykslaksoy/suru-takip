import { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { exportTurkvetData, getAnimals } from '@/lib/database';
import { TURKVET_FIELD_LABELS } from '@/lib/turkvet';

export default function TurkvetExportScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [preview, setPreview] = useState('');

  const loadPreview = async () => {
    const json = await exportTurkvetData();
    setPreview(json.slice(0, 2000) + (json.length > 2000 ? '\n...' : ''));
  };

  const exportData = async () => {
    const json = await exportTurkvetData();
    try {
      await Share.share({ message: json, title: 'TÜRKVET Export' });
    } catch {
      Alert.alert('Export', `${(await getAnimals()).length} hayvan export edildi.`);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>TÜRKVET / GEKİS Uyumu</Text>
      <Text style={{ color: colors.textSecondary, lineHeight: 22, marginBottom: 16 }}>
        v2.0 entegrasyon hazırlığı: hayvan kayıtları resmi alanlarla uyumlu tutulur. 2030 ulusal dijital hayvancılık
        sistemine export desteği planlanmaktadır.
      </Text>

      <View style={[styles.fields, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.tint }]}>Zorunlu / önerilen alanlar</Text>
        {Object.entries(TURKVET_FIELD_LABELS).map(([key, label]) => (
          <Text key={key} style={{ color: colors.text, marginBottom: 4 }}>• {label}</Text>
        ))}
      </View>

      <PrimaryButton title="Önizleme Yükle" onPress={loadPreview} />
      <PrimaryButton title="JSON Export (Paylaş)" onPress={exportData} />

      {preview ? (
        <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontFamily: 'SpaceMono', fontSize: 11 }}>{preview}</Text>
        </View>
      ) : null}

      <Text style={[styles.note, { color: colors.textSecondary }]}>
        GEKİS elektronik kimlik alanı hayvan ekleme formunda mevcuttur. Canlı TÜRKVET API entegrasyonu resmi API
        erişimi sağlandığında eklenecektir.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  fields: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  section: { fontWeight: '700', marginBottom: 10 },
  preview: { marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1 },
  note: { marginTop: 20, fontSize: 12, lineHeight: 18, marginBottom: 40 },
});
