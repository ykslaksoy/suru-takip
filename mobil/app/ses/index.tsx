import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import {
  dinlemeyiBaslat,
  konusmaDurumu,
  metniSeslendir,
  sesKomutOturumuOlustur,
  seslendirmeyiDurdur,
  type DinlemeKontrol,
} from '@/kaynak/ses';

const ORNEKLER = [
  'küpe 1234, 68 kilo',
  'küpe TR-34-001235 aşı çiçek',
  'stok giriş yem 50 kg',
  'tamam',
];

export default function SesKomutScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const [oturum] = useState(() => sesKomutOturumuOlustur());
  const [metin, setMetin] = useState('');
  const [okuma, setOkuma] = useState('Komut yazın veya dinlemeyi başlatın. Örn: küpe 1234, 68 kilo');
  const [asama, setAsama] = useState('hazir');
  const [dinliyor, setDinliyor] = useState(false);
  const [ahirModu, setAhirModu] = useState(true);
  const [uygulanan, setUygulanan] = useState(0);
  const dinlemeRef = useRef<DinlemeKontrol | null>(null);
  const ahirRef = useRef(true);
  const durum = useMemo(() => konusmaDurumu(), []);

  ahirRef.current = ahirModu;

  const dinlemeyiAc = useCallback(() => {
    seslendirmeyiDurdur();
    const ctrl = dinlemeyiBaslat({
      onBasladi: () => setDinliyor(true),
      onSonuc: (t) => {
        setDinliyor(false);
        setMetin(t);
        void isleRef.current(t);
      },
      onHata: (mesaj) => {
        setDinliyor(false);
        if (!ahirRef.current) Alert.alert('Dinleme', mesaj);
      },
    });
    dinlemeRef.current = ctrl;
    if (!ctrl) setDinliyor(false);
  }, []);

  const isleRef = useRef<(girdi: string) => Promise<void>>(async () => {});

  const isle = useCallback(
    async (girdi: string) => {
      const sonuc = await oturum.metinAl(girdi);
      setOkuma(sonuc.okumaMetni);
      setAsama(sonuc.asama);
      metniSeslendir(sonuc.okumaMetni);
      if (sonuc.asama === 'uygulandi') {
        refresh();
        setMetin('');
        setUygulanan((n) => n + 1);
        if (ahirRef.current) {
          // Sonraki hayvan — kısa bekleme sonra dinle (TTS bitsin)
          setTimeout(() => {
            if (ahirRef.current) dinlemeyiAc();
          }, 1200);
        }
      } else if (sonuc.asama === 'onay_bekliyor' && ahirRef.current && durum.sttHazir) {
        setTimeout(() => {
          if (ahirRef.current) dinlemeyiAc();
        }, 900);
      }
    },
    [oturum, refresh, dinlemeyiAc, durum.sttHazir]
  );

  isleRef.current = isle;

  const gonder = async () => {
    await isle(metin);
  };

  const dinle = () => {
    if (dinliyor) {
      dinlemeRef.current?.durdur();
      setDinliyor(false);
      return;
    }
    dinlemeyiAc();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Sesli komut' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.pad}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>{durum.aciklama}</Text>

        <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Ahır modu</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              Onay sonrası sonraki komutu dinlemeye devam et
            </Text>
          </View>
          <Switch value={ahirModu} onValueChange={setAhirModu} />
        </View>

        <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 6 }}>Sistem</Text>
          <Text style={{ color: colors.text, lineHeight: 22 }}>{okuma}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>
            Aşama: {asama}
            {uygulanan > 0 ? ` · Bu oturumda ${uygulanan} kayıt` : ''}
          </Text>
        </View>

        <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 13 }}>Hızlı örnek</Text>
        <View style={styles.ornekRow}>
          {ORNEKLER.map((o) => (
            <Pressable
              key={o}
              onPress={() => setMetin(o)}
              style={[styles.ornek, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={{ color: colors.text, fontSize: 12 }}>{o}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          placeholder='Örn: "küpe TR-34-001235, 52 kilo" sonra "tamam"'
          placeholderTextColor={colors.textSecondary}
          value={metin}
          onChangeText={setMetin}
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
        />
        <AnaButon title={dinliyor ? 'Dinlemeyi durdur' : 'Dinle'} variant="secondary" onPress={dinle} />
        <AnaButon title="Gönder" onPress={() => void gonder()} />
        <AnaButon
          title="İptal"
          variant="secondary"
          onPress={() => {
            seslendirmeyiDurdur();
            dinlemeRef.current?.durdur();
            setDinliyor(false);
            const r = oturum.iptalEt();
            setOkuma(r.okumaMetni);
            setAsama(r.asama);
            metniSeslendir(r.okumaMetni);
          }}
        />

        <Pressable
          onPress={() => router.push('/seri-giris')}
          style={StyleSheet.flatten([
            styles.link,
            { borderColor: colors.border, backgroundColor: colors.card },
          ])}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Seri ahır modu (toplu satır)</Text>
          <Text style={{ color: colors.tint }}>→</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  intro: { lineHeight: 20, marginBottom: 16 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  box: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 48, marginBottom: 12 },
  ornekRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  ornek: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  link: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
