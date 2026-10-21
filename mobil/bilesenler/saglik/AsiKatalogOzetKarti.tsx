import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { TakviyeKatalogOzeti } from '@/kaynak/saglik/asi-katalog';

type Props = {
  ozet: TakviyeKatalogOzeti;
  /** Görev detayında “kataloga git” linki */
  katalogLink?: boolean;
  compact?: boolean;
};

export function AsiKatalogOzetKarti({ ozet, katalogLink, compact }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const tipEtiket =
    ozet.tip === 'vitamin' ? 'Vitamin' : ozet.tip === 'parazit' ? 'Parazit' : 'Aşı';

  return (
    <View
      style={[
        styles.kart,
        compact && styles.kartCompact,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}>
      <Text style={[styles.tip, { color: colors.tint }]}>{tipEtiket} · katalog</Text>
      <Text style={[styles.baslik, { color: colors.text }]}>
        {ozet.baslik}
        <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}> ({ozet.urunAdi})</Text>
      </Text>
      <Text style={[styles.satir, { color: colors.text }]}>Doz ve yer: {ozet.dozYerEtiket}</Text>
      <Text style={[styles.satir, { color: colors.textSecondary }]}>
        Stok: {ozet.stokMiktar} {ozet.stokBirim}
        {ozet.stokAdi ? ` · ${ozet.stokAdi}` : ' · stok kaydı yok'}
      </Text>
      {ozet.gerekenDoz > 0 ? (
        <Text style={[styles.satir, { color: ozet.stokYeterli ? colors.textSecondary : colors.danger }]}>
          Plan için gerekli: {ozet.gerekenDoz} doz
          {ozet.yapilacakSayisi > 0 ? ` · ${ozet.yapilacakSayisi} kuzu yapılacak` : ''}
          {ozet.yaklasanSayisi > 0 ? ` · ${ozet.yaklasanSayisi} yaklaşan` : ''}
          {!ozet.stokYeterli ? ` · eksik ${ozet.eksikDoz}` : ''}
        </Text>
      ) : null}
      <Text style={[styles.satir, { color: colors.textSecondary }]}>
        Son uygulama (sürü): {ozet.sonUygulamaEtiket}
      </Text>
      {ozet.devletNotu ? (
        <Text style={[styles.not, { color: colors.tint }]}>{ozet.devletNotu}</Text>
      ) : null}
      {ozet.neZaman ? (
        <Text style={[styles.not, { color: colors.textSecondary }]}>{ozet.neZaman}</Text>
      ) : null}
      {katalogLink ? (
        <Pressable
          onPress={() => router.push(`/gorevler/asi/katalog/${ozet.programId}` as never)}
          style={{ marginTop: 10 }}>
          <Text style={{ color: colors.tint, fontWeight: '800' }}>Tam katalog kartı →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kart: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 14 },
  kartCompact: { marginBottom: 10, padding: 12 },
  tip: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  baslik: { fontSize: 17, fontWeight: '800', lineHeight: 22 },
  satir: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  not: { fontSize: 12, lineHeight: 18, marginTop: 8, fontWeight: '600' },
});
