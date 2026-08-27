import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { ModSecimKarti } from '@/bilesenler/ortak/ModSecimKarti';
import {
  URUN_MODLARI,
  getAktifModId,
  getMod,
  setAktifModId,
  type UrunModId,
} from '@/sabitler/Modlar';
import { useSubscription } from '@/baglam/AbonelikBaglami';

export default function AyarlarScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tierLabel, limit } = useSubscription();
  const [aktif, setAktif] = useState<UrunModId>('mod1');

  const load = useCallback(async () => {
    setAktif(await getAktifModId());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sec = async (id: UrunModId) => {
    const mod = getMod(id);
    if (!mod.hazir) {
      Alert.alert('Yakında', `${mod.baslik} bir sonraki sürümlerde açılacak.`);
      return;
    }
    await setAktifModId(id);
    setAktif(id);
    if (mod.href) {
      Alert.alert('Mod seçildi', `${mod.baslik} aktif.`, [
        { text: 'Kalsın', style: 'cancel' },
        { text: 'Yolculuğa git', onPress: () => router.push(mod.href as never) },
      ]);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <Text style={[styles.h1, { color: colors.text }]}>Ayarlar</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
        Paket: {tierLabel} · {limit} hayvan
      </Text>

      <Text style={[styles.section, { color: colors.text }]}>Ürün modu</Text>
      <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
        Ne yapmak istiyorsun? Aktif mod yolculuğu belirler.
      </Text>

      {URUN_MODLARI.map((m) => (
        <ModSecimKarti key={m.id} mod={m} secili={aktif === m.id} onPress={() => sec(m.id)} />
      ))}

      {aktif === 'mod1' ? (
        <Pressable
          onPress={() => router.push('/besi' as never)}
          style={[styles.cta, { backgroundColor: colors.tint }]}>
          <Text style={styles.ctaText}>Mod 1 yolculuğuna git →</Text>
        </Pressable>
      ) : null}

      <Text style={[styles.section, { color: colors.text, marginTop: 20 }]}>Diğer</Text>
      <Link href="/abonelik" asChild>
        <Pressable style={[styles.linkRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Abonelik</Text>
          <Text style={{ color: colors.tint }}>→</Text>
        </Pressable>
      </Link>
      <Link href="/ana-sayfa/duzenle" asChild>
        <Pressable style={[styles.linkRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Ana ekranı planla</Text>
          <Text style={{ color: colors.tint }}>→</Text>
        </Pressable>
      </Link>
      <Link href="/beta" asChild>
        <Pressable style={[styles.linkRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Pilot program</Text>
          <Text style={{ color: colors.tint }}>→</Text>
        </Pressable>
      </Link>
      <Link href="/turkvet-aktar" asChild>
        <Pressable style={[styles.linkRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>TÜRKVET aktarım</Text>
          <Text style={{ color: colors.tint }}>→</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  h1: { fontSize: 26, fontWeight: '800' },
  section: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sectionSub: { marginBottom: 12, lineHeight: 20 },
  cta: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '800' },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
});
