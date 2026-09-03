import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { getBugunMaddeleri, type BugunMadde, type BugunSeviye } from '@/kaynak/ana-sayfa';
import { useDatabase } from '@/baglam/VeritabaniBaglami';

function seviyeEtiket(s: BugunSeviye): string {
  if (s === 'uyari') return 'Uyarı';
  if (s === 'sira') return 'Sıra';
  return 'Bilgi';
}

function seviyeRenk(s: BugunSeviye, colors: (typeof Colors)['light']): string {
  if (s === 'uyari') return colors.danger;
  if (s === 'sira') return colors.warning;
  return colors.tint;
}

export function BugunKarti() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { ready, refreshKey } = useDatabase();
  const [maddeler, setMaddeler] = useState<BugunMadde[]>([]);
  const [loading, setLoading] = useState(true);
  const [acik, setAcik] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMaddeler(await getBugunMaddeleri());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, refreshKey, load]);

  const uyariSayisi = useMemo(
    () => maddeler.filter((m) => m.seviye === 'uyari').length,
    [maddeler],
  );
  const toplam = maddeler.length;
  const ozetMetin = useMemo(() => {
    if (loading) return 'Yükleniyor…';
    if (toplam === 0) return 'Bugün bekleyen görev yok';
    if (uyariSayisi > 0) {
      return `${uyariSayisi} uyarı · ${toplam} görev`;
    }
    return `${toplam} görev`;
  }, [loading, toplam, uyariSayisi]);

  return (
    <View style={StyleSheet.flatten([styles.card, { backgroundColor: colors.card, borderColor: colors.border }])}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: acik }}
        accessibilityLabel={`Bugün. ${ozetMetin}. ${acik ? 'Detayı kapat' : 'Detayı aç'}`}
        onPress={() => setAcik((v) => !v)}
        style={({ pressed }) => StyleSheet.flatten([styles.btn, { opacity: pressed ? 0.88 : 1 }])}>
        <View style={{ flex: 1 }}>
          <Text style={StyleSheet.flatten([styles.title, { color: colors.text }])}>Bugün</Text>
          <Text style={StyleSheet.flatten([styles.sub, { color: colors.textSecondary }])}>{ozetMetin}</Text>
        </View>
        {uyariSayisi > 0 && !loading ? (
          <View style={StyleSheet.flatten([styles.sayiRozet, { backgroundColor: colors.danger }])}>
            <Text style={styles.sayiText}>{uyariSayisi}</Text>
          </View>
        ) : null}
        <Text style={StyleSheet.flatten([styles.ok, { color: colors.tint }])}>{acik ? '▲' : '▼'}</Text>
      </Pressable>

      {acik ? (
        <View style={StyleSheet.flatten([styles.detay, { borderTopColor: colors.border }])}>
          <View style={styles.detayHeader}>
            <Text style={StyleSheet.flatten([styles.detayBaslik, { color: colors.textSecondary }])}>
              Günlük görevler
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tüm görevler"
              onPress={() => router.push('/gorevler' as never)}
              hitSlop={8}>
              <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 13 }}>Tümü →</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.tint} style={{ marginVertical: 12 }} />
          ) : toplam === 0 ? (
            <Text style={StyleSheet.flatten([styles.bos, { color: colors.textSecondary }])}>
              Şu an uyarı veya görev yok.
            </Text>
          ) : (
            maddeler.map((m, index) => {
              const renk = seviyeRenk(m.seviye, colors);
              return (
                <Pressable
                  key={m.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${m.baslik}. ${m.aciklama}`}
                  onPress={() => router.push(m.href as never)}
                  style={({ pressed }) =>
                    StyleSheet.flatten([
                      styles.row,
                      index < maddeler.length - 1
                        ? {
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: colors.border,
                          }
                        : null,
                      { opacity: pressed ? 0.85 : 1 },
                    ])
                  }>
                  <View style={StyleSheet.flatten([styles.badge, { backgroundColor: renk + '22' }])}>
                    <Text style={StyleSheet.flatten([styles.badgeText, { color: renk }])}>
                      {seviyeEtiket(m.seviye)}
                    </Text>
                  </View>
                  <View style={styles.body}>
                    <Text style={StyleSheet.flatten([styles.itemTitle, { color: colors.text }])}>
                      {m.baslik}
                    </Text>
                    <Text
                      style={StyleSheet.flatten([styles.itemDesc, { color: colors.textSecondary }])}
                      numberOfLines={1}>
                      {m.aciklama}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 42,
  },
  title: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  sub: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  sayiRozet: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  sayiText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  ok: { fontSize: 11, fontWeight: '800', paddingLeft: 2 },
  detay: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  detayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 2,
  },
  detayBaslik: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  bos: { paddingVertical: 10, fontSize: 13, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  badge: {
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '800' },
  body: { flex: 1 },
  itemTitle: { fontSize: 13, fontWeight: '700', marginBottom: 1 },
  itemDesc: { fontSize: 12, lineHeight: 16 },
  cta: { fontSize: 12, fontWeight: '700', marginTop: 4 },
});
