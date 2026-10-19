/** Kuzu kartında son fotoğraflar şeridi → galeri */
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { getFotolar } from '@/kaynak/galeri/depo';
import type { FotoKaydi } from '@/kaynak/galeri/hesap';
import { FotoKare } from './FotoKare';

export function KuzuFotoSeridi({ animalId }: { animalId: string }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [l, setL] = useState<FotoKaydi[]>([]);
  useFocusEffect(
    useCallback(() => {
      void getFotolar(animalId).then(setL).catch(() => setL([]));
    }, [animalId]),
  );
  const git = () => router.push(`/hayvan/${animalId}/galeri` as never);
  return (
    <View style={[styles.kutu, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={git} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: l.length ? 8 : 0 }}>
        <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 16, flex: 1 }}>📷 Fotoğraflar{l.length ? ` (${l.length})` : ''}</Text>
        <Text style={{ color: colors.tint, fontWeight: '700' }}>{l.length ? 'Tümü ›' : '+ Ekle'}</Text>
      </Pressable>
      {l.length ? (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {l.slice(0, 4).map((f) => (
            <Pressable key={f.id} onPress={git}>
              <FotoKare f={f} boyut="kucuk" stil={{ width: 72, height: 72, borderRadius: 10 }} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kutu: { marginHorizontal: 16, marginTop: 10, borderWidth: 1, borderRadius: 14, padding: 12 },
});
