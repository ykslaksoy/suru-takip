import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { StokKarti } from '@/bilesenler/stok/StokKarti';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { CevrimdisiBanner } from '@/bilesenler/ortak/CevrimdisiBanner';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { adjustStock, getStockItems, upsertStockItem } from '@/kaynak/cekirdek/veritabani';
import type { StockItem, StockType } from '@/kaynak/cekirdek/tipler';
import { STOCK_TYPE_LABELS } from '@/kaynak/cekirdek/tipler';

export default function StockScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, pendingSync, refresh, ready } = useDatabase();
  const [items, setItems] = useState<StockItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<StockType | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<StockItem | null>(null);
  const [form, setForm] = useState({ name: '', type: 'feed' as StockType, quantity: '0', unit: 'kg', minQuantity: '0', expiryDate: '' });

  const load = useCallback(async () => {
    const list = await getStockItems(typeFilter === 'all' ? undefined : typeFilter);
    setItems(list);
  }, [typeFilter]);

  useEffect(() => {
    if (ready) load();
  }, [ready, refreshKey, load]);

  const saveItem = async () => {
    if (!form.name.trim()) {
      Alert.alert('Hata', 'Stok adı gerekli');
      return;
    }
    await upsertStockItem({
      id: selected?.id,
      name: form.name.trim(),
      type: form.type,
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit,
      minQuantity: parseFloat(form.minQuantity) || 0,
      expiryDate: form.expiryDate || null,
      notes: '',
    });
    setModalVisible(false);
    setSelected(null);
    refresh();
    load();
  };

  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);

  const openAdjust = (item: StockItem) => {
    setAdjustItem(item);
    setAdjustQty('');
    setAdjustModal(true);
  };

  const doAdjust = async (movementType: 'in' | 'out') => {
    if (!adjustItem) return;
    const q = parseFloat(adjustQty);
    if (isNaN(q) || q <= 0) {
      Alert.alert('Hata', 'Geçerli miktar girin');
      return;
    }
    await adjustStock(adjustItem.id, movementType, q);
    setAdjustModal(false);
    refresh();
    load();
  };

  const types: (StockType | 'all')[] = ['all', 'feed', 'vaccine', 'medicine'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CevrimdisiBanner pendingSync={pendingSync} />
      <View style={styles.filters}>
        {types.map((t) => (
          <Pressable
            key={t}
            onPress={() => setTypeFilter(t)}
            style={[styles.chip, { backgroundColor: typeFilter === t ? colors.tint : colors.card, borderColor: colors.border }]}>
            <Text style={{ color: typeFilter === t ? '#fff' : colors.text, fontWeight: '600', fontSize: 13 }}>
              {t === 'all' ? 'Tümü' : STOCK_TYPE_LABELS[t]}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <StokKarti
            item={item}
            onPress={() => openAdjust(item)}
          />
        )}
        ListHeaderComponent={
          items.some((i) => i.quantity <= i.minQuantity) ? (
            <Text style={[styles.alert, { color: colors.warning }]}>⚠ Düşük stok uyarısı olan kalemler var</Text>
          ) : null
        }
      />
      <View style={styles.footer}>
        <AnaButon
          title="+ Stok Ekle"
          onPress={() => {
            setSelected(null);
            setForm({ name: '', type: 'feed', quantity: '0', unit: 'kg', minQuantity: '10', expiryDate: '' });
            setModalVisible(true);
          }}
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{selected ? 'Stok Düzenle' : 'Yeni Stok'}</Text>
            {(['name', 'quantity', 'minQuantity', 'unit', 'expiryDate'] as const).map((field) => (
              <TextInput
                key={field}
                placeholder={
                  field === 'name' ? 'Ad (ör: Arpa kırması)' :
                  field === 'quantity' ? 'Miktar' :
                  field === 'minQuantity' ? 'Minimum stok' :
                  field === 'unit' ? 'Birim (kg, doz, flakon)' : 'SKT (YYYY-MM-DD)'
                }
                value={form[field === 'name' ? 'name' : field === 'quantity' ? 'quantity' : field === 'minQuantity' ? 'minQuantity' : field === 'unit' ? 'unit' : 'expiryDate']}
                onChangeText={(v) => setForm({ ...form, [field === 'expiryDate' ? 'expiryDate' : field]: v })}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
            ))}
            <View style={styles.typeRow}>
              {(['feed', 'vaccine', 'medicine'] as StockType[]).map((t) => (
                <Pressable key={t} onPress={() => setForm({ ...form, type: t })} style={[styles.chip, { backgroundColor: form.type === t ? colors.tint : colors.background, borderColor: colors.border }]}>
                  <Text style={{ color: form.type === t ? '#fff' : colors.text }}>{STOCK_TYPE_LABELS[t]}</Text>
                </Pressable>
              ))}
            </View>
            <AnaButon title="Kaydet" onPress={saveItem} />
            <AnaButon title="İptal" variant="secondary" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={adjustModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Stok Giriş/Çıkış — {adjustItem?.name}
            </Text>
            <TextInput
              placeholder={`Miktar (${adjustItem?.unit ?? ''})`}
              keyboardType="decimal-pad"
              value={adjustQty}
              onChangeText={setAdjustQty}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <AnaButon title="Giriş (+)" onPress={() => doAdjust('in')} />
            <AnaButon title="Çıkış (-)" variant="danger" onPress={() => doAdjust('out')} />
            <AnaButon title="İptal" variant="secondary" onPress={() => setAdjustModal(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { flexDirection: 'row', padding: 16, gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  alert: { marginBottom: 12, fontWeight: '600' },
  footer: { padding: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 16, minHeight: 48 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
});
