import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  ASI_PROGRAMI,
  asiKategori,
  type AsiProgramKalemi,
} from '@/kaynak/cekirdek/asi-programi';

/** Gösterim önceliği (yüksek → düşük). Katalog dışına çıkmadan sıralar. */
const ASI_ONCELIK_SIRA: string[] = [
  'karma',
  'cicek',
  'ppr',
  'pasteurella',
  'sarbon',
  'brusella',
  'sap',
  'clostridial',
  'enterotoksemi',
  'septisemi',
  'ektima',
  'tetanos',
  'agalaksi',
  'topallik',
];

const PARAZIT_ONCELIK_SIRA: string[] = [
  'ivermektin',
  'albendazol',
  'levamizol',
  'triklabendazol',
  'oksiklozanid',
  'doramektin',
];

const NEDEN: Record<string, string> = {
  karma: 'Birinci öncelik · klostridiyal + pastörella (pratikte karma)',
  cicek: 'Yaş / dönem zorunlu risk',
  ppr: 'Yüksek öncelikli viral koruma',
  pasteurella: 'Solunum koruması',
  sarbon: 'Bölgesel risk',
  brusella: 'Damızlık programı',
  sap: 'Kampanya / resmi program',
  clostridial: 'Klostridiyal koruma (karma yoksa)',
  enterotoksemi: 'İsteğe bağlı · pratikte karma tercih',
  septisemi: 'İsteğe bağlı / riskli dönem',
  ektima: 'ORF · sürü riskine göre',
  tetanos: 'Yara / işlem riskine göre',
  agalaksi: 'Süt sürüleri',
  topallik: 'Ayak sağlığı',
  ivermektin: 'Gün 1 min. paket · parazit',
  albendazol: 'Gün 1 min. paket · parazit',
  levamizol: 'Parazit alternatifi',
  triklabendazol: 'Karaciğer kelebeği',
  oksiklozanid: 'Kelebek / parazit',
  doramektin: 'Parazit alternatifi',
};

function sirala(ids: string[], items: AsiProgramKalemi[]): AsiProgramKalemi[] {
  const map = new Map(items.map((p) => [p.id, p]));
  const out: AsiProgramKalemi[] = [];
  for (const id of ids) {
    const p = map.get(id);
    if (p) {
      out.push(p);
      map.delete(id);
    }
  }
  for (const p of items) {
    if (map.has(p.id)) out.push(p);
  }
  return out;
}

export default function AsiListeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const asilar = sirala(
    ASI_ONCELIK_SIRA,
    ASI_PROGRAMI.filter((p) => asiKategori(p) === 'asi'),
  );
  const parazitler = sirala(
    PARAZIT_ONCELIK_SIRA,
    ASI_PROGRAMI.filter((p) => asiKategori(p) === 'parazit'),
  );

  const renderSatir = (p: AsiProgramKalemi, sira: number) => (
    <Pressable
      key={p.id}
      onPress={() => router.push(`/gorevler/asi/${p.id}` as never)}
      style={[styles.satir, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.siraBadge, { backgroundColor: colors.tint }]}>
        <Text style={styles.siraText}>{sira}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.ad, { color: colors.text }]}>{p.ad}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{p.koruma}</Text>
        <Text style={{ color: colors.tint, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
          {NEDEN[p.id] ?? 'Katalog kalemi'}
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
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Öncelik sırasına göre aşılar. Gecikmiş ve yakında olanlar üstte tutulur; pratikte{' '}
          <Text style={{ fontWeight: '800', color: colors.text }}>Karma aşı</Text> kullanılır
          (tek başına enterotoksemi değil).
        </Text>

        <Text style={[styles.bolum, { color: colors.textSecondary }]}>Aşılar</Text>
        {asilar.map((p, i) => renderSatir(p, i + 1))}

        <Text style={[styles.bolum, { color: colors.textSecondary, marginTop: 16 }]}>Parazit</Text>
        {parazitler.map((p, i) => renderSatir(p, asilar.length + i + 1))}

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
