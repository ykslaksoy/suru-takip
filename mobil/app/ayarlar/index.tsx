import { useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router, useNavigation } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { ModSecimKarti } from '@/bilesenler/ortak/ModSecimKarti';
import { SenkronDurumu } from '@/bilesenler/ortak/SenkronDurumu';
import { VetIletisimFormu } from '@/bilesenler/veteriner/VetIletisimFormu';
import { useMod } from '@/baglam/ModBaglami';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import type { UrunModId } from '@/sabitler/Modlar';
import { hayvanListesiCsv } from '@/kaynak/excel/disa-aktar';
import { suruyonYedekJson } from '@/kaynak/cekirdek/yedek';
import { appOrtamEtiketi } from '@/sabitler/Ortam';
import { OZELLIK_BAYRAKLARI, ozellikDurumEtiketi } from '@/sabitler/OzellikBayraklari';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';

type LinkSatir = { baslik: string; href?: string; onPress?: () => void; ok?: string };

export default function AyarlarScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tierLabel, limit } = useSubscription();
  const { aktifId, aktifMod, modlar, secMod } = useMod();
  const navigation = useNavigation();
  const { scrollPadBottom } = useAltGuvenliBosluk(0);

  useEffect(() => {
    navigation.setOptions({ title: 'Ayarlar', headerShown: true });
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

  const satirStil = useMemo(
    () =>
      StyleSheet.flatten([
        styles.linkRow,
        { borderColor: colors.border, backgroundColor: colors.card },
      ]),
    [colors.border, colors.card]
  );

  const linkler: LinkSatir[] = [
    { baslik: 'İşletme profili', href: '/isletme-profil' },
    { baslik: 'Sistem kontrolü (testler)', href: '/sistem-kontrol' },
    { baslik: 'Sesli komut', href: '/ses' },
    { baslik: 'Seri ahır modu', href: '/seri-giris' },
    { baslik: 'Abonelik', href: '/abonelik' },
    { baslik: 'Ana ekranı planla', href: '/ana-sayfa/duzenle' },
    { baslik: 'Pilot program', href: '/beta' },
    { baslik: 'TÜRKVET aktarım', href: '/turkvet-aktar' },
    {
      baslik: 'JSON yedek (tam veri)',
      ok: '↗',
      onPress: async () => {
        const json = await suruyonYedekJson();
        await Share.share({ message: json, title: 'suruyon-yedek.json' });
      },
    },
    { baslik: 'KVKK / gizlilik', href: '/yasal/gizlilik' },
    { baslik: 'Kullanım koşulları', href: '/yasal/kullanim' },
    {
      baslik: 'Excel / CSV dışa aktar',
      ok: '↗',
      onPress: async () => {
        const csv = await hayvanListesiCsv();
        await Share.share({ message: csv, title: 'suruyon-hayvanlar.csv' });
      },
    },
  ];

  return (
    <ScrollView
      style={StyleSheet.flatten([{ flex: 1, backgroundColor: colors.background }])}
      contentContainerStyle={StyleSheet.flatten([styles.scroll, { paddingBottom: scrollPadBottom + 24 }])}>
      <Text style={StyleSheet.flatten([styles.h1, { color: colors.text }])}>Ayarlar</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
        Paket: {tierLabel} · {limit} hayvan · Ortam: {appOrtamEtiketi()}
      </Text>
      <Text style={StyleSheet.flatten([styles.aktifSatir, { color: colors.tint }])}>
        Şu an: {aktifMod.icon} {aktifMod.baslik}
      </Text>

      <Text style={StyleSheet.flatten([styles.section, { color: colors.text }])}>Ürün modu</Text>
      <Text style={StyleSheet.flatten([styles.sectionSub, { color: colors.textSecondary }])}>
        Seçtiğiniz moda gidilir. Aktif mod adı ana sayfada görünür.
      </Text>

      {modlar.map((m) => (
        <ModSecimKarti key={m.id} mod={m} secili={aktifId === m.id} onPress={() => sec(m.id)} />
      ))}

      <Pressable
        onPress={() => router.push('/(tabs)/yolculuk' as never)}
        style={StyleSheet.flatten([styles.cta, { backgroundColor: colors.tint }])}>
        <Text style={styles.ctaText}>{aktifMod.baslik} →</Text>
      </Pressable>

      <Text style={StyleSheet.flatten([styles.section, { color: colors.text, marginTop: 20 }])}>
        Diğer
      </Text>

      {linkler.slice(0, 2).map((l) => (
        <Pressable
          key={l.baslik}
          onPress={() => (l.href ? router.push(l.href as never) : l.onPress?.())}
          style={satirStil}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>{l.baslik}</Text>
          <Text style={{ color: colors.tint }}>{l.ok ?? '→'}</Text>
        </Pressable>
      ))}

      <SenkronDurumu />
      <VetIletisimFormu />

      {linkler.slice(2, 9).map((l) => (
        <Pressable
          key={l.baslik}
          onPress={() => (l.href ? router.push(l.href as never) : void l.onPress?.())}
          style={satirStil}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>{l.baslik}</Text>
          <Text style={{ color: colors.tint }}>{l.ok ?? '→'}</Text>
        </Pressable>
      ))}

      <Text style={StyleSheet.flatten([styles.section, { color: colors.text, marginTop: 16 }])}>
        Özellik durumu
      </Text>
      {OZELLIK_BAYRAKLARI.map((o) => (
        <View
          key={o.id}
          style={StyleSheet.flatten([
            styles.ozellikSatir,
            { borderColor: colors.border, backgroundColor: colors.card },
          ])}>
          <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>{o.ad}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            {ozellikDurumEtiketi(o.durum)}
          </Text>
        </View>
      ))}

      {linkler.slice(9).map((l) => (
        <Pressable
          key={l.baslik}
          onPress={() => (l.href ? router.push(l.href as never) : void l.onPress?.())}
          style={satirStil}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>{l.baslik}</Text>
          <Text style={{ color: colors.tint }}>{l.ok ?? '→'}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
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
  ozellikSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    gap: 8,
  },
});
