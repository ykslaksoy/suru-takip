import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import {
  getVetIletisim,
  saveVetIletisim,
  vetGonderimKanali,
  type VetIletisim,
} from '@/kaynak/veteriner-koprusu/vet-iletisim';

export function VetIletisimFormu({ onKaydedildi }: { onKaydedildi?: () => void }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [form, setForm] = useState<VetIletisim | null>(null);
  const [kanalAciklama, setKanalAciklama] = useState('');

  const load = useCallback(async () => {
    setForm(await getVetIletisim());
    const k = await vetGonderimKanali();
    setKanalAciklama(k.aciklama);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!form) return null;

  const kaydet = async () => {
    await saveVetIletisim(form);
    await load();
    onKaydedildi?.();
  };

  return (
    <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Veteriner köprüsü</Text>
      <Text style={{ color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
        Vet SürüYön programındaysa uygulama içinden; değilse WhatsApp numarasıyla iletişim kurulur.
      </Text>
      <Text style={{ color: colors.tint, fontWeight: '700', marginBottom: 12 }}>{kanalAciklama}</Text>

      <Text style={[styles.label, { color: colors.text }]}>Veteriner adı</Text>
      <TextInput
        value={form.ad}
        onChangeText={(ad) => setForm({ ...form, ad })}
        placeholder="Dr. …"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <Text style={[styles.label, { color: colors.text }]}>Klinik (opsiyonel)</Text>
      <TextInput
        value={form.klinikAdi}
        onChangeText={(klinikAdi) => setForm({ ...form, klinikAdi })}
        placeholder="Klinik adı"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />

      <Pressable
        onPress={() =>
          setForm({
            ...form,
            programdaKayitli: !form.programdaKayitli,
          })
        }
        style={{ marginBottom: 10 }}>
        <Text style={{ color: form.programdaKayitli ? colors.tint : colors.textSecondary, fontWeight: '800' }}>
          {form.programdaKayitli ? '✓ SürüYön programında kayıtlı vet' : '○ WhatsApp ile iletişim'}
        </Text>
      </Pressable>

      {form.programdaKayitli ? (
        <>
          <Text style={[styles.label, { color: colors.text }]}>Program vet kimliği</Text>
          <TextInput
            value={form.programVetId}
            onChangeText={(programVetId) => setForm({ ...form, programVetId })}
            placeholder="Davet kodu veya vet hesap no"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.text }]}>WhatsApp telefon</Text>
          <TextInput
            value={form.whatsapp}
            onChangeText={(whatsapp) => setForm({ ...form, whatsapp })}
            placeholder="05xx xxx xx xx"
            keyboardType="phone-pad"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
        </>
      )}

      <AnaButon title="Veterineri kaydet" onPress={kaydet} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  title: { fontWeight: '800', fontSize: 16, marginBottom: 4 },
  label: { fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 44, marginBottom: 8 },
});
