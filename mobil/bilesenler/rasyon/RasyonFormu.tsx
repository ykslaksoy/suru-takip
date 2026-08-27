import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import {
  getKullaniciRasyonlari,
  rasyonMaliyetOzeti,
  silKullaniciRasyon,
  upsertKullaniciRasyon,
  type KullaniciRasyon,
  type RasyonBilesen,
} from '@/kaynak/rasyon/kullanici-rasyon';

const BOS_BILESEN = (): RasyonBilesen => ({
  id: uuidv4(),
  ad: '',
  miktarKg: 0,
  fiyatKg: 0,
});

export function RasyonFormu() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [liste, setListe] = useState<KullaniciRasyon[]>([]);
  const [ad, setAd] = useState('Padok karışımı');
  const [bilesenler, setBilesenler] = useState<RasyonBilesen[]>([
    { id: uuidv4(), ad: 'Kuru ot', miktarKg: 1.2, fiyatKg: 4 },
    { id: uuidv4(), ad: 'Kesif yem', miktarKg: 0.8, fiyatKg: 12 },
  ]);
  const [duzenId, setDuzenId] = useState<string | undefined>();

  const load = useCallback(async () => {
    setListe(await getKullaniciRasyonlari());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const taslak: KullaniciRasyon = {
    id: duzenId ?? 'draft',
    ad,
    bilesenler,
    guncelleme: '',
  };
  const ozet = rasyonMaliyetOzeti(taslak);

  return (
    <View>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Bileşen, miktar (kg/hayvan/gün) ve kg fiyatı kaydedin. Akıllı öneri maliyeti buradan okur.
      </Text>

      <TextInput
        placeholder="Rasyon adı"
        placeholderTextColor={colors.textSecondary}
        value={ad}
        onChangeText={setAd}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />

      {bilesenler.map((b, i) => (
        <View key={b.id} style={[styles.bilesen, { borderColor: colors.border }]}>
          <TextInput
            placeholder="Bileşen adı"
            placeholderTextColor={colors.textSecondary}
            value={b.ad}
            onChangeText={(v) => {
              const next = [...bilesenler];
              next[i] = { ...b, ad: v };
              setBilesenler(next);
            }}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
          <View style={styles.row}>
            <TextInput
              placeholder="kg"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textSecondary}
              value={b.miktarKg ? String(b.miktarKg) : ''}
              onChangeText={(v) => {
                const next = [...bilesenler];
                next[i] = { ...b, miktarKg: parseFloat(v.replace(',', '.')) || 0 };
                setBilesenler(next);
              }}
              style={[styles.inputHalf, { borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              placeholder="₺/kg"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textSecondary}
              value={b.fiyatKg ? String(b.fiyatKg) : ''}
              onChangeText={(v) => {
                const next = [...bilesenler];
                next[i] = { ...b, fiyatKg: parseFloat(v.replace(',', '.')) || 0 };
                setBilesenler(next);
              }}
              style={[styles.inputHalf, { borderColor: colors.border, color: colors.text }]}
            />
          </View>
        </View>
      ))}

      <Pressable onPress={() => setBilesenler([...bilesenler, BOS_BILESEN()])} style={{ marginBottom: 10 }}>
        <Text style={{ color: colors.tint, fontWeight: '700' }}>+ Bileşen ekle</Text>
      </Pressable>

      <Text style={{ color: colors.text, marginBottom: 10, lineHeight: 20 }}>
        Toplam {ozet.toplamKg} kg · {ozet.maliyetKg} ₺/kg · {ozet.toplamMaliyet} ₺/hayvan/gün
      </Text>

      <AnaButon
        title={duzenId ? 'Güncelle' : 'Kaydet'}
        onPress={async () => {
          if (!ad.trim() || bilesenler.every((x) => !x.ad.trim())) {
            Alert.alert('Eksik', 'Ad ve en az bir bileşen gerekli');
            return;
          }
          await upsertKullaniciRasyon({
            id: duzenId,
            ad,
            bilesenler: bilesenler.filter((x) => x.ad.trim()),
          });
          setDuzenId(undefined);
          await load();
          Alert.alert('Tamam', 'Rasyon kaydedildi');
        }}
      />

      {liste.map((r) => {
        const m = rasyonMaliyetOzeti(r);
        return (
          <View key={r.id} style={[styles.saved, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{r.ad}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
              {r.bilesenler.length} bileşen · {m.toplamKg} kg · {m.maliyetKg} ₺/kg
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => {
                  setDuzenId(r.id);
                  setAd(r.ad);
                  setBilesenler(r.bilesenler);
                }}>
                <Text style={{ color: colors.tint, fontWeight: '700' }}>Düzenle</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  await silKullaniciRasyon(r.id);
                  await load();
                }}>
                <Text style={{ color: colors.danger, fontWeight: '700' }}>Sil</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 12, lineHeight: 20 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8, fontSize: 15, minHeight: 44 },
  inputHalf: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, minHeight: 44 },
  row: { flexDirection: 'row', gap: 8 },
  bilesen: { borderWidth: 1, borderRadius: 10, padding: 8, marginBottom: 8 },
  saved: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 8 },
});
