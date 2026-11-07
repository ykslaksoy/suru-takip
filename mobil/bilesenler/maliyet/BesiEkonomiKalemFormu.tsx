import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { BesiEkonomiKalem, AlisFiyatBaz, KalemDegerDurumu } from '@/kaynak/maliyet/besi-ekonomi-kalem';

export function BesiEkonomiKalemFormu({
  kalemler,
  onChange,
  colors,
}: {
  kalemler: BesiEkonomiKalem[];
  onChange: (k: BesiEkonomiKalem[]) => void;
  colors: { text: string; textSecondary: string; border: string; tint: string; card: string };
}) {
  const guncelle = (id: string, patch: Partial<BesiEkonomiKalem>) => {
    onChange(kalemler.map((k) => (k.id === id ? { ...k, ...patch } : k)));
  };

  const sayi = (m: string) => {
    const n = parseFloat(m.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };

  return (
    <View>
      {kalemler.map((k) => (
        <View key={k.id} style={[styles.satir, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>{k.etiket}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
            {k.kaynak === 'gercek_parti_maliyet' ? 'gerçek' : 'projeksiyon'} · {k.odeme}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {(['bilinmiyor', 'sifir', 'tutar'] as KalemDegerDurumu[]).map((d) => (
              <Pressable
                key={d}
                onPress={() => guncelle(k.id, { degerDurumu: d })}
                style={[styles.chip, { borderColor: k.degerDurumu === d ? colors.tint : colors.border }]}>
                <Text style={{ color: colors.text, fontSize: 11 }}>{d === 'tutar' ? '₺ girildi' : d}</Text>
              </Pressable>
            ))}
          </View>
          {k.kod === 'alis' ? (
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              {(['basina', 'canli_kg', 'parti_toplam'] as AlisFiyatBaz[]).map((b) => (
                <Pressable key={b} onPress={() => guncelle(k.id, { alisBaz: b })} style={styles.chip}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary }}>{b}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {k.degerDurumu === 'tutar' ? (
            <TextInput
              defaultValue={k.birimTutar != null ? String(k.birimTutar) : ''}
              keyboardType="decimal-pad"
              placeholder="Tutar"
              placeholderTextColor={colors.textSecondary}
              onEndEditing={(e) => guncelle(k.id, { birimTutar: sayi(e.nativeEvent.text), kaynak: 'projeksiyon' })}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  satir: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  input: { borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 6 },
});
