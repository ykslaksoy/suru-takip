import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router, useNavigation } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { ModSecimKarti } from '@/bilesenler/ortak/ModSecimKarti';
import { useMod } from '@/baglam/ModBaglami';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import type { UrunModId } from '@/sabitler/Modlar';

export default function AyarlarScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tierLabel, limit } = useSubscription();
  const { aktifId, aktifMod, modlar, secMod } = useMod();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: 'Ayarlar' });
  }, [navigation]);

  const sec = async (id: UrunModId) => {
    const mod = await secMod(id);
    if (mod.href) {
      router.push(mod.href as never);
      return;
    }
    if (!mod.hazir) {
      Alert.alert('Yakında', `${mod.baslik} yolculuğu yakında açılacak.`);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <Text style={[styles.h1, { color: colors.text }]}>Ayarlar</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
        Paket: {tierLabel} · {limit} hayvan
      </Text>
      <Text style={[styles.aktifSatir, { color: colors.tint }]}>
        Şu an: {aktifMod.icon} {aktifMod.baslik}
      </Text>

      <Text style={[styles.section, { color: colors.text }]}>Ürün modu</Text>
      <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
        Seçtiğiniz moda gidilir. Aktif mod adı ana sayfada görünür.
      </Text>

      {modlar.map((m) => (
        <ModSecimKarti key={m.id} mod={m} secili={aktifId === m.id} onPress={() => sec(m.id)} />
      ))}

      <Pressable
        onPress={() => router.push((aktifMod.href ?? '/besi') as never)}
        style={[styles.cta, { backgroundColor: colors.tint }]}>
        <Text style={styles.ctaText}>{aktifMod.baslik} →</Text>
      </Pressable>

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
  aktifSatir: { fontWeight: '800', marginBottom: 16, fontSize: 15 },
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
