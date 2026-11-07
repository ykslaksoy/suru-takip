import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { ocrBaskulEkranFotodan, ocrBaskulEkranNormalize, ocrMotorDestekleniyor } from '@/kaynak/ocr';
import { kiloMetinFormat } from '@/kaynak/giris-yontemi';

type Props = {
  devreDisi?: boolean;
  onOnay: (kg: string) => void;
};

function uyar(baslik: string, mesaj: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`${baslik}\n\n${mesaj}`);
  else Alert.alert(baslik, mesaj);
}

async function fotoCek(): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const izin = await ImagePicker.requestCameraPermissionsAsync();
    if (izin.status !== 'granted') return null;
  }
  const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.95 });
  if (r.canceled || !r.assets?.[0]) return null;
  return r.assets[0].uri;
}

export function BaskulEkranOcrPaneli({ devreDisi, onOnay }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [ham, setHam] = useState('');
  const [bekleyenKg, setBekleyenKg] = useState<number | null>(null);
  const [belirsiz, setBelirsiz] = useState<number[] | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  const motorYok = !ocrMotorDestekleniyor();

  const isle = async (metin?: string, uri?: string) => {
    setBekleyenKg(null);
    setBelirsiz(null);
    setCalisiyor(true);
    const r = await ocrBaskulEkranFotodan({ metin, uri });
    setCalisiyor(false);
    if (!r.ok) {
      if (r.durum === 'belirsiz' && r.adaylar?.length) {
        setBelirsiz(r.adaylar);
        if (r.ham) setHam(r.ham);
        uyar('Belirsiz', r.message);
        return;
      }
      uyar('OCR', r.message);
      if (r.ham) setHam(r.ham);
      return;
    }
    setHam(r.ham);
    setBekleyenKg(r.kg);
  };

  const fotodan = async () => {
    if (motorYok) {
      uyar('OCR', 'Bu ortamda baskül ekranı fotoğraf OCR yok. Kiloyu elle veya sesle girin.');
      return;
    }
    const uri = await fotoCek();
    if (!uri) return;
    await isle(undefined, uri);
  };

  return (
    <View style={[styles.kutu, { borderColor: colors.border, backgroundColor: colors.card, opacity: devreDisi ? 0.55 : 1 }]}>
      <Text style={{ color: colors.text, fontWeight: '800' }}>Baskül ekranı OCR</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
        Küpe değil — yalnızca tartı ekranındaki kilo. Okuma sonrası onaylamadan kayda gitmez.
      </Text>
      {motorYok ? (
        <Text style={{ color: colors.warning, fontSize: 12, marginTop: 6, lineHeight: 18, fontWeight: '700' }}>
          Fotoğraf OCR bu build’de yok. Metni elle yapıştırın veya «Elle»/«Ses» kullanın.
        </Text>
      ) : null}
      <TextInput
        editable={!devreDisi}
        value={ham}
        onChangeText={setHam}
        placeholder="Okunan metni yapıştırın veya fotoğraf çekin"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
      />
      <AnaButon
        title={calisiyor ? 'Okunuyor…' : ham.trim() ? 'Metinden kilo çıkar' : 'Ekran fotoğrafı çek'}
        variant="secondary"
        disabled={devreDisi || calisiyor}
        onPress={() => void (ham.trim() ? isle(ham) : fotodan())}
      />
      {belirsiz?.length ? (
        <View style={{ marginTop: 8 }}>
          <Text style={{ color: colors.warning, fontWeight: '700', marginBottom: 6 }}>Hangisi doğru kilo?</Text>
          {belirsiz.map((kg) => (
            <AnaButon
              key={kg}
              title={`${kiloMetinFormat(kg)} kg`}
              variant="secondary"
              onPress={() => {
                setBekleyenKg(kg);
                setBelirsiz(null);
              }}
            />
          ))}
        </View>
      ) : null}
      {bekleyenKg != null ? (
        <View style={{ marginTop: 10, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.tint }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Önerilen: {kiloMetinFormat(bekleyenKg)} kg</Text>
          <View style={{ marginTop: 8, gap: 8 }}>
            <AnaButon
              title="Kiloyu onayla"
              disabled={devreDisi}
              onPress={() => {
                const n = ocrBaskulEkranNormalize(ham);
                if (!n.ok && bekleyenKg == null) {
                  uyar('OCR', 'Onay için geçerli tek kilo gerekli');
                  return;
                }
                onOnay(kiloMetinFormat(bekleyenKg));
                setBekleyenKg(null);
              }}
            />
            <AnaButon title="İptal" variant="secondary" onPress={() => setBekleyenKg(null)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kutu: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 48, marginTop: 8, marginBottom: 8 },
});
