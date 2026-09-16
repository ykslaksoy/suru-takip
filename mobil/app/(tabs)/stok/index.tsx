import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { StokKarti } from '@/bilesenler/stok/StokKarti';
import { StokGirisCikisModal } from '@/bilesenler/stok/StokGirisCikisModal';
import { StokKayitModal } from '@/bilesenler/stok/StokKayitModal';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { CevrimdisiBanner } from '@/bilesenler/ortak/CevrimdisiBanner';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { adjustStock, getStockItems, upsertStockItem } from '@/kaynak/cekirdek/veritabani';
import { kaydetYemSayim } from '@/kaynak/stok/sayim';
import {
  getSiraliStokListesi,
  kaydetKatalogKullanim,
  type StokListeSatiri,
} from '@/kaynak/stok';
import type { StockItem, StockType } from '@/kaynak/cekirdek/tipler';
import { STOCK_TYPE_LABELS, STOCK_TYPE_ORDER } from '@/kaynak/cekirdek/tipler';

export default function StockScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, pendingSync, refresh, ready } = useDatabase();
  const [satirlar, setSatirlar] = useState<StokListeSatiri[]>([]);
  const [typeFilter, setTypeFilter] = useState<StockType | 'all'>('all');
  const [arama, setArama] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'feed' as StockType,
    quantity: '0',
    unit: 'kg',
    minQuantity: '10',
    expiryDate: '',
    katalogId: null as string | null,
  });

  const load = useCallback(async () => {
    setSatirlar(await getSiraliStokListesi(typeFilter));
  }, [typeFilter]);

  useEffect(() => {
    if (ready) load();
  }, [ready, refreshKey, load]);

  const filtered = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr-TR');
    if (!q) return satirlar;
    return satirlar.filter(
      (s) =>
        s.ad.toLocaleLowerCase('tr-TR').includes(q) ||
        s.aciklama.toLocaleLowerCase('tr-TR').includes(q)
    );
  }, [satirlar, arama]);

  const openFromSatir = (satir: StokListeSatiri) => {
    if (satir.item) {
      openAdjust(satir.item);
      return;
    }
    setForm({
      name: satir.ad,
      type: satir.type,
      quantity: '0',
      unit: satir.birim,
      minQuantity: String(satir.minMiktar),
      expiryDate: '',
      katalogId: satir.katalogId,
    });
    setModalVisible(true);
  };

  const saveItem = async () => {
    if (!form.name.trim()) {
      Alert.alert('Hata', 'Stok adı gerekli');
      return;
    }
    await upsertStockItem({
      name: form.name.trim(),
      type: form.type,
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit,
      minQuantity: parseFloat(form.minQuantity) || 0,
      expiryDate: form.expiryDate || null,
      notes: '',
    });
    if (form.katalogId) await kaydetKatalogKullanim(form.katalogId, 3);
    else await kaydetKatalogKullanim(form.name.trim(), 2);

    if (form.type === 'feed') {
      const items = await getStockItems('feed');
      const saved = items.find((i) => i.name === form.name.trim()) ?? items[items.length - 1];
      if (saved) await kaydetYemSayim(saved.id, saved.quantity, 'sayım');
    }
    setModalVisible(false);
    refresh();
    load();
  };

  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [adjustPadok, setAdjustPadok] = useState('');

  const openAdjust = (item: StockItem) => {
    setAdjustItem(item);
    setAdjustQty('');
    setAdjustPadok('');
    setAdjustModal(true);
  };

  const doAdjust = async (movementType: 'in' | 'out') => {
    if (!adjustItem) return;
    const q = parseFloat(adjustQty);
    if (isNaN(q) || q <= 0) {
      Alert.alert('Hata', 'Geçerli miktar girin');
      return;
    }
    const notes =
      adjustItem.type === 'feed' && adjustPadok.trim() ? adjustPadok.trim() : '';
    await adjustStock(adjustItem.id, movementType, q, notes);
    if (movementType === 'out') {
      await kaydetKatalogKullanim(adjustItem.name, Math.max(1, Math.round(q)));
    }
    if (adjustItem.type === 'feed') {
      const items = await getStockItems('feed');
      const updated = items.find((i) => i.id === adjustItem.id);
      if (updated)
        await kaydetYemSayim(
          updated.id,
          updated.quantity,
          movementType === 'out' ? 'çıkış sonrası' : 'giriş sonrası'
        );
    }
    setAdjustModal(false);
    refresh();
    load();
  };

  const types: (StockType | 'all')[] = ['all', ...STOCK_TYPE_ORDER];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CevrimdisiBanner pendingSync={pendingSync} />
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Stok</Text>
        <Text style={{ color: colors.textSecondary, marginTop: 2 }}>
          Tüm liste · çok kullanılan üstte
        </Text>
      </View>
      <AltButonlar
        items={types.map((t) => ({
          key: t,
          label: t === 'all' ? 'Tümü' : STOCK_TYPE_LABELS[t],
        }))}
        activeKey={typeFilter}
        onSelect={(k) => setTypeFilter(k as StockType | 'all')}
      />
      <TextInput
        placeholder="Listede ara..."
        placeholderTextColor={colors.textSecondary}
        value={arama}
        onChangeText={setArama}
        style={[
          styles.search,
          { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
        ]}
      />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.key}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => <StokKarti satir={item} onPress={() => openFromSatir(item)} />}
        ListHeaderComponent={
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {filtered.length} kalem · çıkış yaptıkça sıra yükselir
          </Text>
        }
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 24 }}>
            Eşleşen kalem yok
          </Text>
        }
      />
      <View style={styles.footer}>
        <AnaButon
          title="+ Özel kalem ekle"
          onPress={() => {
            setForm({
              name: '',
              type: typeFilter === 'all' ? 'feed' : typeFilter,
              quantity: '0',
              unit: 'kg',
              minQuantity: '10',
              expiryDate: '',
              katalogId: null,
            });
            setModalVisible(true);
          }}
        />
      </View>

      <StokKayitModal
        visible={modalVisible}
        form={form}
        onFormChange={setForm}
        onKaydet={saveItem}
        onIptal={() => setModalVisible(false)}
      />

      <StokGirisCikisModal
        visible={adjustModal}
        item={adjustItem}
        miktar={adjustQty}
        padok={adjustPadok}
        onMiktarChange={setAdjustQty}
        onPadokChange={setAdjustPadok}
        onGiris={() => doAdjust('in')}
        onCikis={() => doAdjust('out')}
        onIptal={() => setAdjustModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  pageTitle: { fontSize: 26, fontWeight: '800' },
  search: {
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  hint: { marginBottom: 10, fontSize: 12, fontWeight: '600' },
  footer: { padding: 16, position: 'absolute', left: 0, right: 0, bottom: 0 },
});
