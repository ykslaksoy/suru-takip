import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AsiStokMeta, MetaKaynak } from '@/kaynak/stok/asi-urun-meta';

export function AsiStokMetaFormu({
  meta,
  onChange,
  colors,
}: {
  meta: AsiStokMeta;
  onChange: (m: AsiStokMeta) => void;
  colors: { text: string; textSecondary: string; border: string; tint: string; card: string };
}) {
  const kaynakChips = (alan: 'etiketKapsamKaynak' | 'etiketDozKaynak', label: string) => (
    <View style={{ marginTop: 6 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {(['bilinmiyor', 'etiket_manuel'] as MetaKaynak[]).map((k) => (
          <Pressable
            key={k}
            onPress={() => onChange({ ...meta, [alan]: k })}
            style={[styles.chip, { borderColor: meta[alan] === k ? colors.tint : colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 11 }}>{k === 'etiket_manuel' ? 'Etiketten girdim' : 'Bilinmiyor'}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 6 }}>Aşı ürün etiketi (elle)</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
        Katalog satırı şablondur. Şişedeki marka, lot ve doz metnini ürün etiketinden girin — sistem uydurmaz.
      </Text>
      <Alan label="Marka" value={meta.marka ?? ''} onChange={(v) => onChange({ ...meta, marka: v || null })} colors={colors} />
      <Alan label="Ürün adı (etiket)" value={meta.urunAdi ?? ''} onChange={(v) => onChange({ ...meta, urunAdi: v || null })} colors={colors} />
      <Alan
        label="Kapsam / antijen (etiket metni)"
        value={meta.etiketKapsam ?? ''}
        onChange={(v) => onChange({ ...meta, etiketKapsam: v || null })}
        colors={colors}
        multiline
      />
      {kaynakChips('etiketKapsamKaynak', 'Kapsam kaynağı')}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Alan
            label="Şişe hacmi"
            value={meta.siseHacim != null ? String(meta.siseHacim) : ''}
            keyboardType="decimal-pad"
            onChange={(v) => onChange({ ...meta, siseHacim: v ? parseFloat(v.replace(',', '.')) : null })}
            colors={colors}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Alan label="Hacim birimi" value={meta.siseHacimBirim ?? ''} onChange={(v) => onChange({ ...meta, siseHacimBirim: v || null })} colors={colors} placeholder="ml / doz" />
        </View>
      </View>
      <Alan label="Parti / lot" value={meta.partiLot ?? ''} onChange={(v) => onChange({ ...meta, partiLot: v || null })} colors={colors} />
      <Alan
        label="Etiket dozu / uygulama (kopyala-yapıştır)"
        value={meta.etiketDoz ?? ''}
        onChange={(v) => onChange({ ...meta, etiketDoz: v || null })}
        colors={colors}
        multiline
      />
      {kaynakChips('etiketDozKaynak', 'Doz kaynağı')}
      <Alan
        label="Etiket uygunluk (yaş, hayvan tipi…)"
        value={meta.etiketUygunluk ?? ''}
        onChange={(v) => onChange({ ...meta, etiketUygunluk: v || null })}
        colors={colors}
        multiline
      />
    </View>
  );
}

function Alan({
  label,
  value,
  onChange,
  colors,
  keyboardType,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: { text: string; border: string };
  keyboardType?: 'decimal-pad';
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder}
        style={[styles.input, { borderColor: colors.border, color: colors.text, minHeight: multiline ? 64 : 44 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15 },
});
