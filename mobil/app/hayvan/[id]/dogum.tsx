import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import { countAnimals, getAnimal } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { dogumKaydet, type DogumKuzuGirdi } from '@/kaynak/ureme';
import { limitAsimindaPaketAc } from '@/kaynak/abonelik/limit';
import type { Animal, AnimalSex } from '@/kaynak/cekirdek/tipler';

function uyar(baslik: string, mesaj: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${baslik}\n\n${mesaj}`);
    return;
  }
  Alert.alert(baslik, mesaj);
}

type KuzuForm = {
  earTag: string;
  sex: AnimalSex;
  birthWeightKg: string;
  sirtNo: string;
};

function bosKuzu(): KuzuForm {
  return { earTag: '', sex: 'male', birthWeightKg: '', sirtNo: '' };
}

export default function DogumKayitEkrani() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const { limit, refresh: refreshSub } = useSubscription();
  const [anne, setAnne] = useState<Animal | null>(null);
  const [birthDate, setBirthDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [kuzular, setKuzular] = useState<KuzuForm[]>([bosKuzu()]);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    if (!id) return;
    void getAnimal(id).then(setAnne);
  }, [id]);

  const baslik = useMemo(() => (anne ? hayvanAnaEtiket(anne) : '…'), [anne]);

  const guncelleKuzu = (index: number, patch: Partial<KuzuForm>) => {
    setKuzular((list) => list.map((k, i) => (i === index ? { ...k, ...patch } : k)));
  };

  const kaydet = async () => {
    if (!id || !anne) return;
    if (anne.sex !== 'female') {
      uyar('Hata', 'Doğum kaydı yalnızca dişi hayvan için');
      return;
    }

    const sayi = await countAnimals();
    if (sayi + kuzular.length > limit) {
      const ac = await limitAsimindaPaketAc(sayi + kuzular.length);
      await refreshSub();
      if (!ac.success) {
        uyar('Limit aşıldı', `Paketinizin limiti ${limit} hayvan. ${ac.message}`);
        router.push('/abonelik' as never);
        return;
      }
      uyar('Paket açıldı', ac.message);
    }

    const girdiKuzular: DogumKuzuGirdi[] = kuzular.map((k) => ({
      earTag: k.earTag,
      sex: k.sex,
      sirtNo: k.sirtNo.trim() || null,
      birthWeightKg: k.birthWeightKg.trim()
        ? parseFloat(k.birthWeightKg.replace(',', '.'))
        : null,
    }));

    setKaydediliyor(true);
    try {
      const sonuc = await dogumKaydet({
        anneId: id,
        birthDate: birthDate.trim(),
        kuzular: girdiKuzular,
        paddock: anne.paddock,
        notes,
      });
      if (!sonuc.ok) {
        uyar('Doğum kaydı', sonuc.message);
        return;
      }
      refresh();
      uyar('Tamam', `${sonuc.kuzular.length} kuzu kaydedildi · anne sağmal`);
      router.back();
    } finally {
      setKaydediliyor(false);
    }
  };

  if (!anne) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Anne: {baslik} · {anne.paddock || 'padoksuz'}
      </Text>
      <Text style={[styles.label, { color: colors.text }]}>Doğum tarihi (YYYY-MM-DD)</Text>
      <TextInput
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="2026-03-15"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
      />

      {kuzular.map((k, i) => (
        <View
          key={i}
          style={[styles.kuzuKutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.kuzuBaslik, { color: colors.tint }]}>{i + 1}. kuzu</Text>
          <Text style={[styles.label, { color: colors.text }]}>Küpe no *</Text>
          <TextInput
            value={k.earTag}
            onChangeText={(t) => guncelleKuzu(i, { earTag: t })}
            placeholder="TR-34-…"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
          />
          <Text style={[styles.label, { color: colors.text }]}>Sırt no</Text>
          <TextInput
            value={k.sirtNo}
            onChangeText={(t) => guncelleKuzu(i, { sirtNo: t })}
            placeholder="Opsiyonel"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
          />
          <Text style={[styles.label, { color: colors.text }]}>Doğum kilosu (kg)</Text>
          <TextInput
            value={k.birthWeightKg}
            onChangeText={(t) => guncelleKuzu(i, { birthWeightKg: t })}
            placeholder="örn. 4.2"
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
          />
          <View style={styles.sexRow}>
            {(['male', 'female'] as AnimalSex[]).map((sex) => {
              const aktif = k.sex === sex;
              return (
                <Pressable
                  key={sex}
                  onPress={() => guncelleKuzu(i, { sex })}
                  style={[
                    styles.sexChip,
                    {
                      borderColor: aktif ? colors.tint : colors.border,
                      backgroundColor: aktif ? colors.tint : colors.background,
                    },
                  ]}>
                  <Text style={{ color: aktif ? '#fff' : colors.text, fontWeight: '700' }}>
                    {sex === 'male' ? 'Erkek' : 'Dişi'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {kuzular.length > 1 ? (
            <AnaButon
              title="Bu kuzuyu kaldır"
              variant="ghost"
              onPress={() => setKuzular((list) => list.filter((_, j) => j !== i))}
            />
          ) : null}
        </View>
      ))}

      {kuzular.length < 4 ? (
        <AnaButon
          title="+ İkiz / üçüz ekle"
          variant="secondary"
          onPress={() => setKuzular((list) => [...list, bosKuzu()])}
        />
      ) : null}

      <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Not</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Opsiyonel"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
      />

      <View style={{ marginTop: 16, marginBottom: 32 }}>
        <AnaButon
          title={kaydediliyor ? 'Kaydediliyor…' : 'Doğumu kaydet'}
          onPress={() => void kaydet()}
          disabled={kaydediliyor}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { marginBottom: 12, fontSize: 14 },
  label: { fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 44,
  },
  kuzuKutu: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  kuzuBaslik: { fontWeight: '800', marginBottom: 4 },
  sexRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  sexChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
