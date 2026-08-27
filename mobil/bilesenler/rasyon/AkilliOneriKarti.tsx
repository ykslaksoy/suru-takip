import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { akilliRasyonOnerisi, type AkilliOneri } from '@/kaynak/rasyon/akilli-oneri';

export function AkilliOneriKarti() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [oneri, setOneri] = useState<AkilliOneri | null>(null);
  const [loading, setLoading] = useState(true);
  const [hedefGun, setHedefGun] = useState('60');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOneri(await akilliRasyonOnerisi({ hedefGun: parseInt(hedefGun, 10) || 60 }));
    } finally {
      setLoading(false);
    }
  }, [hedefGun]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return <ActivityIndicator color={colors.tint} style={{ marginTop: 24 }} />;
  }

  if (!oneri) {
    return (
      <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
        Öneri için en az bir aktif hayvan gerekli.
      </Text>
    );
  }

  return (
    <View>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Sürü ortalaması, dönem ve (varsa) kendi rasyon fiyatınızla günlük / dönem maliyeti.
      </Text>
      <TextInput
        placeholder="Hedef süre (gün)"
        keyboardType="number-pad"
        placeholderTextColor={colors.textSecondary}
        value={hedefGun}
        onChangeText={setHedefGun}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <AnaButon title="Yeniden hesapla" onPress={load} />

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.tint }]}>Öneri</Text>
        <Text style={{ color: colors.text, lineHeight: 22 }}>
          {oneri.hayvanSayisi} hayvan · ort. {oneri.ortalamaKg} kg · {oneri.donemEtiketi}
          {'\n'}
          Hayvan/gün: {oneri.hesap.dailyFeedKg} kg · Sürü/gün: {oneri.hesap.totalDailyKg} kg
          {'\n'}
          Protein hedefi: %{oneri.hesap.proteinPercent}
          {oneri.tahminiGunlukMaliyet != null
            ? `\nGünlük maliyet ≈ ${oneri.tahminiGunlukMaliyet} ₺`
            : ''}
        </Text>
        {oneri.notlar.map((n, i) => (
          <Text key={i} style={{ color: colors.textSecondary, marginTop: 6 }}>
            • {n}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 12, lineHeight: 20 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 15, minHeight: 44 },
  card: { marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
});
