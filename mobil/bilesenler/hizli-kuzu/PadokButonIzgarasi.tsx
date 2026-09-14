import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  GOZLEM_PADOK_AD,
  addPadok,
  getPadoklar,
  padokDoluluk,
  type Padok,
} from '@/kaynak/suru/padok';

type PadokSatir = Padok & { hayvan: number; bos: number };

type Props = {
  onSec: (padokAd: string) => void;
  oneriAd?: string;
  /** true: yeni padok eklenince hemen seç */
  yeniSonraSec?: boolean;
};

/** Büyük padok butonları + yeni padok — saha / eldiven dostu */
export function PadokButonIzgarasi({
  onSec,
  oneriAd = GOZLEM_PADOK_AD,
  yeniSonraSec = true,
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [liste, setListe] = useState<PadokSatir[]>([]);
  const [loading, setLoading] = useState(true);
  const [yeniAd, setYeniAd] = useState('');
  const [busy, setBusy] = useState(false);
  const [hata, setHata] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const padoklar = await getPadoklar();
      const zengin = await Promise.all(
        padoklar.map(async (p) => {
          const d = await padokDoluluk(p);
          return { ...p, hayvan: d.hayvan, bos: d.bos };
        }),
      );
      setListe(zengin);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const yeniEkle = async () => {
    const ad = yeniAd.trim();
    if (!ad || busy) return;
    setBusy(true);
    setHata('');
    try {
      await addPadok({ ad, kapasite: 50, karantina: false });
      setYeniAd('');
      await load();
      if (yeniSonraSec) onSec(ad);
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Padok eklenemedi');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <ActivityIndicator color={colors.tint} style={{ marginVertical: 24 }} />;
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.baslik, { color: colors.text }]}>Padoklar</Text>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Üstten seçin · önerilen: {oneriAd}
      </Text>
      <View style={styles.grid}>
        {liste.map((p) => {
          const oneri = p.ad === oneriAd;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`${p.ad} padok${oneri ? ', önerilen' : ''}`}
              onPress={() => onSec(p.ad)}
              style={({ pressed }) =>
                StyleSheet.flatten([
                  styles.btn,
                  {
                    borderColor: oneri ? colors.tint : colors.border,
                    backgroundColor: oneri ? colors.tint + '18' : colors.card,
                    opacity: pressed ? 0.85 : 1,
                  },
                ])
              }>
              <Text style={[styles.btnTitle, { color: colors.text }]}>
                {p.karantina ? '🛡 ' : ''}
                {p.ad}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                {p.hayvan}/{p.kapasite} · {p.bos} boş
              </Text>
              {oneri ? (
                <Text style={{ color: colors.tint, fontWeight: '800', marginTop: 4, fontSize: 12 }}>
                  Önerilen
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.yeniBaslik, { color: colors.text }]}>Yeni padok</Text>
      <View style={styles.yeniRow}>
        <TextInput
          value={yeniAd}
          onChangeText={setYeniAd}
          placeholder="Padok adı"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yeni padok ekle"
          disabled={busy || !yeniAd.trim()}
          onPress={() => void yeniEkle()}
          style={[
            styles.ekleBtn,
            {
              backgroundColor: colors.tint,
              opacity: busy || !yeniAd.trim() ? 0.45 : 1,
            },
          ]}>
          <Text style={styles.ekleText}>Ekle</Text>
        </Pressable>
      </View>
      {hata ? <Text style={{ color: colors.danger, marginTop: 8 }}>{hata}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  baslik: { fontSize: 22, fontWeight: '900', marginBottom: 2, letterSpacing: -0.3 },
  hint: { fontSize: 14, marginBottom: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  btn: {
    width: '47%',
    flexGrow: 1,
    minWidth: '42%',
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    minHeight: 96,
  },
  btnTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  yeniBaslik: { fontWeight: '800', fontSize: 16, marginTop: 20, marginBottom: 8 },
  yeniRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
  },
  ekleBtn: {
    borderRadius: 12,
    paddingHorizontal: 18,
    minHeight: 52,
    justifyContent: 'center',
  },
  ekleText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
