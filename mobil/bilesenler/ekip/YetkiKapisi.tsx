import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { ROL_ETIKET, YETKI_ACIKLAMA, YETKI_ETIKET, type Yetki } from '@/kaynak/ekip/hesap';
import { useEkip } from './useEkip';

/** Ekranı yetkiye göre kilitler; yetki yoksa açıklama + Ekip'e git */
export function YetkiKapisi({ yetki, children }: { yetki: Yetki; children: ReactNode }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { aktif, yetki: var_ } = useEkip();
  if (var_(yetki)) return <>{children}</>;
  return (
    <View style={[styles.kutu, { backgroundColor: colors.background }]}>
      <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ fontSize: 36, textAlign: 'center' }}>🔒</Text>
        <Text style={[styles.baslik, { color: colors.text }]}>Bu ekran için yetkin yok</Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 21 }}>
          {aktif.ad} ({ROL_ETIKET[aktif.rol]}) · "{YETKI_ETIKET[yetki]}" kapalı.{'\n'}
          {YETKI_ACIKLAMA[yetki]}.
        </Text>
        <Pressable onPress={() => router.push('/ekip' as never)} style={[styles.btn, { backgroundColor: colors.tint }]}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Kullanıcı değiştir / Ekip</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Aktif kullanıcı rozeti (Daha menüsü vb.) */
export function AktifKullaniciRozeti() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { aktif, kisiler } = useEkip();
  return (
    <Pressable onPress={() => router.push('/ekip' as never)} style={[styles.rozet, { backgroundColor: colors.card, borderColor: colors.tint }]}>
      <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>
        👤 {aktif.ad} · {ROL_ETIKET[aktif.rol]}
      </Text>
      <Text style={{ color: colors.tint, fontWeight: '700' }}>{kisiler.length > 1 ? 'Değiştir ›' : 'Ekip ekle ›'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kutu: { flex: 1, padding: 16, justifyContent: 'center' },
  kart: { borderWidth: 1.5, borderRadius: 16, padding: 20, gap: 10 },
  baslik: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  btn: { borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  rozet: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, padding: 12, marginBottom: 12 },
});
