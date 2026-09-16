import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { FormAlani } from '@/bilesenler/stok/FormAlani';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { StockItem } from '@/kaynak/cekirdek/tipler';

type Props = {
  visible: boolean;
  item: StockItem | null;
  miktar: string;
  padok: string;
  onMiktarChange: (v: string) => void;
  onPadokChange: (v: string) => void;
  onGiris: () => void;
  onCikis: () => void;
  onIptal: () => void;
};

export function StokGirisCikisModal({
  visible,
  item,
  miktar,
  padok,
  onMiktarChange,
  onPadokChange,
  onGiris,
  onCikis,
  onIptal,
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const birim = item?.unit ?? 'kg';
  const mevcut = item?.quantity ?? 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>Stok hareketi</Text>
            <Text style={[styles.urunAdi, { color: colors.tint }]}>{item?.name ?? '—'}</Text>
            <Text style={[styles.mevcut, { color: colors.textSecondary }]}>
              Mevcut stok: {mevcut} {birim}
            </Text>

            <View style={[styles.bolum, { borderColor: colors.border }]}>
              <Text style={[styles.bolumBaslik, { color: colors.text }]}>Ne kadar?</Text>
              <Text style={[styles.bolumAciklama, { color: colors.textSecondary }]}>
                Depoya aldığınız veya kullandığınız miktarı yazın. Sonra aşağıdan giriş veya çıkış
                seçin.
              </Text>
              <FormAlani
                label={`Miktar (${birim})`}
                helper="Sadece sayı — örn. 50 veya 12,5"
                value={miktar}
                onChangeText={onMiktarChange}
                keyboardType="decimal-pad"
                placeholder="0"
                accessibilityLabel={`Miktar ${birim}`}
              />
            </View>

            {item?.type === 'feed' ? (
              <View style={[styles.bolum, { borderColor: colors.border }]}>
                <Text style={[styles.bolumBaslik, { color: colors.text }]}>Hangi padok?</Text>
                <FormAlani
                  label="Padok adı (opsiyonel)"
                  helper="Yem çıkışında padok yazarsanız günlük tüketim ve FCR o gruba paylaştırılır. Boş bırakabilirsiniz."
                  value={padok}
                  onChangeText={onPadokChange}
                  placeholder="Örn. Padok A"
                  autoCapitalize="words"
                  accessibilityLabel="Padok adı opsiyonel"
                />
              </View>
            ) : null}

            <View style={[styles.bolum, styles.bolumSon, { borderColor: colors.border }]}>
              <Text style={[styles.bolumBaslik, { color: colors.text }]}>İşlem</Text>
              <Text style={[styles.bolumAciklama, { color: colors.textSecondary, marginBottom: 12 }]}>
                Giriş depoya ekler · Çıkış stoktan düşer
              </Text>
              <AnaButon title="Giriş — depoya ekle (+)" onPress={onGiris} />
              <View style={styles.butonAralik} />
              <AnaButon title="Çıkış — kullan (-)" variant="danger" onPress={onCikis} />
              <View style={styles.butonAralik} />
              <AnaButon title="İptal" variant="secondary" onPress={onIptal} />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
  },
  title: { fontSize: 22, fontWeight: '800' },
  urunAdi: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  mevcut: { fontSize: 14, fontWeight: '600', marginTop: 6, marginBottom: 16 },
  bolum: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 4,
  },
  bolumSon: { borderTopWidth: 0, paddingTop: 8 },
  bolumBaslik: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  bolumAciklama: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  butonAralik: { height: 8 },
});
