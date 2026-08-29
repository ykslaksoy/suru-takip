import { StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { AsiMalzemeListesi } from '@/kaynak/akilli-veteriner/asi-malzeme';

type Props = {
  liste: AsiMalzemeListesi;
  onPaylas?: () => void;
};

export function AsiMalzemePaneli({ liste, onPaylas }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  if (liste.satirlar.length === 0) {
    return (
      <View style={[styles.wrap, { borderColor: colors.border }]}>
        <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 6 }}>Malzeme listesi</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>{liste.ozet}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { borderColor: colors.tint, backgroundColor: colors.tint + '08' }]}>
      <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 4 }}>Malzeme listesi</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 10 }}>
        {liste.kaynak === 'plan' ? 'Planlanan aşılara göre' : 'Seçilen aşılara göre'} · {liste.kuzuSayisi}{' '}
        kuzu
      </Text>

      {liste.satirlar.map((s) => (
        <View key={s.programId} style={[styles.satir, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>
            {s.koruma}{' '}
            <Text style={{ fontSize: 10, fontWeight: '400', color: colors.textSecondary }}>({s.asiAdi})</Text>
          </Text>
          <Text style={{ color: colors.tint, fontWeight: '700', marginTop: 2 }}>{s.mlEtiket}</Text>
          <Text style={{ color: colors.text, fontSize: 13, marginTop: 4, lineHeight: 19 }}>{s.durumMetni}</Text>
          {s.tarih ? (
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>Tarih: {s.tarih}</Text>
          ) : null}
          <Text
            style={{
              color: s.eksikDoz > 0 ? colors.danger : colors.success,
              fontSize: 12,
              fontWeight: '700',
              marginTop: 4,
            }}>
            {s.eksikDoz > 0
              ? `Eksik ${s.eksikDoz} doz` +
                (s.eksikMl != null ? ` · al ≈ ${String(s.eksikMl).replace('.', ',')} ml` : '')
              : s.stokAdi
                ? `Stok yeterli (${s.stokMiktar} doz)`
                : 'Stok kaydı yok — ekleyin'}
          </Text>
        </View>
      ))}

      <Text style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>
        Şırınga tahmini: {liste.siringaAdedi} adet
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
        (Her enjeksiyon için 1 — çizik / hap / oral parazit hariç)
      </Text>

      {onPaylas ? <AnaButon title="Listeyi kopyala / paylaş" variant="secondary" onPress={onPaylas} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 14, marginBottom: 8 },
  satir: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
});
