import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import { IsPlaniPaneli } from '@/bilesenler/gorevler/IsPlaniPaneli';
import { GorevSatiri } from '@/bilesenler/gorevler/GorevSatiri';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import {
  getGorevGruplari,
  setPlanlananTamam,
  setIsPlaniTamam,
  type Gorev,
  type GorevGrup,
} from '@/kaynak/gorevler';

type Sekme = 'gunluk' | 'is-plani';

async function gorevTamamla(id: string): Promise<void> {
  if (id.startsWith('is-plani-')) {
    await setIsPlaniTamam(id.replace(/^is-plani-/, ''), true);
  } else if (id.startsWith('plan-')) {
    await setPlanlananTamam(id.replace(/^plan-/, ''), true);
  }
}

export default function GorevlerScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { ready, refreshKey } = useDatabase();
  const [sekme, setSekme] = useState<Sekme>('gunluk');
  const [gruplar, setGruplar] = useState<GorevGrup[]>([]);
  const [diger, setDiger] = useState<Gorev[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { gruplar: g, diger: d } = await getGorevGruplari();
      setGruplar(g);
      setDiger(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load, refreshKey])
  );

  const tamamlaVeYenile = async (id: string) => {
    await gorevTamamla(id);
    await load();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Görevler' }} />
      <View style={[styles.shell, { backgroundColor: colors.background }]}>
        <AltButonlar
          items={[
            { key: 'gunluk', label: 'Günlük' },
            { key: 'is-plani', label: 'İş planı' },
          ]}
          activeKey={sekme}
          onSelect={(k) => setSekme(k as Sekme)}
        />
        <ScrollView contentContainerStyle={styles.scroll}>
          {sekme === 'is-plani' ? (
            <IsPlaniPaneli refreshKey={refreshKey} onDegisti={load} />
          ) : (
            <>
              <Text style={[styles.intro, { color: colors.textSecondary }]}>
                Gün gün ilaç/aşı; yem ayrı. Gün 1’de tartı önerilen ilk — tartarken aynı seans
                diğer işler de yapılır. Satış ufku ~90 gün.
              </Text>

              {loading ? (
                <ActivityIndicator color={colors.tint} style={{ marginVertical: 24 }} />
              ) : gruplar.length === 0 && diger.length === 0 ? (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>
                  Şu an bekleyen görev yok. İş planı sekmesinden ileri tarih planlayın.
                </Text>
              ) : (
                <>
                  <View style={styles.kategoriRow}>
                    {gruplar.map((g) => (
                      <Pressable
                        key={g.id}
                        onPress={() =>
                          router.push(
                            (g.id === 'asi' ? '/gorevler/asi' : `/gorevler/kategori/${g.id}`) as never,
                          )
                        }
                        style={[
                          styles.kategoriBtn,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.card,
                          },
                        ]}>
                        <Text style={styles.kategoriIcon}>{g.icon}</Text>
                        <Text style={[styles.kategoriLabel, { color: colors.text }]}>{g.label}</Text>
                        <View style={[styles.sayi, { backgroundColor: colors.warning }]}>
                          <Text style={styles.sayiText}>{g.adet}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>

                  {diger.length > 0 ? (
                    <View style={[styles.detay, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.detayTitle, { color: colors.text, marginBottom: 8 }]}>
                        📋 Diğer ({diger.length})
                      </Text>
                      <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 13 }}>
                        Kuzu alım/satım planı, yolculuk adımı vb.
                      </Text>
                      {diger.map((g) => (
                        <GorevSatiri
                          key={g.id}
                          g={g}
                          colors={colors}
                          onTamamla={
                            g.tamamlanabilir ? () => tamamlaVeYenile(g.id) : undefined
                          }
                        />
                      ))}
                    </View>
                  ) : null}
                </>
              )}

              <Pressable onPress={() => setSekme('is-plani')} style={{ marginTop: 16 }}>
                <Text style={{ color: colors.tint, fontWeight: '800' }}>İş planı → kuzu kırpımı / tartım / alım / satım</Text>
              </Pressable>
            </>
          )}
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
  detayTitle: { fontSize: 17, fontWeight: '800' },
});
