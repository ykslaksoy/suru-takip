import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { analyzeSymptoms, VET_DISCLAIMER } from '@/kaynak/akilli-veteriner/analiz';
import type { VetSuggestion } from '@/kaynak/cekirdek/tipler';

type Alt = 'semptom' | 'foto';

export default function VetScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [alt, setAlt] = useState<Alt>('semptom');
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState<VetSuggestion | null>(null);

  const analyze = () => {
    setResult(analyzeSymptoms(symptoms));
  };

  const urgencyColor = {
    low: colors.success,
    medium: colors.warning,
    high: colors.danger,
  };

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <AltButonlar
        items={[
          { key: 'semptom', label: 'Semptom' },
          { key: 'foto', label: 'Fotoğraf' },
        ]}
        activeKey={alt}
        onSelect={(k) => setAlt(k as Alt)}
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[styles.disclaimer, { backgroundColor: colors.warning + '33', borderColor: colors.warning }]}>
          <Text style={{ color: colors.text, fontSize: 13, lineHeight: 20 }}>{VET_DISCLAIMER}</Text>
        </View>

        {alt === 'foto' ? (
          <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
            Hastalık fotoğrafı çek / yükle bir sonraki adımda eklenecek. Şimdilik Semptom ile yazarak analiz et.
          </Text>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Akıllı Veteriner</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
              Gözlemlediğiniz belirtileri yazın (ör: ishal, topallama, iştahsızlık)
            </Text>

            <TextInput
              placeholder="Belirtileri buraya yazın..."
              multiline
              value={symptoms}
              onChangeText={setSymptoms}
              style={[styles.input, { borderColor: colors.border, color: colors.text, minHeight: 120 }]}
            />

            <AnaButon title="Analiz Et" onPress={analyze} />

            {result && (
              <View style={[styles.result, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.urgency, { color: urgencyColor[result.urgency] }]}>
                  Aciliyet: {result.urgency === 'high' ? 'Yüksek' : result.urgency === 'medium' ? 'Orta' : 'Düşük'}
                  {result.seeVet ? ' · Veteriner önerilir' : ''}
                </Text>
                {result.conditions.length > 0 && (
                  <>
                    <Text style={[styles.section, { color: colors.tint }]}>Olası durumlar (bilgilendirme)</Text>
                    {result.conditions.map((c, i) => (
                      <Text key={i} style={{ color: colors.text }}>
                        • {c}
                      </Text>
                    ))}
                  </>
                )}
                <Text style={[styles.section, { color: colors.tint }]}>Önerilen adımlar</Text>
                <Text style={{ color: colors.text, lineHeight: 22 }}>{result.advice}</Text>
              </View>
            )}

            <Text style={[styles.examples, { color: colors.textSecondary }]}>
              Örnek: ishal, topallama, düşük, öksürük, kuzu emmeme
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  container: { flex: 1, padding: 16 },
  disclaimer: { padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800' },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, textAlignVertical: 'top' },
  result: { marginTop: 20, padding: 16, borderRadius: 12, borderWidth: 1 },
  urgency: { fontWeight: '700', marginBottom: 12 },
  section: { fontWeight: '700', marginTop: 12, marginBottom: 6 },
  examples: { marginTop: 24, fontSize: 13, fontStyle: 'italic' },
});
