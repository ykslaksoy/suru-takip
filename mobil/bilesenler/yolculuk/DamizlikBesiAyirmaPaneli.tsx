import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import {
  besiyeAlKuzular,
  getKuzuYonHedefMap,
  setKuzuYonHedefBulk,
  sutDisiAnneIds,
  sutDoganKuzuAdaylari,
  type KuzuYonHedef,
} from '@/kaynak/kuzu-yonlendirme';
import { hayvanSuruKolu } from '@/kaynak/suru-kolu';

type Props = {
  /** Mod 7: yalnız süt kolundaki kuzular */
  sutKoluFiltre?: boolean;
  onDegisti: () => void;
};

export function DamizlikBesiAyirmaPaneli({ sutKoluFiltre, onDegisti }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [kuzular, setKuzular] = useState<Animal[]>([]);
  const [hedef, setHedef] = useState<Record<string, KuzuYonHedef>>({});
  const [secili, setSecili] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const animals = (await getAnimals()).filter((a) => a.status !== 'sold' && a.status !== 'dead');
    const sutAnne = sutDisiAnneIds(animals);
    let aday = sutDoganKuzuAdaylari(animals, sutAnne);
    if (sutKoluFiltre) {
      const filtered: Animal[] = [];
      for (const k of aday) {
        const kol = await hayvanSuruKolu(k);
        const anne = animals.find((a) => a.id === k.motherId);
        const anneKol = anne ? await hayvanSuruKolu(anne) : null;
        if (kol === 'sut' || anneKol === 'sut' || kol !== 'et') filtered.push(k);
      }
      aday = filtered.length ? filtered : aday;
    }
    setKuzular(aday);
    setHedef(await getKuzuYonHedefMap());
    setSecili(new Set());
  }, [sutKoluFiltre]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggle = (id: string) => {
    const s = new Set(secili);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSecili(s);
  };

  const seciliIds = [...secili];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.tint }]}>
      <Text style={[styles.title, { color: colors.text }]}>Damızlık / besi ayır</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
        Damızlık seçilmeyen kuzular besi yoluna alınır (satın alınan kuzularla aynı aşı ve tartım adımları).
      </Text>
      {kuzular.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>Ayırılacak süt kuzusu yok.</Text>
      ) : (
        <>
          <View style={styles.chips}>
            {kuzular.slice(0, 20).map((k) => {
              const aktif = secili.has(k.id);
              const h = hedef[k.id];
              return (
                <Pressable
                  key={k.id}
                  onPress={() => toggle(k.id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: aktif ? colors.tint : colors.border,
                      backgroundColor: aktif ? colors.tint : colors.background,
                    },
                  ]}>
                  <Text style={{ color: aktif ? '#fff' : colors.text, fontSize: 11, fontWeight: '700' }}>
                    {hayvanAnaEtiket(k)}
                    {h === 'damizlik' ? ' · D' : h === 'besi' ? ' · B' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.row}>
            <AnaButon
              title="Damızlık işaretle"
              onPress={async () => {
                if (!seciliIds.length) {
                  Alert.alert('Seçim', 'Kuzu seçin');
                  return;
                }
                await setKuzuYonHedefBulk(seciliIds, 'damizlik');
                await load();
                onDegisti();
              }}
            />
            <AnaButon
              title="Besiye al"
              onPress={async () => {
                if (!seciliIds.length) {
                  Alert.alert('Seçim', 'Kuzu seçin');
                  return;
                }
                const n = await besiyeAlKuzular(seciliIds);
                await load();
                onDegisti();
                Alert.alert('Tamam', `${n} kuzu besi yoluna alındı`);
              }}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  row: { gap: 8 },
});
