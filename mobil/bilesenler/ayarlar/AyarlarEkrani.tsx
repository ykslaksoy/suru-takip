import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { ModSecimKarti } from '@/bilesenler/ortak/ModSecimKarti';
import { SenkronDurumu } from '@/bilesenler/ortak/SenkronDurumu';
import { VetIletisimFormu } from '@/bilesenler/veteriner/VetIletisimFormu';
import { useMod } from '@/baglam/ModBaglami';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import { useAyarlar } from '@/baglam/AyarlarBaglami';
import type { UrunModId } from '@/sabitler/Modlar';
import { hayvanListesiCsv, suruOzetCsv } from '@/kaynak/excel/disa-aktar';
import { suruyonYedekJson } from '@/kaynak/cekirdek/yedek';
import { appOrtamEtiketi } from '@/sabitler/Ortam';
import { OZELLIK_BAYRAKLARI, ozellikDurumEtiketi } from '@/sabitler/OzellikBayraklari';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';

type LinkSatir = { baslik: string; href?: string; onPress?: () => void; ok?: string };

export function AyarlarEkrani() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tierLabel, limit } = useSubscription();
  const { aktifId, aktifMod, modlar, secMod } = useMod();
  const { kapat } = useAyarlar();
  const { scrollPadBottom } = useAltGuvenliBosluk(0);

  const git = (href: string) => {
    kapat();
    // Modal kapansın, sonra sayfa açılsın
    requestAnimationFrame(() => {
      router.push(href as never);
    });
  };

  const sec = async (id: UrunModId) => {
    const mod = await secMod(id);
    if (mod.href) {
      git(mod.href);
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

  const anaAyarlar: LinkSatir[] = [
    { baslik: 'Kuzu seçim & tartım girişi', href: '/giris-yontemi' },
    { baslik: 'İşletme profili', href: '/isletme-profil' },
    { baslik: 'Profesyonellik aşamaları', href: '/profesyonellik' },
    { baslik: 'Abonelik / paket', href: '/abonelik' },
    { baslik: 'Ana ekranı planla', href: '/ana-sayfa/duzenle' },
    { baslik: 'Sesli komut', href: '/ses' },
    { baslik: 'Seri ahır modu', href: '/seri-giris' },
    { baslik: 'Sistem kontrolü (testler)', href: '/sistem-kontrol' },
    { baslik: 'Pilot program', href: '/beta' },
    { baslik: 'TÜRKVET aktarım', href: '/turkvet-aktar' },
  ];

  const yedekVeYasal: LinkSatir[] = [
    {
      baslik: 'JSON yedek (tam veri)',
      ok: '↗',
      onPress: async () => {
        const json = await suruyonYedekJson();
        await Share.share({ message: json, title: 'suruyon-yedek.json' });
      },
    },
    {
      baslik: 'Sürü özet raporu (CSV)',
      ok: '↗',
      onPress: async () => {
        const csv = await suruOzetCsv();
        await Share.share({ message: csv, title: 'suruyon-ozet.csv' });
      },
    },
    {
      baslik: 'Hayvan listesi CSV',
      ok: '↗',
      onPress: async () => {
        const csv = await hayvanListesiCsv();
        await Share.share({ message: csv, title: 'suruyon-hayvanlar.csv' });
      },
    },
    { baslik: 'KVKK / gizlilik', href: '/yasal/gizlilik' },
    { baslik: 'Kullanım koşulları', href: '/yasal/kullanim' },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={StyleSheet.flatten([
        styles.scrollContent,
        { paddingBottom: Math.max(scrollPadBottom, 48) + 40 },
      ])}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator>
      <View
        style={StyleSheet.flatten([
          styles.ozetKutu,
          { backgroundColor: colors.card, borderColor: colors.border },
        ])}>
        <Text style={StyleSheet.flatten([styles.ozetBaslik, { color: colors.text }])}>
          Paket: {tierLabel}
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: 2 }}>
          {limit} hayvan · Ortam: {appOrtamEtiketi()}
        </Text>
        <Text style={StyleSheet.flatten([styles.aktifSatir, { color: colors.tint }])}>
          Şu an: {aktifMod.icon} {aktifMod.baslik}
        </Text>
      </View>

      <Text style={StyleSheet.flatten([styles.section, { color: colors.text }])}>Ayarlar</Text>
      <Text style={StyleSheet.flatten([styles.sectionSub, { color: colors.textSecondary }])}>
        İşletme, abonelik ve uygulama tercihleri
      </Text>

      {anaAyarlar.map((l) => (
        <Pressable
          key={l.baslik}
          accessibilityRole="button"
          onPress={() => (l.href ? git(l.href) : void l.onPress?.())}
          style={satirStil}>
          <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>{l.baslik}</Text>
          <Text style={{ color: colors.tint }}>{l.ok ?? '→'}</Text>
        </Pressable>
      ))}

      <SenkronDurumu />
      <VetIletisimFormu />

      <Text style={StyleSheet.flatten([styles.section, { color: colors.text, marginTop: 18 }])}>
        Yedek ve yasal
      </Text>
      {yedekVeYasal.map((l) => (
        <Pressable
          key={l.baslik}
          accessibilityRole="button"
          onPress={() => (l.href ? git(l.href) : void l.onPress?.())}
          style={satirStil}>
          <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>{l.baslik}</Text>
          <Text style={{ color: colors.tint }}>{l.ok ?? '→'}</Text>
        </Pressable>
      ))}

      <Text style={StyleSheet.flatten([styles.section, { color: colors.text, marginTop: 18 }])}>
        Ürün modu
      </Text>
      <Text style={StyleSheet.flatten([styles.sectionSub, { color: colors.textSecondary }])}>
        Seçtiğiniz moda gidilir. Aktif mod adı ana sayfada görünür.
      </Text>

      {modlar.map((m) => (
        <ModSecimKarti key={m.id} mod={m} secili={aktifId === m.id} onPress={() => sec(m.id)} />
      ))}

      <Pressable
        onPress={() => git('/(tabs)/yolculuk')}
        style={StyleSheet.flatten([styles.cta, { backgroundColor: colors.tint }])}>
        <Text style={styles.ctaText}>{aktifMod.baslik} →</Text>
      </Pressable>

      <Text style={StyleSheet.flatten([styles.section, { color: colors.text, marginTop: 18 }])}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  scrollContent: { padding: 16, flexGrow: 1 },
  ozetKutu: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  ozetBaslik: { fontSize: 16, fontWeight: '800' },
  aktifSatir: { fontWeight: '800', marginTop: 8, fontSize: 15 },
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
    gap: 8,
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
