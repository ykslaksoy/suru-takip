import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
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
 * Padok listesi — üstte; satıra / Giriş’e dokununca padok açılır (hayvanlar altta).
 * Seçilince liste daralır, hayvanlar öne çıkar.
 */
export function PadokYonetimiPaneli({ seciliPadok = null, onPadokSec }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey } = useDatabase();
  const [liste, setListe] = useState<PadokSatir[]>([]);
  const [ad, setAd] = useState('');
  const [kapasite, setKapasite] = useState('30');
  const [karantina, setKarantina] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formAcik, setFormAcik] = useState(false);
  /** Seçiliyken padok listesini tekrar göster */
  const [listeAcik, setListeAcik] = useState(false);

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
  }, [load, refreshKey]);

  useEffect(() => {
    // Yeni seçimde listeyi kapat — hayvanlar görünsün
    if (seciliPadok) setListeAcik(false);
  }, [seciliPadok]);

  const ozet = useMemo(() => {
    const hayvan = liste.reduce((s, p) => s + p.hayvan, 0);
    const kap = liste.reduce((s, p) => s + p.kapasite, 0);
    return `${liste.length} padok · ${hayvan}/${kap}`;
  }, [liste]);

  const acPadok = (padokAd: string) => {
    onPadokSec?.(padokAd);
    setListeAcik(false);
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

  const listeGoster = !seciliPadok || listeAcik;

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
            {ozet} · dokun → hayvanlar
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
        <View style={styles.seciliBlok}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tüm padokları göster"
            onPress={() => {
              onPadokSec?.(null);
              setListeAcik(true);
            }}
            style={StyleSheet.flatten([
              styles.seciliSerit,
              { backgroundColor: colors.tint + '14', borderColor: colors.tint },
            ])}>
            <Ionicons name="arrow-back" size={18} color={colors.tint} />
            <Text style={StyleSheet.flatten([styles.seciliYazi, { color: colors.tint }])} numberOfLines={1}>
              {seciliPadok} · tümüne dön
            </Text>
            <Ionicons name="close-circle" size={22} color={colors.tint} />
          </Pressable>
          {!listeAcik ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Başka padok seç"
              onPress={() => setListeAcik(true)}
              style={StyleSheet.flatten([
                styles.degistirBtn,
                { borderColor: colors.border, backgroundColor: colors.background },
              ])}>
              <Text style={StyleSheet.flatten([styles.degistirText, { color: colors.text }])}>
                Başka padok
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {listeGoster ? (
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
                  style={StyleSheet.flatten([styles.girisBtn, { backgroundColor: colors.tint }])}>
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
                  <Ionicons name="add" size={22} color={colors.tint} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${p.ad} sil`}
                  onPress={() => sil(p)}
                  hitSlop={8}
                  style={styles.silBtn}>
                  <Text style={StyleSheet.flatten([styles.silText, { color: colors.danger }])}>Sil</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}

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
                  fontSize: 14,
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
    borderRadius: 14,
    padding: 12,
  },
  ust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: { fontWeight: '800', fontSize: 17, letterSpacing: -0.2 },
  hint: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  yeniBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  yeniText: { fontWeight: '800', fontSize: 15 },
  seciliBlok: { gap: 8, marginBottom: 4, marginTop: 4 },
  seciliSerit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 52,
  },
  seciliYazi: { flex: 1, fontWeight: '800', fontSize: 15 },
  degistirBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  degistirText: { fontWeight: '800', fontSize: 14 },
  liste: { gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 4,
    minHeight: 56,
  },
  satirGovde: { flex: 1, minWidth: 0, paddingVertical: 4 },
  padokAd: { fontWeight: '800', fontSize: 16 },
  barTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e8efe6',
    marginTop: 6,
    marginBottom: 4,
    overflow: 'hidden',
  },
  barFill: { height: 5, borderRadius: 3 },
  meta: { fontSize: 12, fontWeight: '600' },
  girisBtn: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    minWidth: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  girisText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  ekleBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  silBtn: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    minHeight: 48,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  silText: { fontWeight: '800', fontSize: 14 },
  form: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 4,
    gap: 8,
  },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 16,
  },
  kapasite: { flex: 1 },
  karantina: { paddingVertical: 12, paddingHorizontal: 6, minHeight: 48, justifyContent: 'center' },
  kaydetBtn: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
});
