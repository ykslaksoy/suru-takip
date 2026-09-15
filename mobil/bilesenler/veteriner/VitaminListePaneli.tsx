/**
 * Vitamin listesi — açıklama önde, ürün/iğne parantezde küçük:
 * Kas · beyaz kas hastalığı (Selenyum-E) her kuzuya 1 ml
 */

import { StyleSheet, Text, View } from 'react-native';
import { AsiBaslikSatir } from '@/bilesenler/veteriner/AsiBaslikSatir';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import Colors from '@/sabitler/Renkler';
import {
  VITAMIN_PROGRAMI,
  vitaminMlDozYerEtiketi,
  vitaminTipEtiket,
} from '@/kaynak/akilli-veteriner/vitamin-programi';

export function VitaminListePaneli() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.kok}>
      <Text style={[styles.baslik, { color: colors.text }]}>Vitamin ve destek listesi</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 10 }}>
        Doz, tartıdan sonra gerçek kiloya göre. Tartı yoksa geçici ~20 kg (gelenler ~17–24 kg). Emin değilsen ilacın kutusuna ve veterinere bak.
      </Text>

      <View style={[styles.bilgi, { backgroundColor: colors.tint + '12', borderColor: colors.tint }]}>
        <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 4 }}>Her kuzuya ml</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
          İğne ve ağızdan verilenler genelde her kuzuya ml ile yazılır. Yem takviyelerinde karışım oranına
          bakın.
        </Text>
      </View>

      {VITAMIN_PROGRAMI.map((v) => (
        <View key={v.id} style={[styles.kart, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.ust}>
            <View style={{ flex: 1 }}>
              <AsiBaslikSatir
                koruma={v.detay}
                asiAdi={`${v.ad} · ${vitaminTipEtiket(v.uygulama)}`}
                mlEtiket={vitaminMlDozYerEtiketi(v, { dozNo: 1, toplamDoz: 1 })}
              />
            </View>
          </View>
          {v.dozNotu && v.mlHayvan != null ? (
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 16 }}>
              Not: {v.dozNotu}
            </Text>
          ) : null}
          <Text style={{ color: colors.text, fontSize: 13, marginTop: 6, lineHeight: 19 }}>{v.neZaman}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { marginTop: 4, marginBottom: 8 },
  baslik: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  bilgi: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  kart: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  ust: { flexDirection: 'row', alignItems: 'flex-start' },
});
