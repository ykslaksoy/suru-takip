import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SesDinlemeDurumu } from '@/kaynak/ses/dinleme-durumu';
import { dinlemeDurumuEtiket, dinlemeErisilebilirOzet } from '@/kaynak/ses/dinleme-durumu';

type Props = {
  durum: SesDinlemeDurumu;
  cubuklar: number[];
  seviyeOlcumVar: boolean;
  reducedMotion: boolean;
  tint: string;
  border: string;
  text: string;
  textSecondary: string;
  warning: string;
};

export function SesDinlemeGostergesi({
  durum,
  cubuklar,
  seviyeOlcumVar,
  reducedMotion,
  tint,
  border,
  text,
  textSecondary,
  warning,
}: Props) {
  const erisilebilir = useMemo(() => dinlemeErisilebilirOzet(durum, seviyeOlcumVar), [durum, seviyeOlcumVar]);
  const gosterCubuk = seviyeOlcumVar && durum !== 'durdu' && durum !== 'hata' && durum !== 'izin_istek';
  const aktif = durum === 'dinliyor' || durum === 'ses_algilandi' || durum === 'isleniyor';

  return (
    <View
      style={[styles.kutu, { borderColor: border, backgroundColor: 'transparent' }]}
      accessibilityRole="summary"
      accessibilityLabel={erisilebilir}
      accessibilityLiveRegion="polite">
      <Text style={[styles.baslik, { color: text }]} accessibilityRole="header">
        Mikrofon durumu
      </Text>
      <Text style={{ color: textSecondary, fontSize: 13, marginBottom: 8 }}>{erisilebilir}</Text>
      {!seviyeOlcumVar && aktif ? (
        <Text style={{ color: warning, fontSize: 12, marginBottom: 6 }}>
          Canlı ses çubuğu bu ortamda kullanılamıyor (yalnızca tanıma veya metin girişi).
        </Text>
      ) : null}
      {gosterCubuk ? (
        <View
          style={styles.cubukSatir}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {cubuklar.map((seviye, i) => {
            const h = reducedMotion ? (seviye > 0.12 ? 14 : 4) : 4 + seviye * 28;
            const op = durum === 'isleniyor' ? 0.45 : 0.35 + seviye * 0.65;
            return (
              <View
                key={i}
                style={[
                  styles.cubuk,
                  {
                    height: h,
                    backgroundColor: tint,
                    opacity: op,
                  },
                ]}
              />
            );
          })}
        </View>
      ) : durum === 'izin_istek' ? (
        <Text style={{ color: textSecondary, fontSize: 12 }}>{dinlemeDurumuEtiket('izin_istek')}…</Text>
      ) : null}
      {durum === 'ses_algilandi' ? (
        <Text style={{ color: textSecondary, fontSize: 11, marginTop: 6 }}>
          Çubuklar yalnızca ses seviyesini gösterir; tanınan metin aşağıda «Algılanan» satırında görünür.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kutu: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12 },
  baslik: { fontWeight: '700', fontSize: 13, marginBottom: 4 },
  cubukSatir: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    minHeight: 36,
  },
  cubuk: { width: 6, borderRadius: 2, minHeight: 4 },
});
