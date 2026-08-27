import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import {
  addPlanlananGorev,
  getGorevler,
  setPlanlananTamam,
  type Gorev,
  type GorevSeviye,
} from '@/kaynak/gorevler';

type Filtre = 'tumu' | 'uyari' | 'sira' | 'plan';

function seviyeEtiket(s: GorevSeviye): string {
  if (s === 'uyari') return 'Uyarı';
  if (s === 'sira') return 'Sıra';
  if (s === 'plan') return 'Plan';
  return 'Bilgi';
}

function seviyeRenk(s: GorevSeviye, colors: (typeof Colors)['light']): string {
  if (s === 'uyari') return colors.danger;
  if (s === 'sira') return colors.warning;
  if (s === 'plan') return colors.tint;
  return colors.textSecondary;
}

export default function GorevlerScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { ready, refreshKey } = useDatabase();
  const [liste, setListe] = useState<Gorev[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<Filtre>('tumu');
  const [formAcik, setFormAcik] = useState(false);
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setListe(await getGorevler());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load, refreshKey])
  );

  const goster =
    filtre === 'tumu'
      ? liste
      : filtre === 'plan'
        ? liste.filter((g) => g.seviye === 'plan' || g.kaynak === 'planlanan')
        : liste.filter((g) => g.seviye === filtre);

  return (
    <>
      <Stack.Screen options={{ title: 'Görevler' }} />
      <View style={[styles.shell, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            Bekletme, aşı, stok, tartım, yolculuk adımı ve sizin planladıklarınız burada toplanır.
          </Text>

          <View style={styles.filters}>
            {(
              [
                ['tumu', 'Tümü'],
                ['uyari', 'Uyarı'],
                ['sira', 'Sıra'],
                ['plan', 'Planlı'],
              ] as const
            ).map(([k, label]) => {
              const aktif = filtre === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setFiltre(k)}
                  style={[
                    styles.chip,
                    {
                      borderColor: aktif ? colors.tint : colors.border,
                      backgroundColor: aktif ? colors.tint : colors.card,
                    },
                  ]}>
                  <Text style={{ color: aktif ? '#fff' : colors.text, fontWeight: '700', fontSize: 13 }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={() => setFormAcik(!formAcik)} style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.tint, fontWeight: '800' }}>
              {formAcik ? 'Plan formunu gizle' : '+ Planlanan görev ekle'}
            </Text>
          </Pressable>

          {formAcik ? (
            <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                placeholder="Başlık"
                placeholderTextColor={colors.textSecondary}
                value={baslik}
                onChangeText={setBaslik}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
              <TextInput
                placeholder="Açıklama (opsiyonel)"
                placeholderTextColor={colors.textSecondary}
                value={aciklama}
                onChangeText={setAciklama}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
              <TextInput
                placeholder="Tarih YYYY-AA-GG"
                placeholderTextColor={colors.textSecondary}
                value={tarih}
                onChangeText={setTarih}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
              <AnaButon
                title="Kaydet"
                onPress={async () => {
                  if (!baslik.trim()) {
                    Alert.alert('Eksik', 'Başlık gerekli');
                    return;
                  }
                  await addPlanlananGorev({
                    baslik: baslik.trim(),
                    aciklama: aciklama.trim(),
                    tarih: /^\d{4}-\d{2}-\d{2}$/.test(tarih) ? tarih : new Date().toISOString().slice(0, 10),
                    href: '/(tabs)',
                  });
                  setBaslik('');
                  setAciklama('');
                  setFormAcik(false);
                  await load();
                }}
              />
            </View>
          ) : null}

          {loading ? (
            <ActivityIndicator color={colors.tint} style={{ marginTop: 24 }} />
          ) : goster.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>
              Bu filtrede görev yok.
            </Text>
          ) : (
            goster.map((g) => {
              const renk = seviyeRenk(g.seviye, colors);
              return (
                <Pressable
                  key={g.id}
                  onPress={() => router.push(g.href as never)}
                  style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.row}>
                    <View style={[styles.badge, { backgroundColor: renk + '22' }]}>
                      <Text style={[styles.badgeText, { color: renk }]}>{seviyeEtiket(g.seviye)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: colors.text }]}>{g.baslik}</Text>
                      <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{g.aciklama}</Text>
                      <Text style={[styles.cta, { color: colors.tint }]}>{g.cta} →</Text>
                    </View>
                  </View>
                  {g.tamamlanabilir && g.id.startsWith('plan-') ? (
                    <Pressable
                      onPress={async () => {
                        await setPlanlananTamam(g.id.replace(/^plan-/, ''), true);
                        await load();
                      }}
                      style={[styles.doneBtn, { borderColor: colors.success }]}>
                      <Text style={{ color: colors.success, fontWeight: '700', fontSize: 13 }}>Tamamla</Text>
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  intro: { lineHeight: 20, marginBottom: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  form: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    fontSize: 15,
    minHeight: 44,
  },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginTop: 2 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  itemTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  itemDesc: { fontSize: 13, lineHeight: 18 },
  cta: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  doneBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
