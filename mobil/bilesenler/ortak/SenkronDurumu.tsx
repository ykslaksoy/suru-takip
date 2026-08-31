import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { getPendingSyncCount } from '@/kaynak/cekirdek/veritabani';
import { isleSenkronKuyrugu, senkronDurumOzet } from '@/kaynak/cekirdek/senkron-motor';

export function SenkronDurumu() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh, refreshKey } = useDatabase();
  const [ozet, setOzet] = useState('');
  const [bekleyen, setBekleyen] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBekleyen(await getPendingSyncCount());
    setOzet(await senkronDurumOzet());
  }, []);

  useEffect(() => {
    load();
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

  return (
    <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Veri ve senkron</Text>
      <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>{ozet}</Text>
      <Text style={{ color: colors.text, marginTop: 8, fontWeight: '700' }}>
        Bekleyen: {bekleyen}
      </Text>
      <View style={{ marginTop: 10 }}>
        <AnaButon title={busy ? 'İşleniyor…' : 'Kuyruğu işle'} onPress={senkronla} disabled={busy || bekleyen === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  title: { fontWeight: '800', marginBottom: 6 },
});
