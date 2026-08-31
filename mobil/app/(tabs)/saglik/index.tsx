import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { CevrimdisiBanner } from '@/bilesenler/ortak/CevrimdisiBanner';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import { AsiTakvimi } from '@/bilesenler/saglik/AsiTakvimi';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import {
  countHealthRecords,
  getActiveWithdrawals,
  getAsiKayitlari,
  getHealthRecords,
} from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';

type Sekme = 'kayitlar' | 'asi' | 'bekletme';
type HealthRow = Awaited<ReturnType<typeof getHealthRecords>>[number];

const SAYFA = 50;

export default function HealthOverviewScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, pendingSync, ready } = useDatabase();
  const [sekme, setSekme] = useState<Sekme>('kayitlar');
  const [records, setRecords] = useState<HealthRow[]>([]);
  const [toplamKayit, setToplamKayit] = useState(0);
  const [yukleniyorEski, setYukleniyorEski] = useState(false);
  const [asiKayitlari, setAsiKayitlari] = useState<Awaited<ReturnType<typeof getAsiKayitlari>>>([]);
  const [withdrawals, setWithdrawals] = useState<Awaited<ReturnType<typeof getActiveWithdrawals>>>([]);

  const load = useCallback(async () => {
    const [kayitlar, asi, bekletme, toplam] = await Promise.all([
      getHealthRecords(undefined, { limit: SAYFA, offset: 0 }),
      getAsiKayitlari(),
      getActiveWithdrawals(),
      countHealthRecords(),
    ]);
    setRecords(kayitlar);
    setToplamKayit(toplam);
    setAsiKayitlari(asi);
    setWithdrawals(bekletme);
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, refreshKey, load]);

  const dahaEskiYukle = async () => {
    if (yukleniyorEski || records.length >= toplamKayit) return;
    setYukleniyorEski(true);
    try {
      const eski = await getHealthRecords(undefined, {
        limit: SAYFA,
        offset: records.length,
      });
      setRecords((onceki) => {
        const ids = new Set(onceki.map((r) => r.id));
        return [...onceki, ...eski.filter((r) => !ids.has(r.id))];
      });
    } finally {
      setYukleniyorEski(false);
    }
  };

  const kalan = Math.max(0, toplamKayit - records.length);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CevrimdisiBanner pendingSync={pendingSync} />
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Sağlık</Text>
      </View>
      <AltButonlar
        items={[
          { key: 'kayitlar', label: 'Kayıtlar' },
          { key: 'asi', label: 'Aşı' },
          { key: 'bekletme', label: 'Bekletme' },
        ]}
        activeKey={sekme}
        onSelect={(k) => setSekme(k as Sekme)}
      />

      {sekme === 'bekletme' ? (
        <View style={{ padding: 16 }}>
          {withdrawals.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>
              Aktif bekletme süresi yok
            </Text>
          ) : (
            withdrawals.map((w) => {
              const end = new Date(w.recordedAt);
              end.setDate(end.getDate() + w.withdrawalDays);
              const daysLeft = Math.ceil((end.getTime() - Date.now()) / 86400000);
              return (
                <View
                  key={w.id}
                  style={[styles.card, { backgroundColor: colors.warning + '22', borderColor: colors.warning }]}>
                  <Text style={[styles.tag, { color: colors.tint }]}>
                    {hayvanAnaEtiket({
                      earTag: w.earTag ?? '',
                      sirtNo: (w as { sirtNo?: string | null }).sirtNo ?? null,
                      gehisId: null,
                      name: '',
                    })}
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: '600', marginTop: 4 }}>
                    {w.medicine}: {daysLeft} gün kaldı
                  </Text>
                </View>
              );
            })
          )}
        </View>
      ) : null}

      {sekme === 'asi' ? (
        <FlatList
          data={asiKayitlari}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={<AsiTakvimi />}
          renderItem={({ item }) => (
            <Link href={`/hayvan/${item.animalId}/saglik`} asChild>
              <Pressable
                style={StyleSheet.flatten([
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16 },
                ])}>
                <Text style={[styles.tag, { color: colors.tint }]}>
                  {hayvanAnaEtiket({
                    earTag: item.earTag ?? '',
                    sirtNo: item.sirtNo ?? null,
                    gehisId: null,
                    name: '',
                  })}
                </Text>
                <Text style={{ color: colors.text, fontWeight: '600', marginTop: 4 }}>
                  {item.medicine || item.treatment || item.diagnosis || 'Aşı kaydı'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  {new Date(item.recordedAt).toLocaleDateString('tr-TR')}
                </Text>
              </Pressable>
            </Link>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 8 }}>
              Henüz uygulanmış aşı kaydı yok
            </Text>
          }
        />
      ) : null}

      {sekme === 'kayitlar' ? (
        <FlatList
          data={records}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListHeaderComponent={
            <>
              {withdrawals.length > 0 ? (
                <Pressable
                  onPress={() => setSekme('bekletme')}
                  style={[styles.warningBox, { backgroundColor: colors.warning + '33', borderColor: colors.warning }]}>
                  <Text style={[styles.warningTitle, { color: colors.text }]}>
                    ⚠ {withdrawals.length} aktif bekletme — bak
                  </Text>
                </Pressable>
              ) : null}
              {toplamKayit > 0 ? (
                <Text style={{ color: colors.textSecondary, marginBottom: 10, fontSize: 13 }}>
                  Son {records.length} kayıt
                  {toplamKayit > records.length ? ` · toplam ${toplamKayit}` : ''}
                </Text>
              ) : null}
            </>
          }
          renderItem={({ item }) => (
            <Link href={`/hayvan/${item.animalId}/saglik`} asChild>
              <Pressable
                style={StyleSheet.flatten([styles.card, { backgroundColor: colors.card, borderColor: colors.border }])}>
                <Text style={[styles.tag, { color: colors.tint }]}>
                  {hayvanAnaEtiket({
                    earTag: item.earTag ?? '',
                    sirtNo: item.sirtNo ?? null,
                    gehisId: null,
                    name: '',
                  })}
                </Text>
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
          ListFooterComponent={
            kalan > 0 ? (
              <Pressable
                onPress={() => void dahaEskiYukle()}
                disabled={yukleniyorEski}
                style={[styles.dahaEskiBtn, { borderColor: colors.tint, opacity: yukleniyorEski ? 0.6 : 1 }]}>
                <Text style={{ color: colors.tint, fontWeight: '700', textAlign: 'center' }}>
                  {yukleniyorEski
                    ? 'Yükleniyor…'
                    : `Daha eski kayıtlar (+${Math.min(SAYFA, kalan)})`}
                </Text>
              </Pressable>
            ) : records.length > SAYFA ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 13 }}>
                Tüm kayıtlar gösteriliyor ({records.length})
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: colors.textSecondary }}>Sağlık kaydı yok</Text>
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  pageTitle: { fontSize: 26, fontWeight: '800' },
  warningBox: { marginBottom: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  warningTitle: { fontWeight: '700' },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  tag: { fontWeight: '700' },
  dahaEskiBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
});
