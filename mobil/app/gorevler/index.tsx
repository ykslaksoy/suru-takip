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
  getGorevGruplari,
  setPlanlananTamam,
  type Gorev,
  type GorevGrup,
  type GorevKategoriId,
} from '@/kaynak/gorevler';

function GorevSatiri({
  g,
  colors,
  onTamamla,
}: {
  g: Gorev;
  colors: (typeof Colors)['light'];
  onTamamla?: () => void;
}) {
  return (
    <View style={[styles.madde, { borderColor: colors.border }]}>
      <Pressable onPress={() => router.push(g.href as never)}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{g.baslik}</Text>
        <Text style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>{g.aciklama}</Text>
        <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12, marginTop: 6 }}>{g.cta} →</Text>
      </Pressable>
      {g.tamamlanabilir && g.id.startsWith('plan-') && onTamamla ? (
        <Pressable onPress={onTamamla} style={[styles.tamamBtn, { borderColor: colors.success }]}>
          <Text style={{ color: colors.success, fontWeight: '700', fontSize: 12 }}>Tamamla</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function GorevlerScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { ready, refreshKey } = useDatabase();
  const [gruplar, setGruplar] = useState<GorevGrup[]>([]);
  const [diger, setDiger] = useState<Gorev[]>([]);
  const [loading, setLoading] = useState(true);
  const [secili, setSecili] = useState<GorevKategoriId | null>(null);
  const [formAcik, setFormAcik] = useState(false);
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { gruplar: g, diger: d } = await getGorevGruplari();
      setGruplar(g);
      setDiger(d);
      setSecili((prev) => {
        if (prev && g.some((x) => x.id === prev)) return prev;
        return null;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load, refreshKey])
  );

  const aktifGrup = secili ? gruplar.find((g) => g.id === secili) : null;

  return (
    <>
      <Stack.Screen options={{ title: 'Görevler' }} />
      <View style={[styles.shell, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            Öncelik sırası: aşı → tartım → stok → sağlık. Kategoriye dokunun, maddeleri görün.
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.tint} style={{ marginVertical: 24 }} />
          ) : gruplar.length === 0 && diger.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>
              Şu an bekleyen görev yok.
            </Text>
          ) : (
            <>
              <View style={styles.kategoriRow}>
                {gruplar.map((g) => {
                  const aktif = secili === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      onPress={() => setSecili(aktif ? null : g.id)}
                      style={[
                        styles.kategoriBtn,
                        {
                          borderColor: aktif ? colors.tint : colors.border,
                          backgroundColor: aktif ? `${colors.tint}18` : colors.card,
                        },
                      ]}>
                      <Text style={styles.kategoriIcon}>{g.icon}</Text>
                      <Text style={[styles.kategoriLabel, { color: colors.text }]}>{g.label}</Text>
                      <View style={[styles.sayi, { backgroundColor: aktif ? colors.tint : colors.warning }]}>
                        <Text style={styles.sayiText}>{g.adet}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {aktifGrup ? (
                <View style={[styles.detay, { backgroundColor: colors.card, borderColor: colors.tint }]}>
                  <View style={styles.detayBaslik}>
                    <Text style={[styles.detayTitle, { color: colors.text }]}>
                      {aktifGrup.icon} {aktifGrup.label}
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>{aktifGrup.adet} görev</Text>
                  </View>
                  {aktifGrup.gorevler.map((g) => (
                    <GorevSatiri
                      key={g.id}
                      g={g}
                      colors={colors}
                      onTamamla={
                        g.tamamlanabilir
                          ? async () => {
                              await setPlanlananTamam(g.id.replace(/^plan-/, ''), true);
                              await load();
                            }
                          : undefined
                      }
                    />
                  ))}
                  <Pressable
                    onPress={() => router.push(aktifGrup.href as never)}
                    style={{ marginTop: 8 }}>
                    <Text style={{ color: colors.tint, fontWeight: '800' }}>
                      {aktifGrup.label} ekranına git →
                    </Text>
                  </Pressable>
                </View>
              ) : gruplar.length > 0 ? (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: 16 }}>
                  Detay için bir kategori seçin.
                </Text>
              ) : null}

              {diger.length > 0 ? (
                <View style={[styles.detay, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.detayTitle, { color: colors.text, marginBottom: 8 }]}>
                    🛤️ Diğer ({diger.length})
                  </Text>
                  {diger.map((g) => (
                    <GorevSatiri
                      key={g.id}
                      g={g}
                      colors={colors}
                      onTamamla={
                        g.tamamlanabilir
                          ? async () => {
                              await setPlanlananTamam(g.id.replace(/^plan-/, ''), true);
                              await load();
                            }
                          : undefined
                      }
                    />
                  ))}
                </View>
              ) : null}
            </>
          )}

          <Pressable onPress={() => setFormAcik(!formAcik)} style={{ marginTop: 16, marginBottom: 8 }}>
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
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  intro: { lineHeight: 20, marginBottom: 16 },
  kategoriRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kategoriBtn: {
    width: '47%',
    minWidth: 140,
    flexGrow: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  kategoriIcon: { fontSize: 28, marginBottom: 6 },
  kategoriLabel: { fontWeight: '800', fontSize: 16 },
  sayi: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  sayiText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  detay: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  detayBaslik: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detayTitle: { fontSize: 17, fontWeight: '800' },
  madde: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  tamamBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  form: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    fontSize: 15,
    minHeight: 44,
  },
});
