import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  SERI_MOD_ETIKET,
  getSeriOturum,
  seriKayitEkle,
  seriOturumBaslat,
  seriOturumBitir,
  type SeriMod,
  type SeriOturum,
} from '@/kaynak/seri-giris/mod';

export default function SeriGirisScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [mod, setMod] = useState<SeriMod>('tartim');
  const [oturum, setOturum] = useState<SeriOturum | null>(null);
  const [satir, setSatir] = useState('');

  const load = useCallback(async () => {
    setOturum(await getSeriOturum());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const baslat = async () => {
    setOturum(await seriOturumBaslat(mod));
  };

  const ekle = async () => {
    if (!satir.trim()) return;
    setOturum(await seriKayitEkle(satir));
    setSatir('');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Seri ahır modu' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.pad}>
        <Text style={{ color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
          Ahır içinde arka arkaya kayıt. Her satır bir hayvan/kayıt; sonra toplu uygulama eklenecek.
        </Text>
        {!oturum ? (
          <>
            <AltButonlar
              items={[
                { key: 'tartim', label: 'Tartım' },
                { key: 'asi', label: 'Aşı' },
              ]}
              activeKey={mod}
              onSelect={(k) => setMod(k as SeriMod)}
            />
            <AnaButon title={`${SERI_MOD_ETIKET[mod]} başlat`} onPress={baslat} />
          </>
        ) : (
          <>
            <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 8 }}>
              {SERI_MOD_ETIKET[oturum.mod]} · {oturum.kayitlar.length} kayıt
            </Text>
            <TextInput
              placeholder={oturum.mod === 'tartim' ? 'küpe, kilo' : 'küpe, aşı adı'}
              placeholderTextColor={colors.textSecondary}
              value={satir}
              onChangeText={setSatir}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <AnaButon title="Satır ekle" onPress={ekle} />
            {oturum.kayitlar.map((k) => (
              <Text key={k.id} style={{ color: colors.text, marginTop: 6 }}>
                • {k.metin}
              </Text>
            ))}
            <View style={{ marginTop: 16 }}>
              <AnaButon
                title="Oturumu bitir"
                variant="secondary"
                onPress={async () => {
                  await seriOturumBitir();
                  await load();
                  Alert.alert('Tamam', 'Seri oturum kapatıldı.');
                }}
              />
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 48, marginBottom: 12 },
});
