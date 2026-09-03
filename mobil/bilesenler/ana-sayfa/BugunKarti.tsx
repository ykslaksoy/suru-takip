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
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: acik }}
        accessibilityLabel={`Bugün. ${ozetMetin}. ${acik ? 'Detayı kapat' : 'Detayı aç'}`}
        onPress={() => setAcik((v) => !v)}
        style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.88 : 1 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Bugün</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>{ozetMetin}</Text>
        </View>
        {uyariSayisi > 0 && !loading ? (
          <View style={[styles.sayiRozet, { backgroundColor: colors.danger }]}>
            <Text style={styles.sayiText}>{uyariSayisi}</Text>
          </View>
        ) : null}
        <Text style={[styles.ok, { color: colors.tint }]}>{acik ? '▲' : '▼'}</Text>
      </Pressable>

      {acik ? (
        <View style={[styles.detay, { borderTopColor: colors.border }]}>
          <View style={styles.detayHeader}>
            <Text style={[styles.detayBaslik, { color: colors.textSecondary }]}>Günlük görevler</Text>
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
            <Text style={[styles.bos, { color: colors.textSecondary }]}>Şu an uyarı veya görev yok.</Text>
          ) : (
            maddeler.map((m, index) => {
              const renk = seviyeRenk(m.seviye, colors);
              return (
                <Pressable
                  key={m.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${m.baslik}. ${m.aciklama}`}
                  onPress={() => router.push(m.href as never)}
                  style={({ pressed }) => [
                    styles.row,
                    index < maddeler.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                    { opacity: pressed ? 0.85 : 1 },
                  ]}>
                  <View style={[styles.badge, { backgroundColor: renk + '22' }]}>
                    <Text style={[styles.badgeText, { color: renk }]}>{seviyeEtiket(m.seviye)}</Text>
                  </View>
                  <View style={styles.body}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{m.baslik}</Text>
                    <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {m.aciklama}
                    </Text>
                    <Text style={[styles.cta, { color: colors.tint }]}>{m.cta} →</Text>
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
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 56,
  },
  title: { fontSize: 18, fontWeight: '800' },
  sub: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  sayiRozet: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sayiText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  ok: { fontSize: 12, fontWeight: '800', paddingLeft: 2 },
  detay: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  detayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 4,
  },
  detayBaslik: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  bos: { paddingVertical: 12, fontSize: 13, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  body: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  itemDesc: { fontSize: 13, lineHeight: 18 },
  cta: { fontSize: 12, fontWeight: '700', marginTop: 4 },
});
