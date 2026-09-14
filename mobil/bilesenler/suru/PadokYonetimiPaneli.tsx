import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  addPadok,
  getPadoklar,
  padokDoluluk,
  silPadok,
  type Padok,
} from '@/kaynak/suru/padok';

function uyar(baslik: string, mesaj: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${baslik}\n\n${mesaj}`);
    return;
  }
  const { Alert } = require('react-native') as typeof import('react-native');
  Alert.alert(baslik, mesaj);
}

type PadokSatir = Padok & { hayvan: number; bos: number; dolu: boolean };

type Props = {
  /** Seçili padok adı — listedeki hayvanlar buna göre süzülür */
  seciliPadok?: string | null;
  onPadokSec?: (padokAd: string | null) => void;
};

/**
 * Padok listesi — satıra / Giriş’e dokununca padok açılır (içindeki hayvanlar).
 * + ile o padoka yeni hayvan eklenir.
 */
export function PadokYonetimiPaneli({ seciliPadok = null, onPadokSec }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [liste, setListe] = useState<PadokSatir[]>([]);
  const [ad, setAd] = useState('');
  const [kapasite, setKapasite] = useState('30');
  const [karantina, setKarantina] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formAcik, setFormAcik] = useState(false);

  const load = useCallback(async () => {
    const padoklar = await getPadoklar();
    const zengin = await Promise.all(
      padoklar.map(async (p) => {
        const d = await padokDoluluk(p);
        return { ...p, ...d };
      }),
    );
    setListe(zengin);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ozet = useMemo(() => {
    const hayvan = liste.reduce((s, p) => s + p.hayvan, 0);
    const kap = liste.reduce((s, p) => s + p.kapasite, 0);
    return `${liste.length} padok · ${hayvan}/${kap}`;
  }, [liste]);

  const acPadok = (padokAd: string) => {
    onPadokSec?.(padokAd);
  };

  const ekle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const isim = ad.trim();
      await addPadok({
        ad: isim,
        kapasite: parseInt(kapasite, 10) || 30,
        karantina,
      });
      setAd('');
      setKapasite('30');
      setKarantina(false);
      setFormAcik(false);
      await load();
      uyar('Tamam', `"${isim}" padoku eklendi.`);
    } catch (e) {
      uyar('Hata', e instanceof Error ? e.message : 'Padok eklenemedi');
    } finally {
      setBusy(false);
    }
  };

  const sil = (p: PadokSatir) => {
    const yap = async () => {
      try {
        await silPadok(p.id);
        if (seciliPadok === p.ad) onPadokSec?.(null);
        await load();
      } catch (e) {
        uyar('Hata', e instanceof Error ? e.message : 'Silinemedi');
      }
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`${p.ad} silinsin mi?`)) void yap();
      return;
    }
    const { Alert } = require('react-native') as typeof import('react-native');
    Alert.alert('Padok sil', `${p.ad} silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void yap() },
    ]);
  };

  return (
    <View
      style={StyleSheet.flatten([
        styles.box,
        { backgroundColor: colors.card, borderColor: colors.border },
      ])}>
      <View style={styles.ust}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={StyleSheet.flatten([styles.title, { color: colors.text }])}>Padoklar</Text>
          <Text style={StyleSheet.flatten([styles.hint, { color: colors.textSecondary }])}>
            {ozet} · dokunarak aç
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={formAcik ? 'Formu kapat' : 'Yeni padok'}
          onPress={() => setFormAcik((v) => !v)}
          style={StyleSheet.flatten([
            styles.yeniBtn,
            { borderColor: colors.border, backgroundColor: colors.background },
          ])}>
          <Text style={StyleSheet.flatten([styles.yeniText, { color: colors.tint }])}>
            {formAcik ? 'Kapat' : '+ Yeni'}
          </Text>
        </Pressable>
      </View>

      {seciliPadok ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tüm padokları göster"
          onPress={() => onPadokSec?.(null)}
          style={StyleSheet.flatten([
            styles.seciliSerit,
            { backgroundColor: colors.tint + '14', borderColor: colors.tint },
          ])}>
          <Ionicons name="filter" size={14} color={colors.tint} />
          <Text style={StyleSheet.flatten([styles.seciliYazi, { color: colors.tint }])} numberOfLines={1}>
            {seciliPadok} açık · tümüne dön
          </Text>
          <Ionicons name="close-circle" size={16} color={colors.tint} />
        </Pressable>
      ) : null}

      <View style={styles.liste}>
        {liste.map((p) => {
          const doluluk = p.kapasite > 0 ? Math.min(1, p.hayvan / p.kapasite) : 0;
          const secili = seciliPadok === p.ad;
          return (
            <View
              key={p.id}
              style={StyleSheet.flatten([
                styles.row,
                {
                  borderColor: colors.border,
                  backgroundColor: secili ? colors.tint + '10' : 'transparent',
                },
              ])}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${p.ad} padokunu aç, ${p.hayvan} hayvan`}
                onPress={() => acPadok(p.ad)}
                style={styles.satirGovde}>
                <Text
                  numberOfLines={1}
                  style={StyleSheet.flatten([
                    styles.padokAd,
                    { color: secili ? colors.tint : colors.text },
                  ])}>
                  {p.karantina ? '🛡 ' : ''}
                  {p.ad}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={StyleSheet.flatten([
                      styles.barFill,
                      {
                        width: `${Math.round(doluluk * 100)}%`,
                        backgroundColor: p.dolu ? colors.danger : colors.tint,
                      },
                    ])}
                  />
                </View>
                <Text style={StyleSheet.flatten([styles.meta, { color: colors.textSecondary }])}>
                  {p.hayvan}/{p.kapasite}
                  {p.dolu ? ' · dolu' : ` · ${p.bos} boş`}
                  {secili ? ' · açık' : ''}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${p.ad} aç`}
                onPress={() => acPadok(p.ad)}
                style={StyleSheet.flatten([
                  styles.girisBtn,
                  { backgroundColor: secili ? colors.tint : colors.tint },
                ])}>
                <Text style={styles.girisText}>{secili ? 'Açık' : 'Giriş'}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${p.ad} hayvan ekle`}
                onPress={() =>
                  router.push({ pathname: '/hayvan/hizli-ekle/tek-form', params: { padok: p.ad } } as never)
                }
                style={StyleSheet.flatten([
                  styles.ekleBtn,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ])}>
                <Ionicons name="add" size={18} color={colors.tint} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${p.ad} sil`}
                onPress={() => sil(p)}
                hitSlop={6}
                style={styles.silBtn}>
                <Text style={StyleSheet.flatten([styles.silText, { color: colors.danger }])}>Sil</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {formAcik ? (
        <View style={StyleSheet.flatten([styles.form, { borderTopColor: colors.border }])}>
          <TextInput
            placeholder="Padok adı"
            placeholderTextColor={colors.textSecondary}
            value={ad}
            onChangeText={setAd}
            style={StyleSheet.flatten([
              styles.input,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
            ])}
          />
          <View style={styles.formRow}>
            <TextInput
              placeholder="Kapasite"
              keyboardType="number-pad"
              placeholderTextColor={colors.textSecondary}
              value={kapasite}
              onChangeText={setKapasite}
              style={StyleSheet.flatten([
                styles.input,
                styles.kapasite,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
              ])}
            />
            <Pressable onPress={() => setKarantina(!karantina)} style={styles.karantina}>
              <Text
                style={{
                  color: karantina ? colors.tint : colors.textSecondary,
                  fontWeight: '700',
                  fontSize: 13,
                }}>
                {karantina ? '✓ Karantina' : '○ Normal'}
              </Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={busy || !ad.trim()}
            onPress={() => void ekle()}
            style={StyleSheet.flatten([
              styles.kaydetBtn,
              {
                backgroundColor: colors.tint,
                opacity: busy || !ad.trim() ? 0.5 : 1,
              },
            ])}>
            <Text style={styles.girisText}>{busy ? 'Ekleniyor…' : 'Padok ekle'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  ust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: { fontWeight: '800', fontSize: 14, letterSpacing: -0.2 },
  hint: { fontSize: 11, marginTop: 1, fontWeight: '600' },
  yeniBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  yeniText: { fontWeight: '800', fontSize: 13 },
  seciliSerit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    marginTop: 4,
  },
  seciliYazi: { flex: 1, fontWeight: '700', fontSize: 12 },
  liste: { gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  satirGovde: { flex: 1, minWidth: 0, paddingVertical: 2 },
  padokAd: { fontWeight: '700', fontSize: 14 },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e8efe6',
    marginTop: 6,
    marginBottom: 4,
    overflow: 'hidden',
  },
  barFill: { height: 4, borderRadius: 2 },
  meta: { fontSize: 11, fontWeight: '600' },
  girisBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  girisText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  ekleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  silBtn: { paddingHorizontal: 4, paddingVertical: 8, minHeight: 36, justifyContent: 'center' },
  silText: { fontWeight: '700', fontSize: 12 },
  form: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 4,
    gap: 8,
  },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    fontSize: 15,
  },
  kapasite: { flex: 1 },
  karantina: { paddingVertical: 8, paddingHorizontal: 4 },
  kaydetBtn: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});
