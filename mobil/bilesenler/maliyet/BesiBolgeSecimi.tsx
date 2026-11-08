import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ilIcinOneriler,
  UKON_MAKRO_ETIKET,
  ukonKaynakFromMakro,
  varsayilanBolgeTaslak,
  type IsletmeBolgeTaslak,
} from '@/kaynak/maliyet/besi-plan-bolge-tipler';
import { SATIS_KAYNAK_META, type PiyasaSatisKaynak } from '@/kaynak/maliyet/besi-plan-piyasa-kaynak';

type Colors = { text: string; textSecondary: string; border: string; tint: string; warning: string };

export function BesiBolgeSecimi({
  taslak,
  onChange,
  colors,
  planKilitli,
}: {
  taslak: IsletmeBolgeTaslak;
  onChange: (t: IsletmeBolgeTaslak) => void;
  colors: Colors;
  planKilitli: boolean;
}) {
  const oneri = ilIcinOneriler(taslak.ilEtiket);

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 6 }}>İşletme bölgesi / satış referansı</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 6 }}>
        İl ve ırk ayrı. Resmi kaynak yoksa «İl/bölge varsayım» + ₺/kg girin — 0 veya başka il fiyatı kullanılmaz.
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>İşletme ili / bölge (serbest)</Text>
      <TextInput
        editable={!planKilitli}
        value={taslak.ilEtiket}
        onChangeText={(v) => {
          const o = ilIcinOneriler(v);
          onChange({
            ...taslak,
            ilEtiket: v,
            ukonMakroOneri: o.ukon,
          });
        }}
        placeholder="ör. Balıkesir, Gaziantep"
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      {oneri.not.map((n) => (
        <Text key={n} style={{ color: colors.warning, fontSize: 10 }}>
          · {n}
        </Text>
      ))}
      {oneri.ukon ? (
        <Pressable
          disabled={planKilitli}
          onPress={() =>
            onChange({
              ...taslak,
              ukonMakroOneri: oneri.ukon,
              satisKaynak: ukonKaynakFromMakro(oneri.ukon!),
            })
          }
          style={{ marginTop: 6 }}>
          <Text style={{ color: colors.tint, fontSize: 11, fontWeight: '700' }}>
            Önerilen UKON karkas seç (elle): {UKON_MAKRO_ETIKET[oneri.ukon]}
          </Text>
        </Pressable>
      ) : null}

      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 8 }}>Satış fiyat kaynağı</Text>
      <View style={styles.row}>
        {SATIS_KAYNAK_META.map((s) => (
          <Chip
            key={s.kod}
            aktif={taslak.satisKaynak === s.kod || (s.kod === 'ukon_ortalama' && taslak.satisKaynak === 'ukon')}
            label={s.etiket}
            disabled={planKilitli}
            onPress={() => onChange({ ...taslak, satisKaynak: s.kod })}
            colors={colors}
          />
        ))}
      </View>

      {(taslak.satisKaynak === 'kullanici_bolge_fiyat' || taslak.satisKaynak === 'kullanici_senaryo') && (
        <>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
            Planlama varsayımı ₺/kg — gelecek fiyat garantisi yok
          </Text>
          <TextInput
            editable={!planKilitli}
            value={taslak.kullaniciSatisKg != null ? String(taslak.kullaniciSatisKg) : ''}
            keyboardType="decimal-pad"
            onChangeText={(v) => {
              const t = v.trim();
              const n = t === '' ? null : parseFloat(t.replace(',', '.'));
              onChange({ ...taslak, kullaniciSatisKg: n != null && Number.isFinite(n) ? n : null });
            }}
            placeholder="boş = hesap yok"
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
        </>
      )}
    </View>
  );
}

function Chip({
  aktif,
  label,
  onPress,
  disabled,
  colors,
}: {
  aktif: boolean;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  colors: Colors;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        padding: 6,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 4,
        maxWidth: '48%',
        borderColor: aktif ? colors.tint : colors.border,
        backgroundColor: aktif ? `${colors.tint}18` : 'transparent',
      }}>
      <Text style={{ color: colors.text, fontSize: 9 }}>{label}</Text>
    </Pressable>
  );
}

export { varsayilanBolgeTaslak };
export type { IsletmeBolgeTaslak, PiyasaSatisKaynak };

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 14, marginTop: 4, marginBottom: 4 },
});
