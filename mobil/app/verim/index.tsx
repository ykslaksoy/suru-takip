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
  listVerimKayitlari,
  sutKaydiEkle,
  verimSutOzet,
  yapagiKaydiEkle,
  type VerimKayit,
  type VerimSutKayit,
} from '@/kaynak/verim';
import { addSagimKaydi } from '@/kaynak/sut/sagim';

type Sekme = 'sut' | 'yapagi';

export default function VerimEkrani() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { scrollPadBottom } = useAltGuvenliBosluk(72);
  const [sekme, setSekme] = useState<Sekme>('sut');
  const [kayitlar, setKayitlar] = useState<VerimKayit[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const bugun = new Date().toISOString().slice(0, 10);
  const [sutForm, setSutForm] = useState({
    tarih: bugun,
    sabah: '',
    aksam: '',
    tank: '',
    mod: 'tank' as 'tank' | 'bas',
    hayvan: '1',
    kalite: '',
    mod4Senkron: true,
  });
  const [yapagiForm, setYapagiForm] = useState({ tarih: bugun, bas: '', kg: '', not: '' });

  const yenile = useCallback(async () => {
    setYukleniyor(true);
    setKayitlar(await listVerimKayitlari());
    setYukleniyor(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void yenile();
    }, [yenile]),
  );

  const sutKayitlari = kayitlar.filter((k): k is VerimSutKayit => k.tur === 'sut');
  const ozet = verimSutOzet(sutKayitlari);

  return (
    <>
      <Stack.Screen options={{ title: 'Süt & yapağı verim' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: scrollPadBottom }}>
        <Text style={[styles.lead, { color: colors.text }]}>Verim kayıtları</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Günlük süt ve kırkım/yapağı — sy_verim_kayitlari_v1. Mod 4/5/7 süt akışı ile uyumlu.
        </Text>

        <View style={styles.sekmeRow}>
          {(['sut', 'yapagi'] as Sekme[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSekme(s)}
              style={[styles.sekme, { backgroundColor: sekme === s ? colors.tint : colors.card, borderColor: colors.border }]}>
              <Text style={{ color: sekme === s ? '#fff' : colors.text, fontWeight: '800' }}>
                {s === 'sut' ? 'Süt' : 'Yapağı'}
              </Text>
            </Pressable>
          ))}
        </View>

        {sekme === 'sut' ? (
          <View style={[styles.kutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
              Özet: {ozet.kayit} kayıt · {ozet.litre} L · ort {ozet.ortLBas ?? '—'} L/baş
            </Text>
            <TextInput
              placeholder="Tarih"
              value={sutForm.tarih}
              onChangeText={(v) => setSutForm({ ...sutForm, tarih: v })}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              placeholder="Sabah L"
              keyboardType="decimal-pad"
              value={sutForm.sabah}
              onChangeText={(v) => setSutForm({ ...sutForm, sabah: v })}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              placeholder="Akşam L"
              keyboardType="decimal-pad"
              value={sutForm.aksam}
              onChangeText={(v) => setSutForm({ ...sutForm, aksam: v })}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              placeholder="Tank toplam L (opsiyonel)"
              keyboardType="decimal-pad"
              value={sutForm.tank}
              onChangeText={(v) => setSutForm({ ...sutForm, tank: v })}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              placeholder="Sağmal hayvan sayısı"
              keyboardType="number-pad"
              value={sutForm.hayvan}
              onChangeText={(v) => setSutForm({ ...sutForm, hayvan: v })}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              placeholder="Kalite notu"
              value={sutForm.kalite}
              onChangeText={(v) => setSutForm({ ...sutForm, kalite: v })}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <Pressable
              onPress={async () => {
                const sabah = sutForm.sabah ? parseFloat(sutForm.sabah.replace(',', '.')) : null;
                const aksam = sutForm.aksam ? parseFloat(sutForm.aksam.replace(',', '.')) : null;
                const tank = sutForm.tank ? parseFloat(sutForm.tank.replace(',', '.')) : undefined;
                const kayit = await sutKaydiEkle({
                  tarih: sutForm.tarih,
                  sabahLitre: sabah,
                  aksamLitre: aksam,
                  toplamLitre: tank,
                  girisModu: tank && !sabah && !aksam ? 'tank' : 'bas',
                  hayvanSayisi: parseInt(sutForm.hayvan, 10) || 1,
                  kaliteNot: sutForm.kalite,
                });
                if (sutForm.mod4Senkron && kayit.toplamLitre > 0) {
                  await addSagimKaydi({
                    litre: kayit.toplamLitre,
                    hayvanSayisi: kayit.hayvanSayisi,
                    tarih: kayit.tarih,
                    notes: `Verim · ${kayit.kaliteNot || 'süt'}`,
                  });
                }
                setSutForm({ ...sutForm, sabah: '', aksam: '', tank: '', kalite: '' });
                await yenile();
              }}
              style={[styles.btn, { backgroundColor: colors.tint }]}>
              <Text style={styles.btnText}>Süt kaydı</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.kutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput
              placeholder="Tarih"
              value={yapagiForm.tarih}
              onChangeText={(v) => setYapagiForm({ ...yapagiForm, tarih: v })}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              placeholder="Kırkım baş sayısı"
              keyboardType="number-pad"
              value={yapagiForm.bas}
              onChangeText={(v) => setYapagiForm({ ...yapagiForm, bas: v })}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              placeholder="Toplam kg"
              keyboardType="decimal-pad"
              value={yapagiForm.kg}
              onChangeText={(v) => setYapagiForm({ ...yapagiForm, kg: v })}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              placeholder="Satış notu"
              value={yapagiForm.not}
              onChangeText={(v) => setYapagiForm({ ...yapagiForm, not: v })}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <Pressable
              onPress={async () => {
                await yapagiKaydiEkle({
                  tarih: yapagiForm.tarih,
                  basSayisi: parseInt(yapagiForm.bas, 10) || 1,
                  toplamKg: parseFloat(yapagiForm.kg.replace(',', '.')) || 0,
                  satisNot: yapagiForm.not,
                });
                setYapagiForm({ ...yapagiForm, bas: '', kg: '', not: '' });
                await yenile();
              }}
              style={[styles.btn, { backgroundColor: colors.tint }]}>
              <Text style={styles.btnText}>Yapağı kaydı</Text>
            </Pressable>
          </View>
        )}

        {yukleniyor ? (
          <ActivityIndicator style={{ marginTop: 16 }} color={colors.tint} />
        ) : (
          kayitlar.slice(0, 12).map((k) => (
            <View key={k.id} style={[styles.kutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>
                {k.tarih} · {k.tur === 'sut' ? 'Süt' : 'Yapağı'}
              </Text>
              {k.tur === 'sut' ? (
                <Text style={{ color: colors.textSecondary }}>
                  {k.toplamLitre} L · {k.ortLBas ?? '—'} L/baş · {k.hayvanSayisi} baş
                </Text>
              ) : (
                <Text style={{ color: colors.textSecondary }}>
                  {k.toplamKg} kg · {k.ortKgBas ?? '—'} kg/baş · {k.basSayisi} baş
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  sekmeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  sekme: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  kutu: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8, fontSize: 15 },
  btn: { padding: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' },
});
