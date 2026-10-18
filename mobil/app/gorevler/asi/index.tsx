import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  ASI_PROGRAMI,
  asiKategori,
  type AsiProgramKalemi,
} from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI } from '@/kaynak/akilli-veteriner/vitamin-programi';

/**
 * Mod 1 (Kuzu alarak besi) planı — yalnız planlanan kalemler, bu sırayla.
 * Katalogdaki diğer kalemler bu listede gösterilmez.
 */
const MOD1_ASI_SIRA: string[] = ['karma', 'cicek', 'ppr', 'pasteurella', 'sarbon', 'brusella', 'sap'];

const MOD1_PARAZIT_SIRA: string[] = ['ivermektin', 'albendazol'];

const MOD1_VITAMIN_SIRA: string[] = ['selen-e'];

const NEDEN: Record<string, string> = {
  karma: 'Birinci öncelik · klostridiyal + pastörella (pratikte karma)',
  cicek: 'Yaş / dönem zorunlu risk',
  ppr: 'Yüksek öncelikli viral koruma',
  pasteurella: 'Solunum koruması',
  sarbon: 'Bölgesel risk',
  brusella: 'Damızlık programı',
  sap: 'Kampanya / resmi program',
  ivermektin: 'Gün 1 min. paket · parazit',
  albendazol: 'Gün 1 min. paket · parazit',
  'selen-e': 'Beyaz kas hastalığı önlemi — Gün 1',
};

/** Listede gösterilecek ortak satır (aşı / parazit / vitamin). */
type PlanSatir = { id: string; ad: string; aciklama: string };

/** Yalnız verilen id'leri, verilen sırayla döndürür (katalog geri kalanı eklenmez). */
function sadeceSirali<T extends { id: string }>(ids: string[], items: T[]): T[] {
  const map = new Map(items.map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter((p): p is T => p != null);
}

function asiSatir(p: AsiProgramKalemi): PlanSatir {
  return { id: p.id, ad: p.ad, aciklama: p.koruma };
}

export default function AsiListeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const asilar: PlanSatir[] = sadeceSirali(
    MOD1_ASI_SIRA,
    ASI_PROGRAMI.filter((p) => asiKategori(p) === 'asi'),
  ).map(asiSatir);
  const parazitler: PlanSatir[] = sadeceSirali(
    MOD1_PARAZIT_SIRA,
    ASI_PROGRAMI.filter((p) => asiKategori(p) === 'parazit'),
  ).map(asiSatir);
  const vitaminler: PlanSatir[] = sadeceSirali(MOD1_VITAMIN_SIRA, VITAMIN_PROGRAMI).map((v) => ({
    id: v.id,
    ad: v.ad,
    aciklama: v.detay,
  }));

  // Detay ekranı (/gorevler/asi/[programId]) aşı, parazit ve vitamin kalemlerini birlikte açar.
  const renderSatir = (p: PlanSatir, sira: number) => (
    <Pressable
      key={p.id}
      onPress={() => router.push(`/gorevler/asi/${p.id}` as never)}
      style={[styles.satir, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.siraBadge, { backgroundColor: colors.tint }]}>
        <Text style={styles.siraText}>{sira}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.ad, { color: colors.text }]}>{p.ad}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{p.aciklama}</Text>
        <Text style={{ color: colors.tint, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
          {NEDEN[p.id] ?? 'Plan kalemi'}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Durum: sırada</Text>
      </View>
      <Text style={{ color: colors.tint, fontWeight: '800' }}>→</Text>
    </Pressable>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Aşı listesi' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scroll}>
        <Text style={[styles.planBaslik, { color: colors.text }]}>Kuzu besi (Mod 1) planı</Text>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Yalnız planladığımız aşı, ilaç ve vitaminler, öncelik sırasıyla. Pratikte{' '}
          <Text style={{ fontWeight: '800', color: colors.text }}>Karma aşı</Text> kullanılır
          (tek başına enterotoksemi değil).
        </Text>

        <Text style={[styles.bolum, { color: colors.textSecondary }]}>Aşılar</Text>
        {asilar.map((p, i) => renderSatir(p, i + 1))}

        <Text style={[styles.bolum, { color: colors.textSecondary, marginTop: 16 }]}>Parazit</Text>
        {parazitler.map((p, i) => renderSatir(p, asilar.length + i + 1))}

        <Text style={[styles.bolum, { color: colors.textSecondary, marginTop: 16 }]}>Vitamin</Text>
        {vitaminler.map((p, i) => renderSatir(p, asilar.length + parazitler.length + i + 1))}

        <Pressable
          onPress={() => router.push('/gorevler/kategori/asi' as never)}
          style={{ marginTop: 16, marginBottom: 8 }}>
          <Text style={{ color: colors.tint, fontWeight: '800' }}>Gün gün aşı görevleri →</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(tabs)/saglik' as never)} style={{ marginBottom: 32 }}>
          <Text style={{ color: colors.tint, fontWeight: '800' }}>Sağlık / aşı kayıtları →</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  planBaslik: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  intro: { lineHeight: 20, marginBottom: 16, fontSize: 14 },
  bolum: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  siraBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siraText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  ad: { fontSize: 16, fontWeight: '800' },
});
