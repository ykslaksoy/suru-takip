import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { bulutOrtamBekle } from '@/kaynak/bulut/ayar';
import { getSenkronBekleyenSayisi } from '@/kaynak/bulut/bekleyen-sayim';
import { bulutSenkronKapsamOzeti } from '@/kaynak/bulut/kapsam';
import { isleSenkronKuyrugu, senkronDurumOzet } from '@/kaynak/cekirdek/senkron-motor';

export function SenkronDurumu() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh, refreshKey, pendingSync } = useDatabase();
  const [ozet, setOzet] = useState('Yükleniyor…');
  const [bekleyen, setBekleyen] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [, n, o] = await Promise.all([bulutOrtamBekle(), getSenkronBekleyenSayisi(), senkronDurumOzet()]);
    setBekleyen(n);
    setOzet(o);
    if (n !== pendingSync) refresh();
  }, [pendingSync, refresh]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const senkronla = async () => {
    setBusy(true);
    try {
      const sonuc = await isleSenkronKuyrugu();
      refresh();
      await load();
      Alert.alert('Senkron', sonuc.mesaj);
    } finally {
      setBusy(false);
    }
  };

  const bekleyenGoster = bekleyen ?? pendingSync;

  return (
    <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Veri ve senkron</Text>
      <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>{ozet}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 18 }}>
        {bulutSenkronKapsamOzeti()}
      </Text>
      <Text style={{ color: colors.text, marginTop: 8, fontWeight: '700' }}>
        Bekleyen kuyruk satırı: {bekleyenGoster}
        {bekleyen !== null && bekleyen !== pendingSync ? (
          <Text style={{ fontWeight: '400', color: colors.textSecondary, fontSize: 12 }}>
            {' '}
            (üst çip {pendingSync} — sayıları eşitlemek için yenilendi)
          </Text>
        ) : null}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
        Bu sayı stok satırı değil; gönderim kuyruğu. Sürü/stok listeleri cihazınızda kalır.
      </Text>
      <View style={{ marginTop: 10, gap: 8 }}>
        <AnaButon
          title={busy ? 'İşleniyor…' : 'Kuyruğu işle'}
          onPress={senkronla}
          disabled={busy || bekleyenGoster === 0}
        />
        <Pressable onPress={() => router.push('/bulut' as never)} accessibilityRole="link">
          <Text style={{ color: colors.tint, fontWeight: '700', textAlign: 'center' }}>Bulut girişi ve eşitleme →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  title: { fontWeight: '800', marginBottom: 6 },
});
