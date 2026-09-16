import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { FormAlani } from '@/bilesenler/stok/FormAlani';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { STOCK_TYPE_LABELS, STOCK_TYPE_ORDER, type StockType } from '@/kaynak/cekirdek/tipler';
import { terim } from '@/sabitler/Metinler';

export type StokKayitForm = {
  name: string;
  type: StockType;
  quantity: string;
  unit: string;
  minQuantity: string;
  expiryDate: string;
  katalogId: string | null;
};

type Props = {
  visible: boolean;
  form: StokKayitForm;
  onFormChange: (form: StokKayitForm) => void;
  onKaydet: () => void;
  onIptal: () => void;
};

export function StokKayitModal({ visible, form, onFormChange, onKaydet, onIptal }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>Stok kaydı</Text>
            <Text style={[styles.intro, { color: colors.textSecondary }]}>
              Listede olmayan veya özel bir kalem ekliyorsanız aşağıdaki alanları doldurun.
            </Text>

            <View style={[styles.bolum, { borderColor: colors.border }]}>
              <Text style={[styles.bolumBaslik, { color: colors.text }]}>Kalem bilgisi</Text>
              <FormAlani
                label="Stok adı"
                required
                value={form.name}
                onChangeText={(name) => onFormChange({ ...form, name })}
                placeholder="Örn. Yonca kuru ot"
              />
              <FormAlani
                label="Başlangıç miktarı"
                helper={`Depodaki mevcut miktar (${form.unit || 'kg'})`}
                value={form.quantity}
                onChangeText={(quantity) => onFormChange({ ...form, quantity })}
                keyboardType="decimal-pad"
                placeholder="0"
              />
              <FormAlani
                label="Minimum stok uyarısı"
                helper="Bu miktarın altına inince düşük stok uyarısı verilir"
                value={form.minQuantity}
                onChangeText={(minQuantity) => onFormChange({ ...form, minQuantity })}
                keyboardType="decimal-pad"
                placeholder="10"
              />
              <FormAlani
                label="Birim"
                helper="kg, lt, adet gibi"
                value={form.unit}
                onChangeText={(unit) => onFormChange({ ...form, unit })}
                placeholder="kg"
              />
              <FormAlani
                label={`${terim('SKT')} (opsiyonel)`}
                helper="Son kullanma tarihi — YYYY-MM-DD"
                value={form.expiryDate}
                onChangeText={(expiryDate) => onFormChange({ ...form, expiryDate })}
                placeholder="2026-12-31"
              />
            </View>

            <View style={[styles.bolum, { borderColor: colors.border }]}>
              <Text style={[styles.bolumBaslik, { color: colors.text }]}>Stok türü</Text>
              <Text style={[styles.bolumAciklama, { color: colors.textSecondary }]}>
                Yem, ilaç veya malzeme — listede filtreleme için
              </Text>
              <View style={styles.typeRow}>
                {STOCK_TYPE_ORDER.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => onFormChange({ ...form, type: t })}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: form.type === t ? colors.tint : colors.background,
                        borderColor: colors.border,
                      },
                    ]}>
                    <Text style={{ color: form.type === t ? '#fff' : colors.text, fontWeight: '700' }}>
                      {STOCK_TYPE_LABELS[t]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <AnaButon title="Kaydet" onPress={onKaydet} />
            <View style={styles.butonAralik} />
            <AnaButon title="İptal" variant="secondary" onPress={onIptal} />
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
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  intro: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  bolum: {
    borderTopWidth: 1,
    paddingTop: 14,
    marginBottom: 8,
  },
  bolumBaslik: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  bolumAciklama: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  butonAralik: { height: 8 },
});
