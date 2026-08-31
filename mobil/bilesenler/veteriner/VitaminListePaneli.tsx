/**
 * Vitamin listesi — açıklama önde, ürün/iğne parantezde küçük:
 * Kas · beyaz kas hastalığı (Selenyum + E) sabit 1 ml
 */

import { StyleSheet, Text, View } from 'react-native';
import { AsiBaslikSatir } from '@/bilesenler/veteriner/AsiBaslikSatir';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import Colors from '@/sabitler/Renkler';
import {
  VITAMIN_PROGRAMI,
  vitaminDozEtiketi,
  vitaminTipEtiket,
} from '@/kaynak/akilli-veteriner/vitamin-programi';

export function VitaminListePaneli() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.kok}>
      <Text style={[styles.baslik, { color: colors.text }]}>Vitamin ve destek listesi</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 10 }}>
        Hayvan başına tipik ml — şişe etiketine ve veteriner talimatına uyun. Koyun için bazı ürünlerde doz
        artar.
      </Text>

      <View style={[styles.bilgi, { backgroundColor: colors.tint + '12', borderColor: colors.tint }]}>
        <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 4 }}>Sabit ml notu</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
          İğne ve ağızdan verilenler hayvan başına ml ile yazılır (antibiyotik gibi kg hesabı değil). Yem
          takviyelerinde karışım oranına bakın.
        </Text>
      </View>

      {VITAMIN_PROGRAMI.map((v) => (
        <View key={v.id} style={[styles.kart, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.ust}>
            <View style={{ flex: 1 }}>
              <AsiBaslikSatir
                koruma={v.detay}
                asiAdi={`${v.ad} · ${vitaminTipEtiket(v.uygulama)}`}
                mlEtiket={vitaminDozEtiketi(v)}
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
