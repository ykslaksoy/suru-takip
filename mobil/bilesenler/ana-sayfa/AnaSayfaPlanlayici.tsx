import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import {
  MENU_KATALOGU_HARITASI,
  normalizeAnaSayfaTercih,
  type AnaSayfaTercih,
} from '@/kaynak/ana-sayfa';

const MAX_HIZLI_ISLEM = 9;

interface Props {
  initialTercih: AnaSayfaTercih;
  onSave: (tercih: AnaSayfaTercih) => Promise<void>;
  onReset: () => Promise<void>;
}

function moveItem(ids: string[], index: number, delta: number): string[] {
  const next = [...ids];
  const target = index + delta;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function removeItem(ids: string[], index: number): string[] {
  return ids.filter((_, i) => i !== index);
}

function addItem(ids: string[], id: string, max?: number): string[] {
  if (ids.includes(id)) return ids;
  if (max !== undefined && ids.length >= max) return ids;
  return [...ids, id];
}

function ListeBolumu({
  baslik,
  aciklama,
  ids,
  max,
  digerIds,
  onChange,
  colors,
}: {
  baslik: string;
  aciklama: string;
  ids: string[];
  max?: number;
  digerIds: string[];
  onChange: (ids: string[]) => void;
  colors: (typeof Colors)['light'];
}) {
  const kullanilan = new Set([...ids, ...digerIds]);
  const eklenebilir = Object.values(MENU_KATALOGU_HARITASI).filter((m) => !kullanilan.has(m.id));

  return (
    <View style={styles.block}>
      <Text style={[styles.blockTitle, { color: colors.text }]}>{baslik}</Text>
      <Text style={[styles.blockSub, { color: colors.textSecondary }]}>{aciklama}</Text>

      {ids.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>Henüz öğe yok — alttan ekleyin.</Text>
      ) : null}

      {ids.map((id, index) => {
        const item = MENU_KATALOGU_HARITASI[id];
        if (!item) return null;
        return (
          <View key={id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.rowIcon}>{item.icon}</Text>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
            <View style={styles.rowActions}>
              <Pressable
                accessibilityLabel="Yukarı taşı"
                onPress={() => onChange(moveItem(ids, index, -1))}
                style={styles.iconBtn}>
                <Text style={{ color: colors.tint, fontWeight: '800' }}>↑</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Aşağı taşı"
                onPress={() => onChange(moveItem(ids, index, 1))}
                style={styles.iconBtn}>
                <Text style={{ color: colors.tint, fontWeight: '800' }}>↓</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Kaldır"
                onPress={() => onChange(removeItem(ids, index))}
                style={styles.iconBtn}>
                <Text style={{ color: colors.danger, fontWeight: '800' }}>✕</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {eklenebilir.length > 0 ? (
        <>
          <Text style={[styles.poolTitle, { color: colors.textSecondary }]}>Ekle</Text>
          <View style={styles.pool}>
            {eklenebilir.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (max !== undefined && ids.length >= max) {
                    Alert.alert('Limit', `En fazla ${max} kısayol seçebilirsiniz.`);
                    return;
                  }
                  onChange(addItem(ids, item.id, max));
                }}
                style={({ pressed }) => [
                  styles.poolChip,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <Text style={{ fontSize: 14 }}>{item.icon}</Text>
                <Text style={[styles.poolChipText, { color: colors.text }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

export function AnaSayfaPlanlayici({ initialTercih, onSave, onReset }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [draft, setDraft] = useState(initialTercih);

  useEffect(() => {
    setDraft(initialTercih);
  }, [initialTercih]);

  const setHizli = (hizliIslemIds: string[]) => {
    setDraft((prev) => normalizeAnaSayfaTercih({ ...prev, hizliIslemIds }));
  };

  const setKestirme = (kestirmeIds: string[]) => {
    setDraft((prev) => normalizeAnaSayfaTercih({ ...prev, kestirmeIds }));
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Ana ekranı kendiniz planlayın. Başlangıç düzeni her zaman geri yüklenebilir.
      </Text>

      <ListeBolumu
        baslik="Hızlı işlemler (3×3)"
        aciklama={`En fazla ${MAX_HIZLI_ISLEM} büyük kısayol.`}
        ids={draft.hizliIslemIds}
        max={MAX_HIZLI_ISLEM}
        digerIds={draft.kestirmeIds}
        onChange={setHizli}
        colors={colors}
      />

      <ListeBolumu
        baslik="Kestirmeler"
        aciklama="Alttaki küçük kısayollar — istediğiniz kadar."
        ids={draft.kestirmeIds}
        digerIds={draft.hizliIslemIds}
        onChange={setKestirme}
        colors={colors}
      />

      <View style={styles.footer}>
        <AnaButon
          title="Kaydet"
          onPress={async () => {
            await onSave(draft);
            router.back();
          }}
        />
        <AnaButon
          title="Başlangıç düzenine dön"
          variant="secondary"
          onPress={() => {
            Alert.alert(
              'Başlangıç düzeni',
              'Ana ekranı fabrika ayarlarına döndürmek istiyor musunuz?',
              [
                { text: 'Vazgeç', style: 'cancel' },
                {
                  text: 'Dön',
                  style: 'destructive',
                  onPress: async () => {
                    await onReset();
                    router.back();
                  },
                },
              ]
            );
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  intro: { lineHeight: 20, marginBottom: 20 },
  block: { marginBottom: 24 },
  blockTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  blockSub: { fontSize: 13, marginBottom: 12 },
  empty: { fontStyle: 'italic', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowLabel: { flex: 1, fontWeight: '700', fontSize: 14 },
  rowActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poolTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 8,
    marginBottom: 8,
  },
  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  poolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  poolChipText: { fontSize: 12, fontWeight: '600' },
  footer: { marginTop: 8 },
});
