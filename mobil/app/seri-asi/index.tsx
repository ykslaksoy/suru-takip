import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { YontemOzeti } from '@/bilesenler/giris-yontemi/YontemOzeti';
import { useGirisYontemi } from '@/baglam/GirisYontemiBaglami';
import { etkinKuzuSecim } from '@/kaynak/giris-yontemi';
import { SERI_MOD_ETIKET, getSeriOturum, seriOturumBaslat, type SeriOturum } from '@/kaynak/seri-giris';
import { SeriOturumPaneli } from '@/bilesenler/seri-giris/SeriOturumPaneli';
import { router } from 'expo-router';

export default function SeriAsiScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tercih } = useGirisYontemi();
  const kuzuYontem = etkinKuzuSecim(tercih.kuzuSecim);
  const [oturum, setOturum] = useState<SeriOturum | null>(null);

  const load = useCallback(async () => {
    const o = await getSeriOturum();
    setOturum(o?.mod === 'asi' ? o : null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const baslat = async () => {
    setOturum(await seriOturumBaslat('asi'));
  };

  return (
    <>
      <Stack.Screen options={{ title: oturum ? SERI_MOD_ETIKET.asi : 'Seri aşı' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.pad}>
        {!oturum ? (
          <>
            <Text style={{ color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
              Ahırda arka arkaya aşı satırı ekleyin, sonra «Hepsini uygula» ile veritabanına yazın. Tartım ekranından ayrıdır.
            </Text>
            <YontemOzeti ayarlarLink />
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12, lineHeight: 18 }}>
              Kuzu no: {kuzuYontem === 'sesle-numara' ? 'ses veya yazı' : 'kayıtlı yöntem'}
            </Text>
            <AnaButon title={`${SERI_MOD_ETIKET.asi} başlat`} onPress={() => void baslat()} />
            <Pressable onPress={() => router.push('/seri-giris' as never)} style={{ marginTop: 20 }}>
              <Text style={{ color: colors.tint, fontWeight: '700' }}>← Tartım / hızlı tartım ekranına git</Text>
            </Pressable>
          </>
        ) : (
          <SeriOturumPaneli oturum={oturum} onGuncelle={load} />
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
});
