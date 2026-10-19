/**
 * Basit fiyat sorusu: tek sayı alanı + Kaydet + "Bilmiyorum / Geç".
 * Önerilen (tahmini) değer yer tutucuda görünür. Hiçbir akışı engellemez.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { fiyatMetniOku } from '@/kaynak/maliyet/tahmini-fiyat';

export function FiyatSorKarti({
  baslik,
  birim,
  oneri,
  altMetin,
  onKaydet,
  onGec,
}: {
  baslik: string;
  birim: string;
  /** Yer tutucu — tahmini fiyat */
  oneri?: string;
  altMetin?: string;
  onKaydet: (fiyat: number) => void | Promise<void>;
  onGec: () => void | Promise<void>;
}) {
  const colors = Colors[useColorScheme() ?? 'light'];
  const [metin, setMetin] = useState('');
  const fiyat = fiyatMetniOku(metin);
  return (
    <View style={[styles.kart, { borderColor: colors.tint, backgroundColor: colors.card }]}>
      <Text style={{ color: colors.text, fontWeight: '800' }}>{baslik}</Text>
      {altMetin ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{altMetin}</Text> : null}
      <View style={styles.satir}>
        <TextInput
          value={metin}
          onChangeText={setMetin}
          keyboardType="decimal-pad"
          placeholder={oneri ? `${oneri} (önerilen)` : `₺/${birim}`}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          accessibilityLabel={`${baslik} ₺/${birim}`}
        />
        <Text style={{ color: colors.textSecondary }}>₺/{birim}</Text>
      </View>
      <View style={styles.satir}>
        <Pressable
          disabled={fiyat == null}
          onPress={() => fiyat != null && void onKaydet(fiyat)}
          style={[styles.btn, { backgroundColor: fiyat == null ? colors.border : colors.tint }]}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Kaydet</Text>
        </Pressable>
        <Pressable onPress={() => void onGec()} style={[styles.btn, { borderWidth: 1, borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Bilmiyorum / Geç</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kart: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 16, minWidth: 0 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
});
