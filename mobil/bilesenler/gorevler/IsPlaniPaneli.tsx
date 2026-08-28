import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import {
  addIsPlaniKaydi,
  getIsPlaniKayitlari,
  IS_PLANI_TURLER,
  isPlaniAciklama,
  isPlaniKalanGun,
  setIsPlaniTamam,
  silIsPlaniKaydi,
  type IsPlaniKaydi,
  type IsPlaniTur,
} from '@/kaynak/gorevler/is-plani';

type Props = {
  onDegisti: () => void;
  refreshKey: number;
};

export function IsPlaniPaneli({ onDegisti, refreshKey }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [liste, setListe] = useState<IsPlaniKaydi[]>([]);
  const [tur, setTur] = useState<IsPlaniTur>('tartim');
  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10));
  const [not, setNot] = useState('');
  const [padok, setPadok] = useState('');
  const [adet, setAdet] = useState('');

  const load = useCallback(async () => {
    setListe(await getIsPlaniKayitlari());
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const seciliMeta = IS_PLANI_TURLER.find((t) => t.id === tur)!;
  const bugun = new Date().toISOString().slice(0, 10);

  const kaydet = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) {
      Alert.alert('Eksik', 'Tarih YYYY-AA-GG formatında olmalı');
      return;
    }
    await addIsPlaniKaydi({
      tur,
      tarih,
      not: not.trim(),
      padok: padok.trim(),
      adet: adet.trim() ? parseInt(adet, 10) || null : null,
    });
    setNot('');
    setPadok('');
    setAdet('');
    await load();
    onDegisti();
    Alert.alert('Tamam', 'İş planlandı');
  };

  return (
    <View>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Kuzu kırpımı, tartım, kuzu alımı ve satımı için ileri tarih planlayın. Günü gelince Bugün ve
        Görevler’de görünür.
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>İş türü</Text>
      <View style={styles.turRow}>
        {IS_PLANI_TURLER.map((t) => {
          const aktif = tur === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTur(t.id)}
              style={[
                styles.turChip,
                {
                  borderColor: aktif ? colors.tint : colors.border,
                  backgroundColor: aktif ? `${colors.tint}18` : colors.card,
                },
              ]}>
              <Text style={{ fontSize: 18 }}>{t.icon}</Text>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12, marginTop: 4 }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        placeholder="Tarih YYYY-AA-GG"
        placeholderTextColor={colors.textSecondary}
        value={tarih}
        onChangeText={setTarih}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      {(tur === 'kuzu-alim' || tur === 'kuzu-satim') && (
        <TextInput
          placeholder="Adet (opsiyonel)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          value={adet}
          onChangeText={setAdet}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        />
      )}
      <TextInput
        placeholder={seciliMeta.placeholder}
        placeholderTextColor={colors.textSecondary}
        value={padok}
        onChangeText={setPadok}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <TextInput
        placeholder="Not (opsiyonel)"
        placeholderTextColor={colors.textSecondary}
        value={not}
        onChangeText={setNot}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <AnaButon title="Planla" onPress={kaydet} />

      <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Planlanan işler</Text>
      {liste.length === 0 ? (
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Henüz plan yok.</Text>
      ) : (
        liste.map((k) => {
          const meta = IS_PLANI_TURLER.find((t) => t.id === k.tur)!;
          const kalan = isPlaniKalanGun(k.tarih, bugun);
          const zaman =
            kalan > 0 ? `${kalan} gün sonra` : kalan === 0 ? 'Bugün' : `${Math.abs(kalan)} gün gecikti`;
          return (
            <View
              key={k.id}
              style={[styles.kayit, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>
                {meta.icon} {meta.label} · {k.tarih}
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                {zaman} · {isPlaniAciklama(k)}
              </Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={async () => {
                    await setIsPlaniTamam(k.id, true);
                    await load();
                    onDegisti();
                  }}>
                  <Text style={{ color: colors.success, fontWeight: '700' }}>Tamamla</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Alert.alert('Sil', 'Bu plan silinsin mi?', [
                      { text: 'Vazgeç', style: 'cancel' },
                      {
                        text: 'Sil',
                        style: 'destructive',
                        onPress: async () => {
                          await silIsPlaniKaydi(k.id);
                          await load();
                          onDegisti();
                        },
                      },
                    ]);
                  }}>
                  <Text style={{ color: colors.danger, fontWeight: '700' }}>Sil</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { lineHeight: 20, marginBottom: 12 },
  label: { fontWeight: '800', marginBottom: 8 },
  turRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  turChip: {
    width: '47%',
    minWidth: 140,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    fontSize: 15,
    minHeight: 44,
  },
  kayit: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 10 },
});
