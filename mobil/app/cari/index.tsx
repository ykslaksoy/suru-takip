import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';
import {
  CARI_ISLEM_ETIKET,
  CARI_TUR_ETIKET,
  bakiyeEtiket,
  cariHesapEkle,
  cariIslemEkle,
  cariNetBakiye,
  listCariHesaplar,
  listCariIslemler,
  type CariHesap,
  type CariIslem,
  type CariIslemTur,
  type CariTur,
} from '@/kaynak/cari';

const TURLER: CariTur[] = ['yemci', 'tuccar', 'alici', 'veteriner', 'diger'];
const ISLEM_TURLER: CariIslemTur[] = ['borc', 'alis', 'odeme', 'tahsilat', 'vade'];

export default function CariEkrani() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { scrollPadBottom } = useAltGuvenliBosluk(72);
  const [hesaplar, setHesaplar] = useState<CariHesap[]>([]);
  const [islemler, setIslemler] = useState<CariIslem[]>([]);
  const [secili, setSecili] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [form, setForm] = useState({ ad: '', tur: 'diger' as CariTur, telefon: '', not: '' });
  const [islemForm, setIslemForm] = useState({
    tur: 'borc' as CariIslemTur,
    tutar: '',
    tarih: new Date().toISOString().slice(0, 10),
    not: '',
    vade: '',
  });

  const yenile = useCallback(async () => {
    setYukleniyor(true);
    const [h, i] = await Promise.all([listCariHesaplar(), listCariIslemler()]);
    setHesaplar(h);
    setIslemler(i);
    setYukleniyor(false);
  }, [secili]);

  useFocusEffect(
    useCallback(() => {
      void yenile();
    }, [yenile]),
  );

  const hesapBakiye = (id: string) => cariNetBakiye(islemler.filter((x) => x.cariId === id));

  return (
    <>
      <Stack.Screen options={{ title: 'Cari hesaplar' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: scrollPadBottom }}>
        <Text style={[styles.lead, { color: colors.text }]}>Cari hesaplar</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Borç, alış, ödeme ve tahsilat — yerel kayıt, bulut anahtarı sy_cari_hesaplar_v1.
        </Text>

        <View style={[styles.kutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.kutuBaslik, { color: colors.text }]}>Yeni cari</Text>
          <TextInput
            placeholder="Ad / firma"
            placeholderTextColor={colors.textSecondary}
            value={form.ad}
            onChangeText={(v) => setForm({ ...form, ad: v })}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <View style={styles.chipRow}>
            {TURLER.map((t) => (
              <Pressable
                key={t}
                onPress={() => setForm({ ...form, tur: t })}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: form.tur === t ? colors.tint : colors.background },
                ]}>
                <Text style={{ color: form.tur === t ? '#fff' : colors.text, fontSize: 12, fontWeight: '700' }}>
                  {CARI_TUR_ETIKET[t]}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            placeholder="Telefon"
            placeholderTextColor={colors.textSecondary}
            value={form.telefon}
            onChangeText={(v) => setForm({ ...form, telefon: v })}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <Pressable
            onPress={async () => {
              if (!form.ad.trim()) return;
              await cariHesapEkle(form);
              setForm({ ad: '', tur: 'diger', telefon: '', not: '' });
              await yenile();
            }}
            style={[styles.btn, { backgroundColor: colors.tint }]}>
            <Text style={styles.btnText}>Kaydet</Text>
          </Pressable>
        </View>

        {yukleniyor ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.tint} />
        ) : (
          <>
            {hesaplar.map((h) => {
              const bakiye = hesapBakiye(h.id);
              const acik = secili === h.id;
              return (
                <Pressable
                  key={h.id}
                  onPress={() => setSecili(acik ? null : h.id)}
                  style={[styles.kutu, { borderColor: acik ? colors.tint : colors.border, backgroundColor: colors.card }]}>
                  <Text style={[styles.kutuBaslik, { color: colors.text }]}>{h.ad}</Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {CARI_TUR_ETIKET[h.tur]}
                    {h.telefon ? ` · ${h.telefon}` : ''}
                  </Text>
                  <Text style={{ color: bakiye >= 0 ? colors.tint : '#c1121f', fontWeight: '800', marginTop: 6 }}>
                    {bakiyeEtiket(bakiye)}
                  </Text>
                </Pressable>
              );
            })}
          </>
        )}

        {secili ? (
          <View style={[styles.kutu, { borderColor: colors.border, backgroundColor: colors.card, marginTop: 12 }]}>
            <Text style={[styles.kutuBaslik, { color: colors.text }]}>İşlem ekle</Text>
            <View style={styles.chipRow}>
              {ISLEM_TURLER.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setIslemForm({ ...islemForm, tur: t })}
                  style={[
                    styles.chip,
                    { borderColor: colors.border, backgroundColor: islemForm.tur === t ? colors.tint : colors.background },
                  ]}>
                  <Text style={{ color: islemForm.tur === t ? '#fff' : colors.text, fontSize: 11, fontWeight: '700' }}>
                    {CARI_ISLEM_ETIKET[t]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              placeholder="Tutar ₺"
              keyboardType="decimal-pad"
              value={islemForm.tutar}
              onChangeText={(v) => setIslemForm({ ...islemForm, tutar: v })}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              placeholder="Tarih YYYY-MM-DD"
              value={islemForm.tarih}
              onChangeText={(v) => setIslemForm({ ...islemForm, tarih: v })}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            {islemForm.tur === 'vade' ? (
              <TextInput
                placeholder="Vade tarihi"
                value={islemForm.vade}
                onChangeText={(v) => setIslemForm({ ...islemForm, vade: v })}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              />
            ) : null}
            <Pressable
              onPress={async () => {
                const tutar = parseFloat(islemForm.tutar.replace(',', '.'));
                await cariIslemEkle({
                  cariId: secili,
                  tur: islemForm.tur,
                  tutar,
                  tarih: islemForm.tarih,
                  not: islemForm.not,
                  vadeTarihi: islemForm.vade || undefined,
                });
                setIslemForm({ ...islemForm, tutar: '', not: '' });
                await yenile();
              }}
              style={[styles.btn, { backgroundColor: colors.tint }]}>
              <Text style={styles.btnText}>İşlemi kaydet</Text>
            </Pressable>
            {islemler
              .filter((i) => i.cariId === secili)
              .slice(0, 8)
              .map((i) => (
                <View key={i.id} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>
                    {i.tarih} · {CARI_ISLEM_ETIKET[i.tur]} · {i.tutar} ₺
                  </Text>
                  {i.not ? <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{i.not}</Text> : null}
                </View>
              ))}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  kutu: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  kutuBaslik: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  btn: { padding: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' },
});
