import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import { VetIletisimFormu } from '@/bilesenler/veteriner/VetIletisimFormu';
import { VetInboxKarti } from '@/bilesenler/veteriner/VetInboxKarti';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { analyzeSymptoms, VET_DISCLAIMER } from '@/kaynak/akilli-veteriner/analiz';
import { olusturVakaPaketi } from '@/kaynak/veteriner-koprusu/vaka-paketi';
import { gonderVakaPaketi } from '@/kaynak/veteriner-koprusu/gonder';
import { vetGonderimKanali } from '@/kaynak/veteriner-koprusu/vet-iletisim';
import type { VetSuggestion } from '@/kaynak/cekirdek/tipler';

type Alt = 'semptom' | 'gonder' | 'vakalar' | 'vet-ayar';

export default function VetScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [alt, setAlt] = useState<Alt>('semptom');
  const [symptoms, setSymptoms] = useState('');
  const [kupe, setKupe] = useState('');
  const [result, setResult] = useState<VetSuggestion | null>(null);
  const [kanalAciklama, setKanalAciklama] = useState('');
  const [inboxKey, setInboxKey] = useState(0);

  const loadKanal = useCallback(async () => {
    const k = await vetGonderimKanali();
    setKanalAciklama(k.aciklama);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadKanal();
    }, [loadKanal])
  );

  const aiOzet = result
    ? `Aciliyet: ${result.urgency} · ${result.advice.slice(0, 120)}${result.advice.length > 120 ? '…' : ''}`
    : undefined;

  const veterinerGonder = async () => {
    const paket = await olusturVakaPaketi(kupe, symptoms, { aiOzet });
    if (!paket) {
      Alert.alert('Eksik', 'Kulak küpe numarası gerekli');
      return;
    }
    const sonuc = await gonderVakaPaketi(paket);
    if (!sonuc.ok) {
      Alert.alert('Veteriner tanımlı değil', sonuc.message, [
        { text: 'Tamam' },
        { text: 'Vet ayarları', onPress: () => setAlt('vet-ayar') },
      ]);
      return;
    }
    setInboxKey((k) => k + 1);
    Alert.alert(
      sonuc.kanal === 'program' ? 'Programa iletildi' : 'WhatsApp',
      sonuc.message,
      sonuc.kanal === 'program'
        ? [{ text: 'Vakalar', onPress: () => setAlt('vakalar') }, { text: 'Tamam' }]
        : [{ text: 'Tamam' }]
    );
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
          { key: 'gonder', label: 'Vet gönder' },
          { key: 'vakalar', label: 'Vakalar' },
          { key: 'vet-ayar', label: 'Vet ayarı' },
        ]}
        activeKey={alt}
        onSelect={(k) => setAlt(k as Alt)}
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[styles.disclaimer, { backgroundColor: colors.warning + '33', borderColor: colors.warning }]}>
          <Text style={{ color: colors.text, fontSize: 13, lineHeight: 20 }}>{VET_DISCLAIMER}</Text>
        </View>

        {alt === 'vet-ayar' ? (
          <VetIletisimFormu
            onKaydedildi={() => {
              loadKanal();
              setAlt('gonder');
            }}
          />
        ) : alt === 'vakalar' ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Gönderilen vakalar</Text>
            <VetInboxKarti refreshKey={inboxKey} />
          </>
        ) : alt === 'gonder' ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Veterinere gönder</Text>
            <Text style={{ color: colors.tint, fontWeight: '700', marginBottom: 12, lineHeight: 20 }}>
              {kanalAciklama}
            </Text>
            <TextInput
              placeholder="Kulak küpe no"
              value={kupe}
              onChangeText={setKupe}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              placeholder="Semptom / gözlem / ne denendi"
              multiline
              value={symptoms}
              onChangeText={setSymptoms}
              style={[styles.input, { borderColor: colors.border, color: colors.text, minHeight: 100 }]}
            />
            <AnaButon title="Veterinere gönder" onPress={veterinerGonder} />
            <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13, lineHeight: 18 }}>
              Programda kayıtlı vet → uygulama içi vaka. Değilse → WhatsApp mesajı açılır.
            </Text>
          </>
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

            <AnaButon title="Analiz Et" onPress={() => setResult(analyzeSymptoms(symptoms))} />

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
                {result.seeVet ? (
                  <View style={{ marginTop: 14 }}>
                    <AnaButon
                      title="Veterinere gönder"
                      onPress={() => {
                        setAlt('gonder');
                      }}
                    />
                  </View>
                ) : null}
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
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, textAlignVertical: 'top', marginBottom: 10 },
  result: { marginTop: 20, padding: 16, borderRadius: 12, borderWidth: 1 },
  urgency: { fontWeight: '700', marginBottom: 12 },
  section: { fontWeight: '700', marginTop: 12, marginBottom: 6 },
  examples: { marginTop: 24, fontSize: 13, fontStyle: 'italic' },
});
