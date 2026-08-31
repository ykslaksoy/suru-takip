import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useNavigation } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import {
  getIsletmeProfil,
  isletmeProfilTamam,
  kaydetIsletmeProfil,
  type IsletmeProfil,
} from '@/kaynak/cekirdek/isletme-profil';
import { appOrtamEtiketi, isletmeProfilZorunlu } from '@/sabitler/Ortam';

export default function IsletmeProfilScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const navigation = useNavigation();
  const [profil, setProfil] = useState<IsletmeProfil | null>(null);
  const [tamam, setTamam] = useState(false);

  const yukle = useCallback(async () => {
    setProfil(await getIsletmeProfil());
    setTamam(await isletmeProfilTamam());
  }, []);

  useEffect(() => {
    navigation.setOptions({ title: 'İşletme profili' });
    yukle();
  }, [navigation, yukle]);

  const kaydet = async () => {
    if (!profil) return;
    if (isletmeProfilZorunlu() && (!profil.isletmeAdi.trim() || !profil.kvkkOnay)) {
      Alert.alert('Eksik', 'Pilot/üretim ortamında işletme adı ve KVKK onayı gerekir.');
      return;
    }
    await kaydetIsletmeProfil(profil);
    await yukle();
    Alert.alert('Kaydedildi', 'İşletme profili güncellendi.');
  };

  if (!profil) return null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
        Ortam: {appOrtamEtiketi()}
        {tamam ? ' · Profil tamam' : ' · Profil eksik'}
      </Text>
      <Text style={[styles.label, { color: colors.text }]}>İşletme adı</Text>
      <TextInput
        value={profil.isletmeAdi}
        onChangeText={(isletmeAdi) => setProfil({ ...profil, isletmeAdi })}
        placeholder="Örn. Yılmaz Koyunculuk"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
      />
      <Text style={[styles.label, { color: colors.text }]}>Yetkili (isteğe bağlı)</Text>
      <TextInput
        value={profil.yetkiliAdi ?? ''}
        onChangeText={(yetkiliAdi) => setProfil({ ...profil, yetkiliAdi })}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
      />
      <Text style={[styles.label, { color: colors.text }]}>Telefon (isteğe bağlı)</Text>
      <TextInput
        value={profil.telefon ?? ''}
        onChangeText={(telefon) => setProfil({ ...profil, telefon })}
        keyboardType="phone-pad"
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
      />
      <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={{ color: colors.text, flex: 1, lineHeight: 20 }}>
          KVKK metnini okudum; verilerin cihazda saklandığını kabul ediyorum.
        </Text>
        <Switch
          value={profil.kvkkOnay}
          onValueChange={(kvkkOnay) => setProfil({ ...profil, kvkkOnay })}
        />
      </View>
      <View style={{ marginTop: 16 }}>
        <AnaButon title="Kaydet" onPress={kaydet} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  label: { fontWeight: '700', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
});
