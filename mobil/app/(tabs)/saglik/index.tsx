import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { CevrimdisiBanner } from '@/bilesenler/ortak/CevrimdisiBanner';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { getActiveWithdrawals, getHealthRecords } from '@/kaynak/cekirdek/veritabani';

export default function HealthOverviewScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, pendingSync, ready } = useDatabase();
  const [records, setRecords] = useState<Awaited<ReturnType<typeof getHealthRecords>>>([]);
  const [withdrawals, setWithdrawals] = useState<Awaited<ReturnType<typeof getActiveWithdrawals>>>([]);

  const load = useCallback(async () => {
    setRecords(await getHealthRecords());
    setWithdrawals(await getActiveWithdrawals());
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, refreshKey, load]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CevrimdisiBanner pendingSync={pendingSync} />
      {withdrawals.length > 0 && (
        <View style={[styles.warningBox, { backgroundColor: colors.warning + '33', borderColor: colors.warning }]}>
          <Text style={[styles.warningTitle, { color: colors.text }]}>⚠ Aktif bekletme süreleri</Text>
          {withdrawals.map((w) => {
            const end = new Date(w.recordedAt);
            end.setDate(end.getDate() + w.withdrawalDays);
            const daysLeft = Math.ceil((end.getTime() - Date.now()) / 86400000);
            return (
              <Text key={w.id} style={{ color: colors.text, marginTop: 4 }}>
                {w.earTag} — {w.medicine}: {daysLeft} gün kaldı
              </Text>
            );
          })}
        </View>
      )}
      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Link href={`/hayvan/${item.animalId}/saglik`} asChild>
            <Pressable style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.tag, { color: colors.tint }]}>{item.earTag}</Text>
              <Text style={{ color: colors.text, fontWeight: '600', marginTop: 4 }}>
                {item.symptoms || item.diagnosis || item.treatment || 'Kayıt'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                {new Date(item.recordedAt).toLocaleDateString('tr-TR')}
                {item.vetName ? ` · ${item.vetName}` : ''}
              </Text>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textSecondary }}>Sağlık kaydı yok</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  warningBox: { margin: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  warningTitle: { fontWeight: '700' },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  tag: { fontWeight: '700' },
});
