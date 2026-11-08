import { StyleSheet, Text, View } from 'react-native';
import { BESI_DIYET_TASLAKLARI, rasyonBeslemeAktifEdilebilirMi, taslakDiyetKarsilastirmaUyarisi } from '@/kaynak/maliyet/besi-taslak-diyet';

export function BesiDiyetTaslakPaneli({ colors, hedefGun }: { colors: { text: string; textSecondary: string; border: string; warning: string }; hedefGun: number }) {
  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 6 }}>Diyet modelleri (doğrulanmamış taslak)</Text>
      {taslakDiyetKarsilastirmaUyarisi(hedefGun).map((u) => (
        <Text key={u} style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
          · {u}
        </Text>
      ))}
      {BESI_DIYET_TASLAKLARI.map((d) => {
        const engel = rasyonBeslemeAktifEdilebilirMi(d);
        return (
          <Text key={d.id} style={{ color: engel.aktif ? colors.text : colors.warning, fontSize: 12, marginTop: 4 }}>
            {d.ad} — {engel.aktif ? 'aktif edilebilir' : engel.sebep}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12, marginBottom: 8 },
});
