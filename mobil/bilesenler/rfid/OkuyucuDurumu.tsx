import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { rfidDurum, rfidDurumEtiket, rfidSimulasyonMu } from '@/kaynak/rfid';

/** RFID okuyucu durumu — simülasyon / BLE */
export function OkuyucuDurumu() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const durum = rfidDurum();
  const sim = rfidSimulasyonMu();

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 4 }}>RFID / GEKİS okuyucu</Text>
      <Text style={{ color: colors.text, fontWeight: '700' }}>{rfidDurumEtiket(durum)}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
        {sim
          ? 'Simülasyon açık — “Küpe okut” rastgele / örnek etiket üretir. Gerçek BLE okuyucu bağlanınca aynı API kullanılır.'
          : 'Okuyucu kapalı. Donanım eşleştirmesi sonraki sürümde.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
});
