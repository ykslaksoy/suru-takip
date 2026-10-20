import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';
import { BesiUfukSecici } from '@/bilesenler/hizli-kuzu/BesiUfukSecici';
import {
  besiUfukGunOku,
  olusturBesiGorevZamanCizelgesi,
  type BesiProgramGorevSatir,
} from '@/kaynak/besi-programi';
import { gunEtiket as gunEtiketPlan } from '@/kaynak/akilli-veteriner/hizli-besi-plani';

/** Besi programı önizleme — seçilen ufka göre görev zaman çizelgesi */
export default function BesiProgramiScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { scrollPadBottom } = useAltGuvenliBosluk(72);
  const [satirlar, setSatirlar] = useState<BesiProgramGorevSatir[]>([]);
  const [ufuk, setUfuk] = useState(90);

  const yenile = useCallback(async (gun?: number) => {
    const u = gun ?? (await besiUfukGunOku());
    setUfuk(u);
    setSatirlar(olusturBesiGorevZamanCizelgesi({ ufukGun: u }));
  }, []);

  useEffect(() => {
    void yenile();
  }, [yenile]);

  const gunGruplari = satirlar.reduce<Map<number, BesiProgramGorevSatir[]>>((m, s) => {
    const list = m.get(s.gun) ?? [];
    list.push(s);
    m.set(s.gun, list);
    return m;
  }, new Map());

  return (
    <>
      <Stack.Screen options={{ title: 'Besi programı' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollPadBottom }]}>
        <BesiUfukSecici
          colors={colors}
          onDegisti={(g) => {
            void yenile(g);
          }}
        />

        <Text style={[styles.lead, { color: colors.text }]}>
          Görev zaman çizelgesi (~{ufuk} gün)
        </Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          HIZLI_BESI_TAKVIM minimum standart — mevcut Görevler ekranına bağlı.
        </Text>

        {[...gunGruplari.entries()]
          .sort(([a], [b]) => a - b)
          .map(([gun, items]) => (
            <View key={gun} style={[styles.gunKutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.gunBaslik, { color: colors.tint }]}>{gunEtiketPlan(gun)}</Text>
              {items.map((s) => (
                <View key={`${s.programId}-${s.tip}`} style={styles.satir}>
                  <Text style={[styles.satirBaslik, { color: colors.text }]}>{s.baslik}</Text>
                  <Text style={[styles.satirNot, { color: colors.textSecondary }]} numberOfLines={2}>
                    {s.planTarih} · {s.not}
                  </Text>
                </View>
              ))}
            </View>
          ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  lead: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  gunKutu: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  gunBaslik: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  satir: { marginBottom: 8 },
  satirBaslik: { fontSize: 15, fontWeight: '700' },
  satirNot: { fontSize: 13, lineHeight: 18, marginTop: 2 },
});
