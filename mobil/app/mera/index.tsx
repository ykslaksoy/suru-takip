import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useFocusEffect } from 'expo-router';
import { MeraHarita } from '@/bilesenler/mera/MeraHarita';
import { meraHaritaAktif } from '@/sabitler/ozellik-acik';
import {
  aktifOtlatmaYasaklari,
  degerlendirMeraKapasite,
  meraKapasiteKaydet,
  meraKapasiteOzeti,
  meraUygulamaEkle,
  type MeraKapasiteAyar,
  type MeraKapasiteSonuc,
  type MeraTarlaUygulama,
} from '@/kaynak/mera/kapasite';

export default function MeraEkrani() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { padok } = useLocalSearchParams<{ padok?: string }>();
  const [secili, setSecili] = useState<string | null>(padok?.trim() || null);
  const [ozet, setOzet] = useState<
    (MeraKapasiteSonuc & { ayar: MeraKapasiteAyar; yasaklar: MeraTarlaUygulama[] }) | null
  >(null);
  const [alan, setAlan] = useState('');
  const [tasima, setTasima] = useState('4');
  const [uygulama, setUygulama] = useState({ ad: '', gun: '14', bitis: '', tur: 'ilac' as 'ilac' | 'gubre' });

  const yenile = useCallback(async () => {
    const o = await meraKapasiteOzeti();
    setOzet(o);
    setAlan(String(o.ayar.alan || ''));
    setTasima(String(o.ayar.tasimaBasHa));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void yenile();
    }, [yenile]),
  );

  if (!meraHaritaAktif()) {
    return (
      <>
        <Stack.Screen options={{ title: 'Mera' }} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>
            Mera haritası bu ortamda kapalı (özellik bayrağı).
          </Text>
        </View>
      </>
    );
  }

  const kap = ozet ? degerlendirMeraKapasite(ozet.ayar, ozet.hayvan) : null;
  const yasaklar = ozet ? aktifOtlatmaYasaklari(ozet.ayar.uygulamalar) : [];

  return (
    <>
      <Stack.Screen options={{ title: 'Mera' }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.panel, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Taşıma kapasitesi (Faz 2)</Text>
          <TextInput
            placeholder="Alan (dönüm)"
            keyboardType="decimal-pad"
            value={alan}
            onChangeText={setAlan}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <TextInput
            placeholder="Baş / ha"
            keyboardType="decimal-pad"
            value={tasima}
            onChangeText={setTasima}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <Pressable
            onPress={async () => {
              await meraKapasiteKaydet({
                alan: parseFloat(alan.replace(',', '.')) || 0,
                birim: 'donum',
                tasimaBasHa: parseFloat(tasima.replace(',', '.')) || 4,
              });
              await yenile();
            }}
            style={[styles.btn, { backgroundColor: colors.tint }]}>
            <Text style={styles.btnText}>Kaydet</Text>
          </Pressable>
          {kap ? (
            <>
              <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                {kap.hayvan} baş / kapasite {kap.kapasite} baş ({kap.ha.toFixed(2)} ha)
              </Text>
              {kap.uyari ? (
                <Text style={{ color: '#c1121f', fontWeight: '800', marginTop: 6 }}>{kap.uyari}</Text>
              ) : (
                <Text style={{ color: colors.tint, marginTop: 6 }}>Kapasite uygun</Text>
              )}
            </>
          ) : null}
        </View>

        <View style={[styles.panel, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>İlaç / gübre uygulaması</Text>
          <TextInput
            placeholder="Ürün adı"
            value={uygulama.ad}
            onChangeText={(v) => setUygulama({ ...uygulama, ad: v })}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <TextInput
            placeholder="Otlatma yasağı (gün)"
            keyboardType="number-pad"
            value={uygulama.gun}
            onChangeText={(v) => setUygulama({ ...uygulama, gun: v })}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <Pressable
            onPress={async () => {
              const gun = parseInt(uygulama.gun, 10) || 14;
              const bas = new Date();
              const bit = new Date(bas);
              bit.setDate(bit.getDate() + gun);
              await meraUygulamaEkle({
                tur: uygulama.tur,
                ad: uygulama.ad || 'Uygulama',
                uygulamaTarihi: bas.toISOString().slice(0, 10),
                otlatmaBitis: bit.toISOString().slice(0, 10),
                not: '',
              });
              setUygulama({ ...uygulama, ad: '' });
              await yenile();
            }}
            style={[styles.btn, { backgroundColor: colors.tint }]}>
            <Text style={styles.btnText}>Uygulama kaydı</Text>
          </Pressable>
          {yasaklar.length ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: '#c1121f', fontWeight: '800' }}>Otlatma yasağı aktif</Text>
              {yasaklar.map((y) => (
                <Text key={y.id} style={{ color: colors.textSecondary, fontSize: 13 }}>
                  {y.ad} · bitiş {y.otlatmaBitis}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <MeraHarita
          seciliPadok={secili}
          onPadokSec={(ad) => {
            setSecili(ad);
            router.push({ pathname: '/(tabs)/suru', params: { padok: ad } } as never);
          }}
        />
        {secili ? (
          <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
            Seçili: {secili} · sürü listesine yönlendirildi
          </Text>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingBottom: 32 },
  panel: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  panelTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8, fontSize: 15 },
  btn: { padding: 10, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' },
});
