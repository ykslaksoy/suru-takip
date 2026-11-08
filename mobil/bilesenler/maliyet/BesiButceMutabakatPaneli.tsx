import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ButceTaslak } from '@/kaynak/maliyet/besi-plan-butce-tipler';
import type { ButceMutabakatSonuc } from '@/kaynak/maliyet/besi-plan-butce-hesap';
import { ornekButce12000, ornekButce12500 } from '@/kaynak/maliyet/besi-plan-butce-hesap';

type Colors = { text: string; textSecondary: string; border: string; tint: string; warning: string; card: string };

export function BesiButceMutabakatPaneli({
  taslak,
  sonuc,
  onChange,
  colors,
  planKilitli,
}: {
  taslak: ButceTaslak;
  sonuc: ButceMutabakatSonuc;
  onChange: (t: ButceTaslak) => void;
  colors: Colors;
  planKilitli: boolean;
}) {
  const satirGuncelle = (id: string, tutar: string) => {
    if (planKilitli) return;
    const n = tutar.trim() === '' ? null : parseFloat(tutar.replace(',', '.'));
    onChange({
      ...taslak,
      satirlar: taslak.satirlar.map((s) =>
        s.id === id
          ? {
              ...s,
              tutar: n != null && Number.isFinite(n) ? n : null,
              degerDurumu: tutar.trim() === '' ? ('bilinmiyor' as const) : ('tutar' as const),
              kaynak: 'kullanici_girdi' as const,
            }
          : s,
      ),
    });
  };

  const ortakGuncelle = (alan: keyof ButceTaslak['ortak'], v: string) => {
    if (planKilitli) return;
    const n = v.trim() === '' ? null : parseFloat(v.replace(',', '.'));
    onChange({ ...taslak, ortak: { ...taslak.ortak, [alan]: n != null && Number.isFinite(n) ? n : null } });
  };

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 6 }}>Bütçe mutabakatı (t344u)</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 8 }}>
        Kalemleri silmiyoruz — gereksiz olanları siz kaldırın veya 0 / bilinmiyor yapın. Yatırım ve damızlık işletme dengesine karışmaz.
      </Text>
      {!planKilitli ? (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <Pressable onPress={() => onChange(ornekButce12000())} style={[styles.btn, { borderColor: colors.tint }]}>
            <Text style={{ color: colors.tint, fontSize: 11 }}>Örnek 12.000 ₺/baş</Text>
          </Pressable>
          <Pressable onPress={() => onChange(ornekButce12500())} style={[styles.btn, { borderColor: colors.tint }]}>
            <Text style={{ color: colors.tint, fontSize: 11 }}>Örnek 12.500 (500×25)</Text>
          </Pressable>
        </View>
      ) : null}

      {taslak.satirlar
        .filter((s) => s.sinif === 'besi_isletme')
        .map((s) => (
          <View key={s.id} style={{ marginBottom: 6 }}>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{s.etiket} (₺/baş)</Text>
            <TextInput
              editable={!planKilitli}
              defaultValue={s.tutar != null ? String(s.tutar) : ''}
              keyboardType="decimal-pad"
              onEndEditing={(e) => satirGuncelle(s.id, e.nativeEvent.text)}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
          </View>
        ))}

      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>Kullanıcı iddia toplam maliyet (₺/baş)</Text>
      <TextInput
        editable={!planKilitli}
        defaultValue={taslak.kullaniciIddiaToplamMaliyet != null ? String(taslak.kullaniciIddiaToplamMaliyet) : ''}
        keyboardType="decimal-pad"
        onEndEditing={(e) => {
          const n = parseFloat(e.nativeEvent.text.replace(',', '.'));
          onChange({ ...taslak, kullaniciIddiaToplamMaliyet: Number.isFinite(n) ? n : null });
        }}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Satış gelir varsayımı (₺/baş)</Text>
      <TextInput
        editable={!planKilitli}
        defaultValue={taslak.satisGelirBas != null ? String(taslak.satisGelirBas) : ''}
        keyboardType="decimal-pad"
        onEndEditing={(e) => {
          const n = parseFloat(e.nativeEvent.text.replace(',', '.'));
          onChange({ ...taslak, satisGelirBas: Number.isFinite(n) ? n : null });
        }}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />

      <Text style={{ color: colors.text, fontWeight: '800', marginTop: 10 }}>Ortak gider (ham: {sonuc.ortakGiderHam?.toLocaleString('tr-TR') ?? '—'} ₺)</Text>
      {(['kira', 'coban', 'elektrik', 'digerToplam'] as const).map((k) => (
        <View key={k}>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
            {k === 'digerToplam' ? 'Diğer (toplu — kullanıcı)' : k}
          </Text>
          <TextInput
            editable={!planKilitli}
            defaultValue={taslak.ortak[k] != null ? String(taslak.ortak[k]) : ''}
            keyboardType="decimal-pad"
            onEndEditing={(e) => ortakGuncelle(k, e.nativeEvent.text)}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
        </View>
      ))}
      {sonuc.ortakEksik.map((e) => (
        <Text key={e} style={{ color: colors.warning, fontSize: 11 }}>
          · {e}
        </Text>
      ))}

      <View style={{ marginTop: 10 }}>
        <Text style={{ color: colors.text, fontWeight: '800' }}>Listelenen işletme: {Number.isFinite(sonuc.listelenenToplam) ? sonuc.listelenenToplam.toLocaleString('tr-TR') : 'eksik'} ₺/baş</Text>
        {sonuc.farkAciklama ? <Text style={{ color: colors.warning, fontSize: 12, marginTop: 4 }}>{sonuc.farkAciklama}</Text> : null}
        {sonuc.isletmeOncesiDenge != null ? (
          <Text style={{ color: colors.tint, fontWeight: '700', marginTop: 6 }}>
            {sonuc.dengeEtiket}: {sonuc.isletmeOncesiDenge.toLocaleString('tr-TR')} ₺/baş
          </Text>
        ) : null}
        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6 }}>{sonuc.nakitGereksinimNot}</Text>
        {sonuc.uyari.slice(0, 4).map((u) => (
          <Text key={u} style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>
            · {u}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 4, fontSize: 15 },
  btn: { borderWidth: 1, borderRadius: 8, padding: 8 },
});
