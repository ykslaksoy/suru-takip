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
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import {
  getGorevGruplari,
  setPlanlananTamam,
  setIsPlaniTamam,
  gorevSeviyeEtiket,
  gorevTarihMetni,
  type Gorev,
  type GorevGrup,
  type GorevKategoriId,
  type GorevSeviye,
} from '@/kaynak/gorevler';

type Sekme = 'gunluk' | 'is-plani';

async function gorevTamamla(id: string): Promise<void> {
  if (id.startsWith('is-plani-')) {
    await setIsPlaniTamam(id.replace(/^is-plani-/, ''), true);
  } else if (id.startsWith('plan-')) {
    await setPlanlananTamam(id.replace(/^plan-/, ''), true);
  }
}

function seviyeRenk(seviye: GorevSeviye, colors: (typeof Colors)['light']): string {
  if (seviye === 'uyari') return colors.danger;
  if (seviye === 'sira') return colors.warning;
  if (seviye === 'plan') return colors.tint;
  return colors.textSecondary;
}

function GorevSatiri({
  g,
  colors,
  onTamamla,
}: {
  g: Gorev;
  colors: (typeof Colors)['light'];
  onTamamla?: () => void;
}) {
  const renk = seviyeRenk(g.seviye, colors);
  const tarih = gorevTarihMetni(g.tarih);
  // "20 kuzu" veya "20 kuzu · …" → satırda kaç kuzu net görünsün
  const kuzuEslesme = g.aciklama.match(/^(\d+)\s*kuzu\b/i);
  const kuzuMetin = kuzuEslesme ? `${kuzuEslesme[1]} kuzu` : null;
  const kalanAciklama = kuzuEslesme
    ? g.aciklama.replace(/^\d+\s*kuzu\s*[·•-]?\s*/i, '').trim()
    : g.aciklama;

  return (
    <View style={styles.madde}>
      <Pressable onPress={() => router.push(g.href as never)}>
        <View style={styles.metaRow}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, flex: 1 }}>
            <Text style={{ color: colors.tint }}>{tarih}</Text>
            <Text style={{ color: colors.textSecondary }}> · </Text>
            {g.baslik}
            {kuzuMetin ? (
              <>
                <Text style={{ color: colors.textSecondary }}> · </Text>
                <Text style={{ color: colors.text }}>{kuzuMetin}</Text>
              </>
            ) : null}
          </Text>
          <View style={[styles.seviyeBadge, { backgroundColor: renk + '22' }]}>
            <Text style={{ color: renk, fontSize: 11, fontWeight: '800' }}>
              {gorevSeviyeEtiket(g.seviye)}
            </Text>
          </View>
        </View>
        {kalanAciklama ? (
          <Text style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
            {kalanAciklama}
          </Text>
        ) : null}
        <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12, marginTop: 6 }}>{g.cta} →</Text>
      </Pressable>
      {g.tamamlanabilir && onTamamla ? (
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
  const [sekme, setSekme] = useState<Sekme>('gunluk');
  const [gruplar, setGruplar] = useState<GorevGrup[]>([]);
  const [diger, setDiger] = useState<Gorev[]>([]);
  const [loading, setLoading] = useState(true);
  const [secili, setSecili] = useState<GorevKategoriId | null>(null);

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
                Sıralama: en yakın tarih önce; aynı günde parazit → karma → selenyum →
                tartım → rapel. Kategoriye dokunun.
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
                          <View
                            style={[styles.sayi, { backgroundColor: aktif ? colors.tint : colors.warning }]}>
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
                            g.tamamlanabilir ? () => tamamlaVeYenile(g.id) : undefined
                          }
                        />
                      ))}
                      <Pressable onPress={() => router.push(aktifGrup.href as never)} style={{ marginTop: 8 }}>
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
  detayBaslik: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detayTitle: { fontSize: 17, fontWeight: '800' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  seviyeBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
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
});
