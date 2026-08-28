import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { sesKomutOturumuOlustur } from '@/kaynak/ses';

export default function SesKomutScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const [oturum] = useState(() => sesKomutOturumuOlustur());
  const [metin, setMetin] = useState('');
  const [okuma, setOkuma] = useState('Komut yazın veya konuşma metnini yapıştırın. Örn: küpe 1234, 68 kilo');
  const [asama, setAsama] = useState('hazir');

  const gonder = async () => {
    const sonuc = await oturum.metinAl(metin);
    setOkuma(sonuc.okumaMetni);
    setAsama(sonuc.asama);
    if (sonuc.asama === 'uygulandi') {
      refresh();
      setMetin('');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Sesli komut' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.pad}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Geri okuma → &quot;tamam&quot; onayı → kayıt. Mikrofon sonra; şimdilik metin ile test edin.
        </Text>
        <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 6 }}>Sistem</Text>
          <Text style={{ color: colors.text, lineHeight: 22 }}>{okuma}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>Aşama: {asama}</Text>
        </View>
        <TextInput
          placeholder='Örn: "küpe TR-34-001235, 52 kilo" sonra "tamam"'
          placeholderTextColor={colors.textSecondary}
          value={metin}
          onChangeText={setMetin}
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
        />
        <AnaButon title="Gönder" onPress={gonder} />
        <AnaButon
          title="İptal"
          variant="secondary"
          onPress={() => {
            const r = oturum.iptalEt();
            setOkuma(r.okumaMetni);
            setAsama(r.asama);
          }}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  intro: { lineHeight: 20, marginBottom: 16 },
  box: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 48, marginBottom: 12 },
});
