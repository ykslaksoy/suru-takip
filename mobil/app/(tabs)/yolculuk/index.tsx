import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { YolculukAdimi } from '@/bilesenler/besi/YolculukAdimi';
import {
  MOD1_ADIMLAR,
  adimAcikMi,
  adimTamamla,
  getMod1BirlesikIlerleme,
  resetMod1Ilerleme,
  sonrakiAcikAdim,
  type BesiAdimId,
  type Mod1BirlesikIlerleme,
} from '@/kaynak/besi-ortak';
import { useMod } from '@/baglam/ModBaglami';
import { useDatabase } from '@/baglam/VeritabaniBaglami';

const BOS: Mod1BirlesikIlerleme = {
  tamamlanan: [],
  kaynak: {},
  kanitlar: [],
  ozet: { hayvan: 0, asi: 0, t0: 0, rasyon: 0, araTartim: 0, karantinaGun: null },
};

export default function BesiYolculukScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { aktifMod } = useMod();
  const { refreshKey, ready } = useDatabase();
  const navigation = useNavigation();
  const [ilerleme, setIlerleme] = useState<Mod1BirlesikIlerleme>(BOS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setIlerleme(await getMod1BirlesikIlerleme());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load, refreshKey])
  );

  useEffect(() => {
    navigation.setOptions({ title: aktifMod.baslik });
  }, [navigation, aktifMod.baslik]);

  if (aktifMod.id !== 'mod1') {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        <Text style={[styles.h1, { color: colors.text }]}>
          {aktifMod.icon} {aktifMod.baslik}
        </Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>{aktifMod.aciklama}</Text>
        <View style={[styles.nextBox, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.soonTitle, { color: colors.text }]}>Yolculuk yakında</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
            {aktifMod.baslik} adımları bir sonraki sürümde açılacak. Şimdilik Ayarlar’dan başka moda
            geçebilir veya sürü / stok işlemlerini kullanabilirsiniz.
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/ayarlar' as never)}
          style={[styles.cta, { backgroundColor: colors.tint }]}>
          <Text style={styles.ctaText}>Mod değiştir →</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const sonraki = sonrakiAcikAdim(ilerleme.tamamlanan);
  const kanitMap = Object.fromEntries(ilerleme.kanitlar.map((k) => [k.id, k]));

  const durumOf = (id: BesiAdimId) => {
    const adim = MOD1_ADIMLAR.find((a) => a.id === id)!;
    if (ilerleme.tamamlanan.includes(id)) return 'tamam' as const;
    if (adimAcikMi(adim, ilerleme.tamamlanan)) return 'aktif' as const;
    return 'kilitli' as const;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <Text style={[styles.h1, { color: colors.text }]}>
        {aktifMod.icon} {aktifMod.baslik}
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Adımlar sürü / aşı / tartım / stok kayıtlarından otomatik ilerler.
        {loading ? ' Güncelleniyor…' : ''}
      </Text>

      <View style={[styles.ozet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.ozetTitle, { color: colors.text }]}>Veri özeti</Text>
        <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
          {ilerleme.ozet.hayvan} hayvan · aşı {ilerleme.ozet.asi} · T0 {ilerleme.ozet.t0} · rasyon{' '}
          {ilerleme.ozet.rasyon} · ara tartım {ilerleme.ozet.araTartim}
          {ilerleme.ozet.karantinaGun != null ? ` · karantina gün ${ilerleme.ozet.karantinaGun}` : ''}
        </Text>
      </View>

      {sonraki ? (
        <View style={[styles.nextBox, { backgroundColor: colors.tint }]}>
          <Text style={styles.nextLabel}>Şimdi</Text>
          <Text style={styles.nextTitle}>{sonraki.baslik}</Text>
          <Text style={styles.nextDesc}>{kanitMap[sonraki.id]?.kanit ?? sonraki.aciklama}</Text>
        </View>
      ) : (
        <View style={[styles.nextBox, { backgroundColor: colors.success }]}>
          <Text style={styles.nextTitle}>Yolculuk tamam</Text>
          <Text style={styles.nextDesc}>Kayıtlara göre tüm adımlar dolu. Metrikleri Akıllı Kuzu’dan izleyin.</Text>
        </View>
      )}

      {MOD1_ADIMLAR.map((adim) => {
        const durum = durumOf(adim.id);
        const kanit = kanitMap[adim.id];
        return (
          <YolculukAdimi
            key={adim.id}
            adim={adim}
            durum={durum}
            kanit={kanit?.kanit}
            kaynak={ilerleme.kaynak[adim.id]}
            onPress={
              durum === 'kilitli'
                ? undefined
                : () => {
                    if (adim.href) router.push(adim.href as never);
                  }
            }
            onTamamla={
              durum === 'aktif' && !kanit?.tamam
                ? async () => {
                    await adimTamamla(adim.id);
                    await load();
                  }
                : undefined
            }
          />
        );
      })}

      <Pressable
        onPress={() => {
          Alert.alert(
            'Manuel onayları sıfırla',
            'Yalnızca elle onayladığınız adımlar silinir. Veriden tamamlananlar kalır.',
            [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Sıfırla',
                style: 'destructive',
                onPress: async () => {
                  await resetMod1Ilerleme();
                  await load();
                },
              },
            ]
          );
        }}
        style={{ marginTop: 8, marginBottom: 24 }}>
        <Text style={{ color: colors.danger, textAlign: 'center', fontWeight: '700' }}>
          Manuel onayları sıfırla
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  h1: { fontSize: 24, fontWeight: '800' },
  sub: { marginTop: 6, marginBottom: 12, lineHeight: 20 },
  ozet: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  ozetTitle: { fontWeight: '800', marginBottom: 4 },
  nextBox: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  nextLabel: { color: '#ffffffcc', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  nextTitle: { color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 4 },
  nextDesc: { color: '#ffffffee', marginTop: 4, lineHeight: 18 },
  soonTitle: { fontWeight: '800', fontSize: 18 },
  cta: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '800' },
});
