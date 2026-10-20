import { ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from 'expo-router';
import { useEffect } from 'react';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  KULLANIM_KOSULLARI,
  KULLANIM_KOSULLARI_BASLIK,
  KULLANIM_SARTLARI_ETKIN_TARIH,
} from '@/sabitler/YasalMetinler';

export default function KullanimScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: KULLANIM_KOSULLARI_BASLIK });
  }, [navigation]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <Text style={[styles.etkin, { color: colors.textSecondary }]}>Yürürlük: {KULLANIM_SARTLARI_ETKIN_TARIH}</Text>
      <Text style={[styles.body, { color: colors.text }]}>{KULLANIM_KOSULLARI}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  etkin: { fontSize: 13, fontWeight: '700', marginBottom: 12 },
  body: { lineHeight: 24, fontSize: 15 },
});
