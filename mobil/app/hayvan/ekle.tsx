import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { TurSecici } from '@/bilesenler/suru/TurSecici';
import { PadokSecici } from '@/bilesenler/suru/PadokSecici';
import { OkuyucuDurumu } from '@/bilesenler/rfid/OkuyucuDurumu';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import { useMod } from '@/baglam/ModBaglami';
import { countAnimals, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { validateGehisId, validateTurkvetNo } from '@/kaynak/turkvet/dogrula';
import { rfidOku } from '@/kaynak/rfid';
import { ocrKupeFotodan, ocrKupeNormalize, ocrSirtNormalize } from '@/kaynak/ocr';
import { limitAsimindaPaketAc } from '@/kaynak/abonelik/limit';
import type { AnimalSex, AnimalSpecies, AnimalStatus } from '@/kaynak/cekirdek/tipler';
import { VARSAYILAN_KABUL_CINSIYET } from '@/kaynak/suru/hizli-kuzu-kabul';

function uyar(baslik: string, mesaj: string, actions?: { text: string; onPress?: () => void }[]) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${baslik}\n\n${mesaj}`);
    actions?.find((a) => a.onPress)?.onPress?.();
    return;
  }
  Alert.alert(
    baslik,
    mesaj,
    actions?.map((a) => ({ text: a.text, onPress: a.onPress })) ?? [{ text: 'Tamam' }],
  );
}

export default function AddAnimalScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const { limit, refresh: refreshSub } = useSubscription();
  const { aktifId, aktifMod } = useMod();
  const params = useLocalSearchParams<{ padok?: string }>();
  const padokParam = typeof params.padok === 'string' ? params.padok : '';

  const [form, setForm] = useState({
    earTag: '',
    turkvetNo: '',
    gehisId: '',
    sirtNo: '',
    name: '',
    breed: 'Merinos',
    species: 'sheep' as AnimalSpecies,
    sex: VARSAYILAN_KABUL_CINSIYET as AnimalSex,
    birthDate: new Date().toISOString().split('T')[0],
    paddock: padokParam || 'Padok A',
    status: 'healthy' as AnimalStatus,
    motherId: '',
    notes: '',
  });
  const [ocrMetin, setOcrMetin] = useState('');
  const [ocrSirtMetin, setOcrSirtMetin] = useState('');

  useEffect(() => {
    if (padokParam) {
      setForm((f) => ({ ...f, paddock: padokParam }));
    }
  }, [padokParam]);

  const rfidOkut = async () => {
    const r = await rfidOku();
    if (!r.ok) {
      uyar('RFID', r.message);
      return;
    }
    setForm((f) => ({
      ...f,
      earTag: r.earTagOneri || f.earTag,
      gehisId: r.gehisIdOneri || f.gehisId,
    }));
    uyar('RFID', r.message);
  };

  const ocrUygula = async () => {
    const r = ocrMetin.trim() ? ocrKupeNormalize(ocrMetin) : await ocrKupeFotodan({});
    if (!r.ok) {
      uyar('OCR', r.message);
      return;
    }
    setForm((f) => ({ ...f, earTag: r.earTag || f.earTag }));
    uyar('OCR', r.message);
  };

  const ocrSirtUygula = () => {
    const r = ocrSirtNormalize(ocrSirtMetin);
    if (!r.ok) {
      uyar('OCR', r.message);
      return;
    }
    setForm((f) => ({ ...f, sirtNo: r.sirtNo || f.sirtNo }));
    uyar('OCR', r.message);
  };

  const save = async () => {
    const count = await countAnimals();
    if (count >= limit) {
      const ac = await limitAsimindaPaketAc(count + 1);
      await refreshSub();
      if (!ac.success) {
        uyar(
          'Limit aşıldı',
          `Paketinizin limiti ${limit} hayvan. ${ac.message}`,
        );
        router.push('/abonelik' as never);
        return;
      }
      uyar('Paket açıldı', ac.message);
    }
    if (!form.earTag.trim()) {
      uyar('Hata', 'Kulak küpe numarası zorunlu');
      return;
    }
    const tv = validateTurkvetNo(form.turkvetNo);
    if (!tv.valid) {
      uyar('Hata', tv.message);
      return;
    }
    const gh = validateGehisId(form.gehisId);
    if (!gh.valid) {
      uyar('Hata', gh.message);
      return;
    }

    await upsertAnimal({
      id: uuidv4(),
      earTag: form.earTag.trim(),
      turkvetNo: form.turkvetNo.replace(/\s/g, '').toUpperCase(),
      gehisId: form.gehisId.replace(/\s/g, '') || null,
      sirtNo: form.sirtNo.trim() || null,
      name: form.name.trim(),
      breed: form.breed.trim(),
      species: form.species,
      sex: form.sex,
      birthDate: form.birthDate,
      paddock: form.paddock.trim(),
      status: form.status,
      motherId: form.motherId.trim() || null,
      modId: aktifId,
      notes: form.notes.trim(),
    });
    refresh();
    router.back();
  };

  const fields: { key: keyof typeof form; label: string; placeholder: string }[] = [
    { key: 'earTag', label: 'Kulak Küpe No *', placeholder: 'TR-34-001234' },
    { key: 'sirtNo', label: 'Sırt No', placeholder: '87' },
    { key: 'turkvetNo', label: 'TÜRKVET Kimlik No', placeholder: 'TR340012345678901' },
    { key: 'gehisId', label: 'Aref / GEKİS Elektronik Kimlik', placeholder: 'AREF000000000001' },
    { key: 'name', label: 'İsim', placeholder: 'Koyun adı (opsiyonel)' },
    { key: 'breed', label: 'Irk', placeholder: 'Merinos, İvesi, Sakız...' },
    { key: 'birthDate', label: 'Doğum Tarihi', placeholder: 'YYYY-MM-DD' },
    { key: 'motherId', label: 'Anne TÜRKVET No', placeholder: 'Opsiyonel' },
    { key: 'notes', label: 'Not', placeholder: 'Ek bilgi' },
  ];

  return (
    <ScrollView
      style={StyleSheet.flatten([{ flex: 1, backgroundColor: colors.background }])}
      keyboardShouldPersistTaps="handled">
      <Text style={StyleSheet.flatten([styles.hint, { color: colors.textSecondary }])}>
        Padok girişi · {form.paddock || 'padok seçin'} · {aktifMod.icon} {aktifMod.baslik}
      </Text>

      <View style={styles.field}>
        <OkuyucuDurumu />
        <AnaButon title="RFID / GEKİS okut (simülasyon)" variant="secondary" onPress={() => void rfidOkut()} />
      </View>

      <View style={styles.field}>
        <Text style={StyleSheet.flatten([styles.label, { color: colors.text }])}>
          OCR — küpe metni (yapıştır / oku)
        </Text>
        <TextInput
          value={ocrMetin}
          onChangeText={setOcrMetin}
          placeholder="Etiketten okunan veya yapıştırılan metin"
          placeholderTextColor={colors.textSecondary}
          style={StyleSheet.flatten([
            styles.input,
            { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
          ])}
        />
        <AnaButon title="OCR ile küpe doldur" variant="secondary" onPress={() => void ocrUygula()} />
        <Text style={StyleSheet.flatten([styles.label, { color: colors.text, marginTop: 12 }])}>
          OCR — sırt no
        </Text>
        <TextInput
          value={ocrSirtMetin}
          onChangeText={setOcrSirtMetin}
          placeholder="Sırt boyasından okunan / yapıştırılan"
          placeholderTextColor={colors.textSecondary}
          style={StyleSheet.flatten([
            styles.input,
            { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
          ])}
        />
        <AnaButon title="OCR ile sırt doldur" variant="secondary" onPress={ocrSirtUygula} />
      </View>

      {fields.map((f) => (
        <View key={f.key} style={styles.field}>
          <Text style={StyleSheet.flatten([styles.label, { color: colors.text }])}>{f.label}</Text>
          <TextInput
            value={String(form[f.key])}
            onChangeText={(v) => setForm({ ...form, [f.key]: v })}
            placeholder={f.placeholder}
            placeholderTextColor={colors.textSecondary}
            style={StyleSheet.flatten([
              styles.input,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
            ])}
          />
        </View>
      ))}
      <View style={styles.field}>
        <TurSecici value={form.species} onChange={(species) => setForm({ ...form, species })} />
      </View>
      <View style={styles.field}>
        <PadokSecici value={form.paddock} onChange={(paddock) => setForm({ ...form, paddock })} />
      </View>
      <View style={styles.field}>
        <Text style={StyleSheet.flatten([styles.label, { color: colors.text }])}>Cinsiyet</Text>
        <View style={styles.row}>
          {(['male', 'female'] as AnimalSex[]).map((s) => (
            <AnaButon
              key={s}
              title={s === 'male' ? 'Erkek' : 'Dişi'}
              variant={form.sex === s ? 'primary' : 'secondary'}
              onPress={() => setForm({ ...form, sex: s })}
            />
          ))}
        </View>
      </View>
      <View style={{ padding: 16 }}>
        <AnaButon title="Padoka kaydet" onPress={() => void save()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hint: { padding: 16, fontSize: 13, lineHeight: 18 },
  field: { paddingHorizontal: 16, marginBottom: 8 },
  label: { fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, minHeight: 48 },
  row: { flexDirection: 'row', gap: 8 },
});
