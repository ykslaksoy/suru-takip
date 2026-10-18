import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { KILITLI_HIZLI_ISLEMLER, type KilitliHizliIslemId } from '@/sabitler/HizliIslemler';
import { KILITLI_HIZLI_IKONLAR } from '@/kaynak/ana-sayfa/kilitli-gorseller';

type BuyukIslem = {
  id: string;
  label: string;
  alt: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  renk: string;
};

/** 2×2 büyük kutu — en sık kullanılan dört iş */
const BUYUK_ISLEMLER: BuyukIslem[] = [
  { id: 'ses', label: 'Sesli Komut', alt: 'Konuşarak kaydet', href: '/ses', icon: 'mic', renk: '#2d6a4f' },
  { id: 'hizli-tartim', label: 'Hızlı Tartım', alt: 'Seri ahır girişi', href: '/seri-giris', icon: 'speedometer', renk: '#2F80ED' },
  { id: 'asi', label: 'Aşı ve İlaç', alt: 'Plan ve uygulama', href: '/gorevler/asi', icon: 'medkit', renk: '#C0392B' },
  { id: 'kuzu-ekle', label: 'Kuzu Ekle', alt: 'Yeni giriş', href: '/hayvan/hizli-ekle', icon: 'add-circle', renk: '#D68910' },
];

/** "Tümü" altında kalanlar — FCR GCA ana sayfada "Yem verimi" adıyla */
const DIGER_IDLER: KilitliHizliIslemId[] = ['rasyon', 'veteriner', 'stok', 'fcr-gca', 'gorevler'];
const ETIKET_DUZELT: Partial<Record<KilitliHizliIslemId, string>> = { 'fcr-gca': 'Yem verimi' };

export function KilitliHizliIslemler({ yatayPad = 16 }: { yatayPad?: number } = {}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const light = scheme === 'light';
  const [acik, setAcik] = useState(false);
  const digerleri = DIGER_IDLER.map((id) => KILITLI_HIZLI_ISLEMLER.find((x) => x.id === id)).filter(
    (x): x is (typeof KILITLI_HIZLI_ISLEMLER)[number] => Boolean(x),
  );

  return (
    <View style={StyleSheet.flatten([styles.wrap, { paddingHorizontal: yatayPad }])}>
      <View style={styles.baslikRow}>
        <Text style={StyleSheet.flatten([styles.baslik, { color: colors.text }])}>Hızlı İşlemler</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={acik ? 'Diğer işlemleri gizle' : 'Tüm işlemleri göster'}
          onPress={() => setAcik((v) => !v)}
          hitSlop={10}
          style={styles.tumuBtn}>
          <Text style={StyleSheet.flatten([styles.tumu, { color: colors.tint }])}>{acik ? 'Gizle' : 'Tümü'}</Text>
          <Ionicons name={acik ? 'chevron-up' : 'chevron-down'} size={16} color={colors.tint} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {BUYUK_ISLEMLER.map((it) => (
          <Pressable
            key={it.id}
            accessibilityRole="button"
            accessibilityLabel={it.label}
            onPress={() => router.push(it.href as never)}
            style={({ pressed }) =>
              StyleSheet.flatten([
                styles.tile,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.88 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ])
            }>
            <View style={StyleSheet.flatten([styles.tileIcon, { backgroundColor: it.renk + (light ? '18' : '33') }])}>
              <Ionicons name={it.icon} size={26} color={light ? it.renk : '#fff'} />
            </View>
            <Text style={StyleSheet.flatten([styles.tileLabel, { color: colors.text }])} numberOfLines={1}>
              {it.label}
            </Text>
            <Text style={StyleSheet.flatten([styles.tileAlt, { color: colors.textSecondary }])} numberOfLines={1}>
              {it.alt}
            </Text>
          </Pressable>
        ))}
      </View>

      {acik ? (
        <View style={StyleSheet.flatten([styles.diger, { backgroundColor: colors.card, borderColor: colors.border }])}>
          {digerleri.map((item, i) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={ETIKET_DUZELT[item.id] ?? item.label}
              onPress={() => router.push(item.href as never)}
              style={({ pressed }) =>
                StyleSheet.flatten([
                  styles.digerRow,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                  { opacity: pressed ? 0.7 : 1 },
                ])
              }>
              <View style={StyleSheet.flatten([styles.digerIcon, { backgroundColor: light ? '#f4f7f0' : '#ffffff14' }])}>
                <Image source={KILITLI_HIZLI_IKONLAR[item.icon]} style={styles.png} resizeMode="contain" />
              </View>
              <Text style={StyleSheet.flatten([styles.digerLabel, { color: colors.text }])}>
                {ETIKET_DUZELT[item.id] ?? item.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginBottom: 20 },
  baslikRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  baslik: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  tumuBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tumu: { fontSize: 15, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 112,
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  tileIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tileLabel: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  tileAlt: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  diger: { marginTop: 12, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  digerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  digerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  png: { width: 26, height: 26 },
  digerLabel: { flex: 1, fontSize: 16, fontWeight: '700' },
});
