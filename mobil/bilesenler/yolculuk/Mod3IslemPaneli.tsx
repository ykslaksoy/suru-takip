import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { damizlikAdayIsaretle, secereBagla, secilimSirala, type DamizlikSkor } from '@/kaynak/damizlik';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';

type Props = {
  adim: 'aday' | 'kimlik' | 'seleksiyon' | null;
  onDegisti: () => void;
};

export function Mod3IslemPaneli({ adim, onDegisti }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [liste, setListe] = useState<DamizlikSkor[]>([]);
  const [turkvet, setTurkvet] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setListe(await secilimSirala());
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (adim) load();
    }, [adim, load])
  );

  if (!adim) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.tint }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {adim === 'aday'
          ? 'Damızlık aday işaretle'
          : adim === 'kimlik'
            ? 'TÜRKVET / kimlik'
            : 'Seleksiyon sıralaması'}
      </Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 8, lineHeight: 18 }}>
        ADG, tartım, aşı ve TÜRKVET ile skorlanır.
      </Text>
      {liste.slice(0, adim === 'seleksiyon' ? 12 : 8).map((s) => (
        <View
          key={s.animal.id}
          style={[styles.row, { borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>
              {hayvanAnaEtiket(s.animal)} · skor {s.skor}
              {s.aday ? ' · aday' : ''}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              {s.nedenler.join(' · ') || 'Veri az'}
            </Text>
            {adim === 'kimlik' ? (
              <TextInput
                placeholder="TÜRKVET no"
                placeholderTextColor={colors.textSecondary}
                value={turkvet[s.animal.id] ?? s.animal.turkvetNo}
                onChangeText={(v) => setTurkvet({ ...turkvet, [s.animal.id]: v })}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
            ) : null}
          </View>
          {adim === 'aday' || adim === 'seleksiyon' ? (
            <Pressable
              onPress={async () => {
                await damizlikAdayIsaretle(s.animal.id, !s.aday);
                await load();
                onDegisti();
              }}
              style={[styles.miniBtn, { backgroundColor: s.aday ? colors.success : colors.tint }]}>
              <Text style={styles.miniBtnText}>{s.aday ? 'Aday✓' : 'Aday'}</Text>
            </Pressable>
          ) : (
            <AnaButon
              title="Kaydet"
              onPress={async () => {
                const no = (turkvet[s.animal.id] ?? s.animal.turkvetNo).trim();
                if (no.length < 8) {
                  Alert.alert('Eksik', 'TÜRKVET en az 8 karakter');
                  return;
                }
                await secereBagla(s.animal.id, { turkvetNo: no });
                await load();
                onDegisti();
                Alert.alert('Tamam', 'Kimlik güncellendi');
              }}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  title: { fontWeight: '800', marginBottom: 4 },
  row: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    fontSize: 14,
    minHeight: 40,
  },
  miniBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, alignSelf: 'center' },
  miniBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
