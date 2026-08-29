import { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { exportTurkvetData, getAnimals } from '@/kaynak/cekirdek/veritabani';
import { TURKVET_FIELD_LABELS } from '@/kaynak/turkvet/dogrula';
import {
  resmiApiDurum,
  turkvetKontrolListesi,
  turkvetCsvAktar,
  VETBIS_ASI_NOTLARI,
  type TurkvetKontrolSatir,
} from '@/kaynak/turkvet/resmi-api';
import { terim } from '@/sabitler/Metinler';

export default function TurkvetAktarimEkrani() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [preview, setPreview] = useState('');
  const [kontrol, setKontrol] = useState<{ tamam: number; eksik: number; satirlar: TurkvetKontrolSatir[] } | null>(
    null
  );
  const api = resmiApiDurum();

  const loadPreview = async () => {
    const json = await exportTurkvetData();
    setPreview(json.slice(0, 2000) + (json.length > 2000 ? '\n...' : ''));
  };

  const exportData = async () => {
    const json = await exportTurkvetData();
    try {
      await Share.share({ message: json, title: 'TÜRKVET Dışa Aktarım' });
    } catch {
      Alert.alert('Dışa aktarım', `${(await getAnimals()).length} hayvan dışa aktarıldı.`);
    }
  };

  const exportCsv = async () => {
    const csv = await turkvetCsvAktar();
    try {
      await Share.share({ message: csv, title: 'TÜRKVET CSV' });
    } catch {
      Alert.alert('CSV', 'CSV oluşturuldu.');
    }
  };

  const kontrolEt = async () => {
    setKontrol(await turkvetKontrolListesi());
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>TÜRKVET / VETBİS / GEKİS</Text>
      <Text style={{ color: colors.textSecondary, lineHeight: 22, marginBottom: 12 }}>
        Alan doğrulama, kontrol listesi ve JSON/CSV dışa aktarım. Canlı resmi API erişimi sağlandığında bildirim
        buradan açılır.
      </Text>

      <View
        style={[
          styles.fields,
          {
            backgroundColor: api.ok ? colors.tint + '12' : colors.warning + '22',
            borderColor: api.ok ? colors.tint : colors.warning,
          },
        ]}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>API: {api.durum}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 }}>{api.message}</Text>
      </View>

      <View style={[styles.fields, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.tint }]}>Zorunlu / önerilen alanlar</Text>
        {Object.entries(TURKVET_FIELD_LABELS).map(([key, label]) => (
          <Text key={key} style={{ color: colors.text, marginBottom: 4 }}>
            • {label}
          </Text>
        ))}
      </View>

      <View style={[styles.fields, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.tint }]}>VETBİS notları</Text>
        {VETBIS_ASI_NOTLARI.map((n) => (
          <Text key={n} style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4, lineHeight: 18 }}>
            • {n}
          </Text>
        ))}
      </View>

      <AnaButon title="Alan kontrol listesi" variant="secondary" onPress={() => void kontrolEt()} />
      {kontrol ? (
        <View style={[styles.fields, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>
            {kontrol.tamam} tamam · {kontrol.eksik} eksik
          </Text>
          {kontrol.satirlar
            .filter((s) => s.eksikler.length > 0)
            .slice(0, 12)
            .map((s) => (
              <Text key={s.animalId} style={{ color: colors.warning, fontSize: 12, marginTop: 4 }}>
                {s.earTag}: {s.eksikler.join(', ')}
              </Text>
            ))}
        </View>
      ) : null}

      <AnaButon title="Önizleme Yükle" onPress={() => void loadPreview()} />
      <AnaButon title={`${terim('JSON')} Dışa Aktar`} onPress={() => void exportData()} />
      <AnaButon title="CSV Dışa Aktar (Excel)" variant="secondary" onPress={() => void exportCsv()} />

      {preview ? (
        <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontFamily: 'SpaceMono', fontSize: 11 }}>{preview}</Text>
        </View>
      ) : null}

      <Text style={[styles.note, { color: colors.textSecondary }]}>
        GEKİS alanı hayvan formunda vardır. Canlı TÜRKVET bildirimi resmi API anahtarı (EXPO_PUBLIC_TURKVET_API_KEY)
        ile açılır.
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
