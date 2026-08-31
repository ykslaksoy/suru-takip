import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { calistirUrunDogrulama, type TestSonuc } from '@/kaynak/test/urun-dogrulama';

export default function SistemKontrolScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const navigation = useNavigation();
  const [sonuclar, setSonuclar] = useState<TestSonuc[]>([]);
  const [ozet, setOzet] = useState('');
  const [busy, setBusy] = useState(false);

  const calistir = useCallback(async () => {
    setBusy(true);
    try {
      const rapor = await calistirUrunDogrulama();
      setSonuclar(rapor.sonuclar);
      setOzet(`${rapor.gecti}/${rapor.toplam} geçti · ${rapor.kaldi} kaldı`);
      navigation.setOptions({ title: rapor.kaldi === 0 ? 'Sistem OK' : 'Sorun var' });
    } finally {
      setBusy(false);
    }
  }, [navigation]);

  const paylas = async () => {
    const metin = sonuclar
      .map((s) => `${s.durum === 'gecti' ? '✓' : '✗'} [${s.grup}] ${s.ad}${s.detay ? ` — ${s.detay}` : ''}`)
      .join('\n');
    await Share.share({ message: `SürüYön sistem kontrolü\n${ozet}\n\n${metin}` });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <Text style={[styles.h1, { color: colors.text }]}>Sistem kontrolü</Text>
      <Text style={{ color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
        Plan, padok, görev sırası, doz etiketleri, ortam ve yasal metinler tek tek denetlenir.
      </Text>
      <AnaButon title={busy ? 'Çalışıyor…' : 'Tüm testleri çalıştır'} onPress={calistir} disabled={busy} />
      {ozet ? (
        <Text style={[styles.ozet, { color: colors.tint }]}>{ozet}</Text>
      ) : null}
      {sonuclar.map((s) => (
        <View
          key={s.id}
          style={[styles.satir, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: s.durum === 'gecti' ? colors.success ?? colors.tint : colors.warning }}>
            {s.durum === 'gecti' ? '✓' : '✗'}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{s.grup}</Text>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{s.ad}</Text>
            {s.detay && s.durum === 'kaldi' ? (
              <Text style={{ color: colors.warning, fontSize: 12, marginTop: 4 }}>{s.detay}</Text>
            ) : null}
          </View>
        </View>
      ))}
      {sonuclar.length > 0 ? (
        <Pressable onPress={paylas} style={[styles.link, { borderColor: colors.border }]}>
          <Text style={{ color: colors.tint, fontWeight: '700' }}>Raporu paylaş</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  h1: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  ozet: { fontWeight: '800', marginVertical: 12, fontSize: 15 },
  satir: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  link: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
});
