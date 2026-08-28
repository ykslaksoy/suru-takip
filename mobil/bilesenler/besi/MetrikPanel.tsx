import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { hesaplaMod1MetrikRapor, type Mod1MetrikRapor } from '@/kaynak/besi-ortak/metrik-rapor';
import { adgDeger, fcrDeger, terim } from '@/sabitler/Metinler';

export function MetrikPanel() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [rapor, setRapor] = useState<Mod1MetrikRapor | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRapor(await hesaplaMod1MetrikRapor());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <ActivityIndicator style={{ marginVertical: 16 }} color={colors.tint} />;
  }

  if (!rapor) {
    return (
      <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
        Metrik raporu için sürüye hayvan ve tartım kaydı ekleyin.
      </Text>
    );
  }

  return (
    <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.tint }]}>
      <Text style={[styles.title, { color: colors.text }]}>Besi metrik raporu</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>
        {rapor.hayvanSayisi} hayvan · Mod 1
      </Text>
      <Info label={terim('ADG')} value={rapor.ortalamaAdg != null ? adgDeger(rapor.ortalamaAdg) : '—'} colors={colors} />
      <Info label={terim('FCR')} value={rapor.ortalamaFcr != null ? fcrDeger(rapor.ortalamaFcr) : '—'} colors={colors} />
      <Info
        label="Öneri yem / hayvan"
        value={rapor.oneriGunlukYemKg != null ? `${rapor.oneriGunlukYemKg} kg/gün` : '—'}
        colors={colors}
      />
      <Info
        label="Gerçek yem / hayvan"
        value={rapor.gercekGunlukYemKg != null ? `${rapor.gercekGunlukYemKg} kg/gün` : '—'}
        colors={colors}
      />
      <Info
        label="Tahmini günlük maliyet"
        value={rapor.tahminiGunlukMaliyet != null ? `${rapor.tahminiGunlukMaliyet} ₺` : '—'}
        colors={colors}
      />
      <Text style={{ color: colors.text, marginTop: 10, fontWeight: '700' }}>{rapor.karsilastirmaOzet}</Text>
      {rapor.notlar.map((n) => (
        <Text key={n} style={{ color: colors.textSecondary, marginTop: 4, fontSize: 13 }}>
          • {n}
        </Text>
      ))}
    </View>
  );
}

function Info({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.textSecondary, flex: 1 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  title: { fontWeight: '800', fontSize: 16 },
  row: { flexDirection: 'row', paddingVertical: 4 },
});
