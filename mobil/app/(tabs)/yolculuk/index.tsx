import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { YolculukAdimi } from '@/bilesenler/besi/YolculukAdimi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
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
import {
  MOD2_ADIMLAR,
  adimAcikMiMod2,
  adimTamamlaMod2,
  addKatimKaydi,
  getMod2BirlesikIlerleme,
  resetMod2Ilerleme,
  sonrakiAcikAdimMod2,
  type Mod2AdimId,
  type Mod2BirlesikIlerleme,
} from '@/kaynak/besi-koc-kat';
import { useMod } from '@/baglam/ModBaglami';
import { useDatabase } from '@/baglam/VeritabaniBaglami';

const BOS1: Mod1BirlesikIlerleme = {
  tamamlanan: [],
  kaynak: {},
  kanitlar: [],
  ozet: { hayvan: 0, asi: 0, t0: 0, rasyon: 0, araTartim: 0, karantinaGun: null },
};

const BOS2: Mod2BirlesikIlerleme = {
  tamamlanan: [],
  kaynak: {},
  kanitlar: [],
  ozet: { disi: 0, koc: 0, gebe: 0, kuzu: 0, katim: 0, asi: 0, t0: 0 },
};

export default function YolculukScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { aktifMod } = useMod();
  const { refreshKey, ready } = useDatabase();
  const navigation = useNavigation();
  const [m1, setM1] = useState<Mod1BirlesikIlerleme>(BOS1);
  const [m2, setM2] = useState<Mod2BirlesikIlerleme>(BOS2);
  const [loading, setLoading] = useState(true);
  const [katimForm, setKatimForm] = useState({
    kocEarTag: '',
    padok: '',
    disiSayisi: '10',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (aktifMod.id === 'mod1') setM1(await getMod1BirlesikIlerleme());
      else if (aktifMod.id === 'mod2') setM2(await getMod2BirlesikIlerleme());
    } finally {
      setLoading(false);
    }
  }, [aktifMod.id]);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load, refreshKey])
  );

  useEffect(() => {
    navigation.setOptions({ title: aktifMod.baslik });
  }, [navigation, aktifMod.baslik]);

  if (aktifMod.id !== 'mod1' && aktifMod.id !== 'mod2') {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        <Text style={[styles.h1, { color: colors.text }]}>
          {aktifMod.icon} {aktifMod.baslik}
        </Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>{aktifMod.aciklama}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.soonTitle, { color: colors.text }]}>Yolculuk yakında</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
            Bu modun adımları sıradaki sürümde açılacak.
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

  if (aktifMod.id === 'mod2') {
    const sonraki = sonrakiAcikAdimMod2(m2.tamamlanan);
    const kanitMap = Object.fromEntries(m2.kanitlar.map((k) => [k.id, k]));
    const durumOf = (id: Mod2AdimId) => {
      const adim = MOD2_ADIMLAR.find((a) => a.id === id)!;
      if (m2.tamamlanan.includes(id)) return 'tamam' as const;
      if (adimAcikMiMod2(adim, m2.tamamlanan)) return 'aktif' as const;
      return 'kilitli' as const;
    };

    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        <Text style={[styles.h1, { color: colors.text }]}>
          {aktifMod.icon} {aktifMod.baslik}
        </Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Koç kat → kuzulat → besi. Kayıtlardan otomatik ilerler.
          {loading ? ' Güncelleniyor…' : ''}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.ozetTitle, { color: colors.text }]}>Veri özeti</Text>
          <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
            {m2.ozet.disi} dişi · {m2.ozet.koc} koç · {m2.ozet.gebe} gebe · {m2.ozet.kuzu} kuzu ·{' '}
            {m2.ozet.katim} katım · aşı {m2.ozet.asi} · T0 {m2.ozet.t0}
          </Text>
        </View>

        {sonraki?.id === 'katim' ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.tint }]}>
            <Text style={[styles.ozetTitle, { color: colors.text }]}>Katım kaydı ekle</Text>
            {(
              [
                ['kocEarTag', 'Koç küpe / adı'],
                ['padok', 'Padok / grup'],
                ['disiSayisi', 'Dişi sayısı'],
                ['notes', 'Not (opsiyonel)'],
              ] as const
            ).map(([key, ph]) => (
              <TextInput
                key={key}
                placeholder={ph}
                placeholderTextColor={colors.textSecondary}
                value={katimForm[key]}
                onChangeText={(v) => setKatimForm({ ...katimForm, [key]: v })}
                keyboardType={key === 'disiSayisi' ? 'number-pad' : 'default'}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
            ))}
            <AnaButon
              title="Katımı kaydet"
              onPress={async () => {
                if (!katimForm.kocEarTag.trim()) {
                  Alert.alert('Eksik', 'Koç küpe veya adı gerekli');
                  return;
                }
                await addKatimKaydi({
                  kocEarTag: katimForm.kocEarTag.trim(),
                  padok: katimForm.padok.trim() || 'Padok A',
                  tarih: new Date().toISOString().slice(0, 10),
                  disiSayisi: parseInt(katimForm.disiSayisi, 10) || 1,
                  notes: katimForm.notes.trim(),
                });
                await load();
                Alert.alert('Tamam', 'Katım kaydı eklendi');
              }}
            />
          </View>
        ) : null}

        {sonraki ? (
          <View style={[styles.nextBox, { backgroundColor: colors.tint }]}>
            <Text style={styles.nextLabel}>Şimdi</Text>
            <Text style={styles.nextTitle}>{sonraki.baslik}</Text>
            <Text style={styles.nextDesc}>{kanitMap[sonraki.id]?.kanit ?? sonraki.aciklama}</Text>
          </View>
        ) : (
          <View style={[styles.nextBox, { backgroundColor: colors.success }]}>
            <Text style={styles.nextTitle}>Yolculuk tamam</Text>
            <Text style={styles.nextDesc}>Mod 2 adımları dolu — metrikleri Akıllı Kuzu’dan izleyin.</Text>
          </View>
        )}

        {MOD2_ADIMLAR.map((adim) => {
          const durum = durumOf(adim.id);
          const kanit = kanitMap[adim.id];
          return (
            <YolculukAdimi
              key={adim.id}
              adim={adim}
              durum={durum}
              kanit={kanit?.kanit}
              kaynak={m2.kaynak[adim.id]}
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
                      await adimTamamlaMod2(adim.id);
                      await load();
                    }
                  : undefined
              }
            />
          );
        })}

        <Pressable
          onPress={() => {
            Alert.alert('Manuel onayları sıfırla', 'Elle onaylar silinir; veri adımları kalır.', [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Sıfırla',
                style: 'destructive',
                onPress: async () => {
                  await resetMod2Ilerleme();
                  await load();
                },
              },
            ]);
          }}
          style={{ marginTop: 8, marginBottom: 24 }}>
          <Text style={{ color: colors.danger, textAlign: 'center', fontWeight: '700' }}>
            Manuel onayları sıfırla
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Mod 1
  const sonraki = sonrakiAcikAdim(m1.tamamlanan);
  const kanitMap = Object.fromEntries(m1.kanitlar.map((k) => [k.id, k]));
  const durumOf = (id: BesiAdimId) => {
    const adim = MOD1_ADIMLAR.find((a) => a.id === id)!;
    if (m1.tamamlanan.includes(id)) return 'tamam' as const;
    if (adimAcikMi(adim, m1.tamamlanan)) return 'aktif' as const;
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

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.ozetTitle, { color: colors.text }]}>Veri özeti</Text>
        <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
          {m1.ozet.hayvan} hayvan · aşı {m1.ozet.asi} · T0 {m1.ozet.t0} · rasyon {m1.ozet.rasyon} · ara
          tartım {m1.ozet.araTartim}
          {m1.ozet.karantinaGun != null ? ` · karantina gün ${m1.ozet.karantinaGun}` : ''}
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
          <Text style={styles.nextDesc}>Kayıtlara göre tüm adımlar dolu.</Text>
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
            kaynak={m1.kaynak[adim.id]}
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
          Alert.alert('Manuel onayları sıfırla', 'Elle onaylar silinir; veri adımları kalır.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Sıfırla',
              style: 'destructive',
              onPress: async () => {
                await resetMod1Ilerleme();
                await load();
              },
            },
          ]);
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
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  ozetTitle: { fontWeight: '800', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    fontSize: 15,
    minHeight: 44,
  },
  nextBox: { borderRadius: 14, padding: 14, marginBottom: 16 },
  nextLabel: { color: '#ffffffcc', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  nextTitle: { color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 4 },
  nextDesc: { color: '#ffffffee', marginTop: 4, lineHeight: 18 },
  soonTitle: { fontWeight: '800', fontSize: 18 },
  cta: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800' },
});
