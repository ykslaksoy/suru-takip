/** Kuzu kartında ana/baba özeti → soy ağacı */
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { getAnimal } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';

export function KuzuSoyOzeti({ animal }: { animal: Animal }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [ad, setAd] = useState<{ ana: string | null; baba: string | null }>({ ana: null, baba: null });
  useFocusEffect(
    useCallback(() => {
      const al = async (x: string | null | undefined) => (x ? ((await getAnimal(x)) ?? null) : null);
      void Promise.all([al(animal.motherId), al(animal.fatherId)]).then(([a, b]) =>
        setAd({ ana: a ? hayvanAnaEtiket(a) : animal.motherId ? 'kayıtta yok' : null, baba: b ? hayvanAnaEtiket(b) : animal.fatherId ? 'kayıtta yok' : null }),
      );
    }, [animal.motherId, animal.fatherId]),
  );
  return (
    <Pressable
      onPress={() => router.push(`/hayvan/${animal.id}/soy` as never)}
      style={{ marginHorizontal: 16, marginTop: 10, borderWidth: 1, borderRadius: 14, padding: 12, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 16 }}>🌳 Soy ağacı</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
          Ana: {ad.ana ?? '—'} · Baba: {ad.baba ?? '—'}
        </Text>
      </View>
      <Text style={{ color: colors.tint, fontWeight: '700' }}>{animal.motherId || animal.fatherId ? 'Aç ›' : '+ Ekle'}</Text>
    </Pressable>
  );
}
