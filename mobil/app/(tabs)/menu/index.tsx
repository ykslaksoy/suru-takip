import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import { exportTurkvetData } from '@/kaynak/cekirdek/veritabani';
import { clearAllData, seedDemoDataIfEmpty } from '@/kaynak/cekirdek/ornek-veri';
import { useDatabase } from '@/baglam/VeritabaniBaglami';

export default function MenuScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tier, tierLabel, limit } = useSubscription();
  const { refresh } = useDatabase();

  const menuItems = [
    { title: 'Abonelik Paketleri', href: '/abonelik', desc: `${tierLabel} · ${limit} hayvan limiti` },
    { title: 'Rasyon Hesaplayıcı', href: '/rasyon', desc: 'Canlı ağırlığa göre yem ihtiyacı' },
    { title: 'Akıllı Veteriner', href: '/veteriner', desc: 'Semptom yönlendirme (bilgilendirme)' },
    { title: 'Beta Pilot Programı', href: '/beta', desc: '50 çiftlik pilot — kayıt & geri bildirim' },
    { title: 'TÜRKVET / GEKİS Export', href: '/turkvet-aktar', desc: 'Resmi kayıt uyumlu dışa aktarım' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { backgroundColor: colors.tint }]}>
        <Text style={styles.heroTitle}>SürüYön</Text>
        <Text style={styles.heroSub}>Profesyonel koyun/kuzu yönetimi</Text>
        <Text style={styles.heroPlan}>Aktif paket: {tierLabel}</Text>
      </View>

      {menuItems.map((item) => (
        <Link key={item.href} href={item.href as never} asChild>
          <Pressable style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </Pressable>
        </Link>
      ))}

      <View style={{ padding: 16 }}>
        <Text style={[styles.section, { color: colors.textSecondary }]}>Geliştirici</Text>
        <AnaButon
          title="Demo veriyi yeniden yükle"
          variant="secondary"
          onPress={async () => {
            await clearAllData();
            await seedDemoDataIfEmpty();
            refresh();
            Alert.alert('Tamam', 'Demo veriler yüklendi.');
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { padding: 24, margin: 16, borderRadius: 16 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  heroSub: { color: '#ffffffcc', marginTop: 4 },
  heroPlan: { color: '#fff', marginTop: 12, fontWeight: '600' },
  item: { marginHorizontal: 16, marginBottom: 10, padding: 16, borderRadius: 12, borderWidth: 1 },
  itemTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  section: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
});
