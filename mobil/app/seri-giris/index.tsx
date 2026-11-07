import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  SERI_MOD_ETIKET,
  getSeriOturum,
  seriOturumBaslat,
  type SeriMod,
  type SeriOturum,
} from '@/kaynak/seri-giris';
import { HizliTartim } from '@/bilesenler/kilo/HizliTartim';
import { YontemOzeti } from '@/bilesenler/giris-yontemi/YontemOzeti';
import { useGirisYontemi } from '@/baglam/GirisYontemiBaglami';
import { etkinTartimGiris } from '@/kaynak/giris-yontemi';
import { SeriOturumPaneli } from '@/bilesenler/seri-giris/SeriOturumPaneli';

type TartimMod = SeriMod | 'hizli';

export default function SeriGirisScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tercih } = useGirisYontemi();
  const tartimYontem = etkinTartimGiris(tercih.tartimGiris);
  const [mod, setMod] = useState<TartimMod>('hizli');
  const [oturum, setOturum] = useState<SeriOturum | null>(null);

  const load = useCallback(async () => {
    const o = await getSeriOturum();
    setOturum(o?.mod === 'tartim' ? o : null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const baslat = async () => {
    if (mod === 'hizli') return;
    setOturum(await seriOturumBaslat('tartim'));
  };

  return (
    <>
      <Stack.Screen options={{ title: mod === 'hizli' && !oturum ? 'Hızlı tartım' : 'Tartım / seri ahır' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.pad}>
        {!oturum ? (
          <>
            <AltButonlar
              items={[
                { key: 'hizli', label: 'Hızlı tartım' },
                { key: 'tartim', label: 'Seri tartım' },
              ]}
              activeKey={mod}
              onSelect={(k) => setMod(k as TartimMod)}
            />
            {mod === 'hizli' ? (
              <>
                <Text style={{ color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
                  Oturum başında kuzu ve kilo yöntemini bir kez seçin; her kayıttan sonra yalnızca kuzu ve kilo sıfırlanır.
                  Aşı kaydı için ayrı ekran kullanın.
                </Text>
                <HizliTartim />
                <Pressable onPress={() => router.push('/seri-asi' as never)} style={{ marginTop: 16, paddingVertical: 8 }}>
                  <Text style={{ color: colors.tint, fontWeight: '700' }}>Seri aşılama → ayrı ekran</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={{ color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
                  Ahırda arka arkaya tartım satırı. Satır ekleyin, «Hepsini uygula» ile veritabanına yazın.
                </Text>
                <YontemOzeti ayarlarLink />
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12, lineHeight: 18 }}>
                  Tartım: {tartimYontem === 'sesle-kilo' ? 'ses veya yazı' : 'kayıtlı yöntem'}
                </Text>
                <AnaButon title={`${SERI_MOD_ETIKET.tartim} başlat`} onPress={() => void baslat()} />
              </>
            )}
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
