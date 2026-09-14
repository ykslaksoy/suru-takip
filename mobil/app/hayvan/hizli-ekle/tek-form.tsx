import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import { countAnimals } from '@/kaynak/cekirdek/veritabani';
import { limitAsimindaPaketAc } from '@/kaynak/abonelik/limit';
import { hizliTekKuzuEkle } from '@/kaynak/suru/hizli-kuzu-kabul';
import type { AnimalSex } from '@/kaynak/cekirdek/tipler';

function uyar(baslik: string, mesaj: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${baslik}\n\n${mesaj}`);
    return;
  }
  Alert.alert(baslik, mesaj);
}

/** Minimal tek kuzu formu — seçilen padok için ayrı sayfa */
export default function HizliTekFormScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { scrollPadBottom } = useAltGuvenliBosluk(72);
  const { refresh } = useDatabase();
  const { limit, refresh: refreshSub } = useSubscription();
  const params = useLocalSearchParams<{ padok?: string }>();
  const padok = typeof params.padok === 'string' ? params.padok : '';

  const [earTag, setEarTag] = useState('');
  const [sirtNo, setSirtNo] = useState('');
  const [sex, setSex] = useState<AnimalSex>('male');
  const [busy, setBusy] = useState(false);

  const kaydet = async () => {
    if (busy) return;
    if (!padok.trim()) {
      uyar('Padok', 'Önce padok seçin');
      return;
    }
    if (!earTag.trim()) {
      uyar('Küpe', 'Kulak küpe numarası yazın');
      return;
    }
    setBusy(true);
    try {
      const count = await countAnimals();
      if (count >= limit) {
        const ac = await limitAsimindaPaketAc(count + 1);
        await refreshSub();
        if (!ac.success) {
          uyar('Limit', ac.message);
          router.push('/abonelik' as never);
          return;
        }
      }
      const sonuc = await hizliTekKuzuEkle({
        earTag,
        paddock: padok,
        sex,
        sirtNo: sirtNo || undefined,
      });
      refresh();
      router.replace({
        pathname: '/hayvan/hizli-ekle/sonuc',
        params: {
          ids: sonuc.hayvanlar.map((h) => h.id).join(','),
          tags: sonuc.hayvanlar.map((h) => h.earTag).join(','),
          padok,
          plan: sonuc.planMesaj,
        },
      } as never);
    } catch (e) {
      uyar('Hata', e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: padok || 'Hızlı kuzu' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollPadBottom }]}>
        <Text style={[styles.badge, { color: colors.tint, backgroundColor: colors.tint + '18' }]}>
          Padok: {padok || '—'}
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>Kulak küpe *</Text>
        <TextInput
          value={earTag}
          onChangeText={setEarTag}
          placeholder="TR-34-001234"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="characters"
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
          ]}
        />

        <Text style={[styles.label, { color: colors.text }]}>Sırt no (opsiyonel)</Text>
        <TextInput
          value={sirtNo}
          onChangeText={setSirtNo}
          placeholder="87"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
          ]}
        />

        <Text style={[styles.label, { color: colors.text }]}>Cinsiyet</Text>
        <View style={styles.row}>
          {([
            { id: 'male' as const, label: 'Erkek' },
            { id: 'female' as const, label: 'Dişi' },
          ]).map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setSex(s.id)}
              style={[
                styles.sexBtn,
                {
                  borderColor: sex === s.id ? colors.tint : colors.border,
                  backgroundColor: sex === s.id ? colors.tint : colors.card,
                },
              ]}>
              <Text
                style={{
                  color: sex === s.id ? '#fff' : colors.text,
                  fontWeight: '800',
                  fontSize: 16,
                }}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void kaydet()}
          style={[
            styles.save,
            { backgroundColor: colors.tint, opacity: busy ? 0.5 : 1 },
          ]}>
          <Text style={styles.saveText}>{busy ? 'Kaydediliyor…' : 'Padoka kaydet'}</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 16,
    overflow: 'hidden',
  },
  label: { fontWeight: '700', marginBottom: 8, fontSize: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 18,
    minHeight: 56,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  sexBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  save: {
    borderRadius: 14,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 18 },
});
