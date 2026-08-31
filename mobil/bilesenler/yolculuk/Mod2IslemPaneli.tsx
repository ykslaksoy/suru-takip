import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import {
  baglaAnneKuzu,
  besiyeAl,
  besiyeHazirListele,
  kuzulatmaDurumuOku,
} from '@/kaynak/besi-koc-kat';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { useFocusEffect } from 'expo-router';

type Props = {
  adim: 'kuzulatma' | 'besiye-aktar' | null;
  onDegisti: () => void;
};

export function Mod2IslemPaneli({ adim, onDegisti }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [oneriler, setOneriler] = useState<{ kuzu: Animal; adayAnneler: Animal[] }[]>([]);
  const [besiAday, setBesiAday] = useState<Animal[]>([]);
  const [seciliAnne, setSeciliAnne] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (adim === 'kuzulatma') {
      const d = await kuzulatmaDurumuOku();
      setOneriler(d.oneriler);
    } else if (adim === 'besiye-aktar') {
      setBesiAday(await besiyeHazirListele());
    }
  }, [adim]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (adim === 'kuzulatma') {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.tint }]}>
        <Text style={[styles.title, { color: colors.text }]}>Anne–kuzu bağla</Text>
        {oneriler.length === 0 ? (
          <Text style={{ color: colors.textSecondary, marginTop: 6 }}>
            Bağlanacak kuzu yok veya hepsi anne bağlı.
          </Text>
        ) : (
          oneriler.slice(0, 8).map(({ kuzu, adayAnneler }) => (
            <View key={kuzu.id} style={styles.rowBlock}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {hayvanAnaEtiket(kuzu)}
              </Text>
              <View style={styles.chips}>
                {(adayAnneler.length ? adayAnneler : []).slice(0, 6).map((anne) => {
                  const aktif = seciliAnne[kuzu.id] === anne.id;
                  return (
                    <Pressable
                      key={anne.id}
                      onPress={() => setSeciliAnne({ ...seciliAnne, [kuzu.id]: anne.id })}
                      style={[
                        styles.chip,
                        {
                          borderColor: aktif ? colors.tint : colors.border,
                          backgroundColor: aktif ? colors.tint : colors.background,
                        },
                      ]}>
                      <Text style={{ color: aktif ? '#fff' : colors.text, fontSize: 12, fontWeight: '700' }}>
                        {hayvanAnaEtiket(anne)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <AnaButon
                title="Bağla"
                onPress={async () => {
                  const anneId = seciliAnne[kuzu.id] ?? adayAnneler[0]?.id;
                  if (!anneId) {
                    Alert.alert('Anne yok', 'Önce dişi / anne kaydı ekleyin');
                    return;
                  }
                  await baglaAnneKuzu(kuzu.id, anneId);
                  await load();
                  onDegisti();
                  Alert.alert('Tamam', 'Anne–kuzu bağlandı');
                }}
              />
            </View>
          ))
        )}
      </View>
    );
  }

  if (adim === 'besiye-aktar') {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.tint }]}>
        <Text style={[styles.title, { color: colors.text }]}>Besiye al</Text>
        {besiAday.length === 0 ? (
          <Text style={{ color: colors.textSecondary, marginTop: 6 }}>
            2–4 ay bandında bekleyen kuzu yok.
          </Text>
        ) : (
          besiAday.slice(0, 10).map((a) => (
            <View key={a.id} style={styles.listRow}>
              <Text style={{ color: colors.text, flex: 1, fontWeight: '600' }}>
                {hayvanAnaEtiket(a)} · {a.paddock || 'padoksuz'}
              </Text>
              <Pressable
                onPress={async () => {
                  await besiyeAl(a.id, 'Besi');
                  await load();
                  onDegisti();
                }}
                style={[styles.miniBtn, { backgroundColor: colors.tint }]}>
                <Text style={styles.miniBtnText}>Besiye</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  title: { fontWeight: '800', marginBottom: 4 },
  rowBlock: { marginTop: 10, gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  miniBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  miniBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
