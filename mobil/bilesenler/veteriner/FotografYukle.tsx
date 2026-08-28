import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  FOTO_TURLER,
  fotoTurEtiketi,
  type FotoTur,
  type VakaFotografi,
} from '@/kaynak/akilli-veteriner/fotograf';

type Props = {
  fotograflar: VakaFotografi[];
  onChange: (next: VakaFotografi[]) => void;
  max?: number;
};

export function FotografYukle({ fotograflar, onChange, max = 5 }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [bekleyenUri, setBekleyenUri] = useState<string | null>(null);
  const [turSecimAcik, setTurSecimAcik] = useState(false);

  const izinAl = async (kaynak: 'camera' | 'library') => {
    if (Platform.OS === 'web') return true;
    const fn =
      kaynak === 'camera'
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await fn();
    if (status !== 'granted') {
      Alert.alert(
        'İzin gerekli',
        kaynak === 'camera'
          ? 'Fotoğraf çekmek için kamera izni verin.'
          : 'Galeriden seçmek için fotoğraf izni verin.'
      );
      return false;
    }
    return true;
  };

  const fotoEkle = (uri: string, tur: FotoTur) => {
    const yeni: VakaFotografi = {
      id: uuidv4(),
      uri,
      tur,
      etiket: fotoTurEtiketi(tur),
      createdAt: new Date().toISOString(),
    };
    onChange([...fotograflar, yeni]);
    setBekleyenUri(null);
    setTurSecimAcik(false);
  };

  const secVeTurSor = (uri: string) => {
    setBekleyenUri(uri);
    setTurSecimAcik(true);
  };

  const kameraAc = async () => {
    if (fotograflar.length >= max) {
      Alert.alert('Limit', `En fazla ${max} fotoğraf ekleyebilirsiniz.`);
      return;
    }
    if (!(await izinAl('camera'))) return;
    const sonuc = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.75,
      allowsEditing: Platform.OS !== 'web',
    });
    if (!sonuc.canceled && sonuc.assets[0]?.uri) {
      secVeTurSor(sonuc.assets[0].uri);
    }
  };

  const galeriAc = async () => {
    if (fotograflar.length >= max) {
      Alert.alert('Limit', `En fazla ${max} fotoğraf ekleyebilirsiniz.`);
      return;
    }
    if (!(await izinAl('library'))) return;
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
      allowsMultipleSelection: false,
      allowsEditing: Platform.OS !== 'web',
    });
    if (!sonuc.canceled && sonuc.assets[0]?.uri) {
      secVeTurSor(sonuc.assets[0].uri);
    }
  };

  const kaldir = (id: string) => {
    onChange(fotograflar.filter((f) => f.id !== id));
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.baslik, { color: colors.text }]}>Fotoğraf ekle</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 10, lineHeight: 18 }}>
        Kuzu veya hayvanın yara, ayak, dışkı vb. fotoğrafını ekleyin — Akıllı Veteriner analize dahil eder.
      </Text>

      <View style={styles.btnRow}>
        <View style={styles.btnHalf}>
          <AnaButon title="📷 Kamera" variant="secondary" onPress={kameraAc} />
        </View>
        <View style={styles.btnHalf}>
          <AnaButon title="🖼 Galeri" variant="secondary" onPress={galeriAc} />
        </View>
      </View>

      {fotograflar.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
          {fotograflar.map((f) => (
            <View key={f.id} style={[styles.thumbWrap, { borderColor: colors.border }]}>
              <Image source={{ uri: f.uri }} style={styles.thumb} />
              <Text style={[styles.thumbLabel, { color: colors.text }]} numberOfLines={1}>
                {f.etiket}
              </Text>
              <Pressable
                onPress={() => kaldir(f.id)}
                style={[styles.kaldir, { backgroundColor: colors.danger }]}>
                <Text style={styles.kaldirText}>✕</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
          Henüz fotoğraf yok ({fotograflar.length}/{max})
        </Text>
      )}

      <Modal visible={turSecimAcik} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Fotoğraf türü</Text>
            {bekleyenUri ? (
              <Image source={{ uri: bekleyenUri }} style={styles.onizleme} />
            ) : null}
            {FOTO_TURLER.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => bekleyenUri && fotoEkle(bekleyenUri, t.id)}
                style={[styles.turSatir, { borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{t.label}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t.ipucu}</Text>
              </Pressable>
            ))}
            <AnaButon
              title="İptal"
              variant="secondary"
              onPress={() => {
                setTurSecimAcik(false);
                setBekleyenUri(null);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  baslik: { fontWeight: '800', fontSize: 16, marginBottom: 4 },
  btnRow: { flexDirection: 'row', gap: 8 },
  btnHalf: { flex: 1 },
  thumbRow: { marginTop: 12 },
  thumbWrap: {
    width: 100,
    marginRight: 10,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: { width: 100, height: 80 },
  thumbLabel: { fontSize: 11, padding: 4, textAlign: 'center' },
  kaldir: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaldirText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: { borderRadius: 14, borderWidth: 1, padding: 16, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  onizleme: { width: '100%', height: 140, borderRadius: 10, marginBottom: 10 },
  turSatir: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
});
