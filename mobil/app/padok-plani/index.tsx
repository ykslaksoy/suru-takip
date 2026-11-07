import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { BesiSekliSecici } from '@/bilesenler/suru/BesiSekliSecici';
import { haritaHedefRotasi, meraHaritasiUygun, besiSekliOku, type BesiSekli } from '@/kaynak/suru/besi-sekli-yon';
import { padokPlaniOzet, padokPlaniYukle, type PadokPlanSatir } from '@/kaynak/suru/padok-plani';

export default function PadokPlaniEkrani() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { padok } = useLocalSearchParams<{ padok?: string }>();
  const [satirlar, setSatirlar] = useState<PadokPlanSatir[]>([]);
  const [secili, setSecili] = useState<string | null>(padok?.trim() || null);

  const disModaYonlendir = useCallback(
    (sekil: BesiSekli) => {
      if (meraHaritasiUygun(sekil)) {
        const p = secili || padok?.trim();
        const h = haritaHedefRotasi(sekil, p);
        router.replace(
          h.params ? ({ pathname: h.pathname, params: h.params } as never) : (h.pathname as never),
        );
      }
    },
    [padok, secili],
  );

  const yenile = useCallback(async () => {
    const list = await padokPlaniYukle();
    setSatirlar(list);
    const sekil = await besiSekliOku();
    disModaYonlendir(sekil);
  }, [disModaYonlendir]);

  useFocusEffect(
    useCallback(() => {
      const p = padok?.trim();
      if (p) setSecili(p);
      void yenile();
    }, [padok, yenile]),
  );

  const ozet = padokPlaniOzet(satirlar);
  const konumlu = satirlar.filter((s) => s.konumKayitli).length;

  return (
    <>
      <Stack.Screen options={{ title: 'Padok planı' }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.panel, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.aciklama, { color: colors.textSecondary }]}>
            Kapalı / ahır besi — padok kapasitesi ve hayvan dağılımı. Mera otlatma ve GPS haritası bu modda
            kullanılmaz.
          </Text>
          <BesiSekliSecici onSekilDegisti={disModaYonlendir} />
          <Text style={{ color: colors.text, fontWeight: '800', marginTop: 4 }}>
            {ozet.padok} padok · {ozet.hayvan}/{ozet.kapasite} baş
          </Text>
        </View>

        {konumlu === 0 ? (
          <View style={[styles.bos, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Ionicons name="location-outline" size={28} color={colors.textSecondary} />
            <Text style={[styles.bosBaslik, { color: colors.text }]}>Konum kaydı yok</Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
              Ahır düzeni için kayıtlı GPS/konum yok. Aşağıdaki listeden padok seçip doluluk ve kapasiteyi
              kullanın; isteğe bağlı konum işaretlemesi yalnızca açık alan mera haritasında yapılır.
            </Text>
          </View>
        ) : (
          <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 13 }}>
            {konumlu} padok için kayıtlı konum var (liste öncelikli görünüm).
          </Text>
        )}

        {satirlar.map((p) => {
          const aktif = secili === p.ad;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityState={{ selected: aktif }}
              onPress={() => {
                setSecili(p.ad);
                router.push({ pathname: '/(tabs)/suru', params: { padok: p.ad } } as never);
              }}
              style={[
                styles.satir,
                {
                  borderColor: aktif ? colors.tint : colors.border,
                  backgroundColor: aktif ? `${colors.tint}12` : colors.card,
                },
              ]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{p.ad}</Text>
                {p.not ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
                    {p.not}
                  </Text>
                ) : null}
                <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 13 }}>
                  {p.hayvan}/{p.kapasite} baş · {p.bos} boş{p.karantina ? ' · karantina' : ''}
                  {p.konumKayitli ? ' · konum kayıtlı' : ''}
                </Text>
              </View>
              {p.dolu ? (
                <Text style={{ color: '#c1121f', fontWeight: '800', fontSize: 12 }}>Dolu</Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingBottom: 32 },
  panel: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  aciklama: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  bos: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bosBaslik: { fontWeight: '800', fontSize: 15 },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
});
