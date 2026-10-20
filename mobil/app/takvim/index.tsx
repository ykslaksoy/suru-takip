/**
 * Takvim — ay görünümü + ajanda. Aşı, tedavi, arınma bitişi, sigorta bitişi, tartım,
 * görevler ve üreme hatırlatmaları kayıtlardan otomatik düşer; dokununca ilgili kayıt açılır.
 */
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import {
  AY_ADLARI,
  ajanda,
  ayIzgarasi,
  ayKaydir,
  getTakvimOlaylari,
  gunOlaylari,
  gunSayilari,
  TUR_ETIKET,
  TUR_SIMGE,
  type TakvimOlay,
  type TakvimTur,
} from '@/kaynak/takvim';
import { yerelGun } from '@/kaynak/arinma';

const HAFTA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function tarihBaslik(t: string): string {
  return new Date(`${t}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
}

export default function TakvimScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey } = useDatabase();
  const bugun = yerelGun();
  const [olaylar, setOlaylar] = useState<TakvimOlay[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gorunum, setGorunum] = useState<'ay' | 'ajanda'>('ay');
  const [ay, setAy] = useState(() => ({ yil: Number(bugun.slice(0, 4)), ay: Number(bugun.slice(5, 7)) - 1 }));
  const [secili, setSecili] = useState(bugun);
  const [filtre, setFiltre] = useState<TakvimTur | null>(null);

  useFocusEffect(
    useCallback(() => {
      void getTakvimOlaylari().then((o) => {
        setOlaylar(o);
        setYukleniyor(false);
      });
    }, [refreshKey]),
  );

  const gorunen = useMemo(() => (filtre ? olaylar.filter((o) => o.tur === filtre) : olaylar), [olaylar, filtre]);
  const sayilar = useMemo(() => gunSayilari(gorunen), [gorunen]);
  const turSimgeleri = useMemo(() => {
    const m: Record<string, TakvimTur[]> = {};
    for (const o of gorunen) m[o.tarih] = [...new Set([...(m[o.tarih] ?? []), o.tur])];
    return m;
  }, [gorunen]);
  const izgara = useMemo(() => ayIzgarasi(ay.yil, ay.ay), [ay]);
  const turler = useMemo(() => [...new Set(olaylar.map((o) => o.tur))], [olaylar]);

  const satir = (o: TakvimOlay) => (
    <Pressable
      key={o.id}
      onPress={() => router.push(o.href as never)}
      style={[styles.olay, { backgroundColor: colors.card, borderColor: o.tarih < bugun ? colors.border : colors.tint + '66' }]}>
      <Text style={{ fontSize: 18 }}>{TUR_SIMGE[o.tur]}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{o.baslik}</Text>
        {o.aciklama ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>{o.aciklama}</Text> : null}
      </View>
      <Text style={{ color: colors.tint, fontWeight: '800' }}>›</Text>
    </Pressable>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Takvim' }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          {(['ay', 'ajanda'] as const).map((g) => (
            <Pressable
              key={g}
              onPress={() => setGorunum(g)}
              style={[styles.sekme, { borderColor: colors.tint, backgroundColor: gorunum === g ? colors.tint : 'transparent' }]}>
              <Text style={{ color: gorunum === g ? '#fff' : colors.tint, fontWeight: '800' }}>{g === 'ay' ? 'Ay' : 'Ajanda'}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 10 }}>
          <Pressable onPress={() => setFiltre(null)} style={[styles.chip, { borderColor: !filtre ? colors.tint : colors.border, backgroundColor: !filtre ? colors.tint + '18' : colors.card }]}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>Tümü</Text>
          </Pressable>
          {turler.map((t) => (
            <Pressable key={t} onPress={() => setFiltre(filtre === t ? null : t)} style={[styles.chip, { borderColor: filtre === t ? colors.tint : colors.border, backgroundColor: filtre === t ? colors.tint + '18' : colors.card }]}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
                {TUR_SIMGE[t]} {TUR_ETIKET[t]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {yukleniyor ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 40 }} />
        ) : gorunum === 'ay' ? (
          <>
            <View style={[styles.takvim, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.ayBaslik}>
                <Pressable onPress={() => setAy(ayKaydir(ay.yil, ay.ay, -1))} hitSlop={10}>
                  <Text style={[styles.ok, { color: colors.tint }]}>‹</Text>
                </Pressable>
                <Pressable onPress={() => { setAy({ yil: Number(bugun.slice(0, 4)), ay: Number(bugun.slice(5, 7)) - 1 }); setSecili(bugun); }}>
                  <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>
                    {AY_ADLARI[ay.ay]} {ay.yil}
                  </Text>
                </Pressable>
                <Pressable onPress={() => setAy(ayKaydir(ay.yil, ay.ay, 1))} hitSlop={10}>
                  <Text style={[styles.ok, { color: colors.tint }]}>›</Text>
                </Pressable>
              </View>
              <View style={styles.hafta}>
                {HAFTA.map((h) => (
                  <Text key={h} style={[styles.hucreMetin, { color: colors.textSecondary, fontSize: 11, fontWeight: '800' }]}>
                    {h}
                  </Text>
                ))}
              </View>
              {izgara.map((hafta, i) => (
                <View key={i} style={styles.hafta}>
                  {hafta.map((g, j) =>
                    g ? (
                      <Pressable
                        key={g}
                        onPress={() => setSecili(g)}
                        style={[
                          styles.hucre,
                          {
                            backgroundColor: g === secili ? colors.tint : g === bugun ? colors.tint + '1a' : 'transparent',
                          },
                        ]}>
                        <Text style={{ color: g === secili ? '#fff' : colors.text, fontWeight: g === bugun ? '900' : '600' }}>{Number(g.slice(8))}</Text>
                        <Text style={{ fontSize: 9, height: 12 }} numberOfLines={1}>
                          {(turSimgeleri[g] ?? []).slice(0, 3).map((t) => TUR_SIMGE[t]).join('')}
                        </Text>
                        {sayilar[g] && sayilar[g] > 3 ? (
                          <Text style={{ fontSize: 9, color: g === secili ? '#fff' : colors.textSecondary }}>{sayilar[g]}</Text>
                        ) : null}
                      </Pressable>
                    ) : (
                      <View key={`b${j}`} style={styles.hucre} />
                    ),
                  )}
                </View>
              ))}
            </View>
            <Text style={[styles.bolum, { color: colors.textSecondary }]}>{tarihBaslik(secili).toLocaleUpperCase('tr-TR')}</Text>
            {gunOlaylari(gorunen, secili).length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>Bu gün kayıt yok.</Text>
            ) : (
              gunOlaylari(gorunen, secili).map(satir)
            )}
          </>
        ) : (
          <>
            {ajanda(gorunen, bugun).length === 0 ? <Text style={{ color: colors.textSecondary }}>Son 14 gün ve önümüzdeki 60 günde kayıt yok.</Text> : null}
            {ajanda(gorunen, bugun).map((g) => (
              <View key={g.tarih}>
                <Text style={[styles.bolum, { color: g.tarih === bugun ? colors.tint : colors.textSecondary }]}>
                  {g.tarih === bugun ? 'BUGÜN · ' : ''}
                  {tarihBaslik(g.tarih).toLocaleUpperCase('tr-TR')}
                </Text>
                {g.olaylar.map(satir)}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  sekme: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  takvim: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 8 },
  ayBaslik: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  ok: { fontSize: 28, fontWeight: '800', paddingHorizontal: 8 },
  hafta: { flexDirection: 'row' },
  hucre: { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 10, minHeight: 46 },
  hucreMetin: { flex: 1, textAlign: 'center', paddingVertical: 4 },
  bolum: { fontSize: 12, fontWeight: '800', marginTop: 14, marginBottom: 6 },
  olay: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 6 },
});
