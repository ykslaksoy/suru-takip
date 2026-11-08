import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { parseKullaniciOndalikFiyat } from '@/kaynak/maliyet/besi-referans-parse';

type Colors = { text: string; textSecondary: string; border: string; tint: string };

export function OndalikFiyatGirdi({
  label,
  referans,
  referansEtiket,
  deger,
  onCommit,
  colors,
  birim = '₺/kg',
}: {
  label: string;
  referans: number | null;
  referansEtiket: string;
  deger: number | null;
  onCommit: (v: number | null, hata?: string) => void;
  colors: Colors;
  birim?: string;
}) {
  const [metin, setMetin] = useState(deger != null ? String(deger).replace('.', ',') : '');
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    setMetin(deger != null ? String(deger).replace('.', ',') : '');
  }, [deger]);

  const kaynak =
    deger != null ? 'override' : referans != null ? 'referans' : 'eksik';

  return (
    <View style={{ marginVertical: 6 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 10 }}>
        {referansEtiket}: {referans != null ? `${referans.toLocaleString('tr-TR')} ${birim}` : '—'}
        {kaynak === 'override' ? ' · kullanıcı' : kaynak === 'referans' ? ' · referans' : ' · eksik'}
      </Text>
      <TextInput
        value={metin}
        onChangeText={(t) => {
          setMetin(t);
          setHata(null);
        }}
        onBlur={() => {
          const p = parseKullaniciOndalikFiyat(metin);
          if (p === 'gecersiz_sifir') {
            setHata('0 geçersiz');
            onCommit(null, '0 geçersiz');
            return;
          }
          onCommit(p);
        }}
        keyboardType="decimal-pad"
        placeholder="Boş = referans"
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      {hata ? <Text style={{ color: '#c0392b', fontSize: 10 }}>{hata}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 4, fontSize: 14 },
});
