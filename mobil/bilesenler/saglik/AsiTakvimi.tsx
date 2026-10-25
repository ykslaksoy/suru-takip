import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AsiBaslikSatir } from '@/bilesenler/veteriner/AsiBaslikSatir';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { getAnimal } from '@/kaynak/cekirdek/veritabani';
import { getAsiTakvimiDurumu, type AsiStokDurum } from '@/kaynak/saglik';
import {
  asiBildirimIzinIste,
  asiBuHaftaListesi,
  asiHatirlatmaBanner,
  asiHatirlatmalariYenile,
  asiNativeBildirimDestekleniyor,
  type AsiBuHaftaSatir,
  type AsiHatirlatmaBanner,
} from '@/kaynak/saglik/asi-hatirlatma';
import { uygulaAsiHayvana } from '@/kaynak/akilli-veteriner/asi-uygula';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';

export function AsiTakvimi() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { ready, refreshKey } = useDatabase();
  const [list, setList] = useState<AsiStokDurum[]>([]);
  const [hafta, setHafta] = useState<AsiBuHaftaSatir[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<AsiHatirlatmaBanner | null>(null);
  const [hatirlatmaMsg, setHatirlatmaMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const durum = await getAsiTakvimiDurumu();
      setList(durum);
      const haftaListe = asiBuHaftaListesi(durum);
      setHafta(haftaListe);

      let planlandi = 0;
      let izinVar: boolean | undefined;
      if (asiNativeBildirimDestekleniyor() && haftaListe.length > 0) {
        izinVar = await asiBildirimIzinIste();
        if (izinVar) {
          planlandi = await asiHatirlatmalariYenile(durum);
        }
      }
      setBanner(asiHatirlatmaBanner(durum, { bildirimPlanlandi: planlandi, izinVar }));
      setHatirlatmaMsg('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, refreshKey, load]);

  const tekHayvanUygula = (s: AsiBuHaftaSatir) => {
    Alert.alert(
      'Aşı / parazit uygula',
      `${s.etiket || s.earTag || 'Hayvan'}\n${s.koruma} (${s.asiAdi}) ${s.mlEtiket}\n\nSağlık kaydı yazılır, stok düşülür.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Uygula',
          onPress: () => {
            void (async () => {
              const animal = await getAnimal(s.animalId);
              if (!animal) {
                Alert.alert('Hata', 'Hayvan bulunamadı');
                return;
              }
              const r = await uygulaAsiHayvana({ animal, programId: s.programId });
              Alert.alert(r.ok ? 'Tamam' : 'Hata', r.message);
              await load();
            })();
          },
        },
        {
          text: 'Kayıt aç',
          onPress: () => router.push(`/hayvan/${s.animalId}/saglik` as never),
        },
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator color={colors.tint} style={{ marginTop: 24 }} />;
  }

  if (list.length === 0) {
    return (
      <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24, paddingHorizontal: 16 }}>
        Yapılacak veya yaklaşan aşı yok. Program ve stok dengede.
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Yapılacak aşılar ile stok dozu karşılaştırılır. Eksik varsa Bugün kartında da görünür.
      </Text>

      {banner ? (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: banner.tip === 'web' ? colors.warning + '22' : colors.tint + '14',
              borderColor: banner.tip === 'web' ? colors.warning : colors.tint,
            },
          ]}>
          <Text style={{ color: colors.text, fontWeight: '700', lineHeight: 20 }}>{banner.metin}</Text>
        </View>
      ) : null}

      {hafta.length > 0 ? (
        <View style={[styles.weekCard, { backgroundColor: colors.card, borderColor: colors.tint }]}>
          <Text style={[styles.title, { color: colors.text }]}>Bu hafta / yapılacak</Text>
          {hafta.slice(0, 12).map((s) => (
            <Pressable
              key={`${s.programId}-${s.animalId}`}
              onPress={() => tekHayvanUygula(s)}
              style={styles.weekRow}>
              <Text style={{ color: colors.text, flex: 1, fontWeight: '600' }}>
                {s.etiket || s.earTag || '—'} · {s.koruma} ({s.asiAdi}) {s.mlEtiket}
              </Text>
              <Text style={{ color: s.durum === 'yapilacak' ? colors.danger : colors.warning, fontWeight: '800', fontSize: 12 }}>
                {s.durum === 'yapilacak'
                  ? 'Uygula'
                  : s.kalanGun != null
                    ? `${s.kalanGun}g`
                    : 'Yaklaşıyor'}
              </Text>
            </Pressable>
          ))}
          {asiNativeBildirimDestekleniyor() ? (
            <AnaButon
              title="Hatırlatmaları yenile"
              variant="secondary"
              onPress={async () => {
                const ok = await asiBildirimIzinIste();
                if (!ok) {
                  setBanner(
                    asiHatirlatmaBanner(list, { izinVar: false }) ?? {
                      tip: 'izin_yok',
                      metin: 'Bildirim izni verilmedi.',
                      satirSayisi: hafta.length,
                    },
                  );
                  return;
                }
                const n = await asiHatirlatmalariYenile(list, true);
                setBanner(
                  asiHatirlatmaBanner(list, { bildirimPlanlandi: n, izinVar: true }) ?? {
                    tip: 'planlandi',
                    metin: n > 0 ? `${n} hatırlatma planlandı` : 'Planlanacak satır yok',
                    satirSayisi: hafta.length,
                  },
                );
              }}
            />
          ) : null}
          {hatirlatmaMsg ? (
            <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>{hatirlatmaMsg}</Text>
          ) : null}
        </View>
      ) : null}

      {list.map((d) => {
        const uyari = !d.stokYeterli || d.sktYakin;
        return (
          <View
            key={d.programId}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: uyari ? colors.danger : colors.border,
              },
            ]}>
            <AsiBaslikSatir
              koruma={d.koruma}
              asiAdi={d.asiAdi}
              mlEtiket={d.mlEtiket}
              devletNotu={d.devletNotu}
            />
            <Text style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 20 }}>
              Yapılacak: {d.yapilacakSayisi} · Yaklaşan: {d.yaklasanSayisi}
              {'\n'}
              Gerekli: {d.gerekenDoz} doz · Stok: {d.stokMiktar} {d.stokBirim}
              {d.stokAdi ? ` (${d.stokAdi})` : ' — stok kaydı yok'}
            </Text>
            {!d.stokYeterli ? (
              <Text style={[styles.flag, { color: colors.danger }]}>
                Eksik {d.eksikDoz} doz — stok tamamlanmalı
              </Text>
            ) : (
              <Text style={[styles.flag, { color: colors.success }]}>Stok yeterli</Text>
            )}
            {d.sktYakin ? (
              <Text style={[styles.flag, { color: colors.warning }]}>Son kullanma tarihi yaklaşıyor</Text>
            ) : null}
            <View style={styles.actions}>
              <Pressable onPress={() => router.push(`/gorevler/asi/katalog/${d.programId}` as never)}>
                <Text style={{ color: colors.tint, fontWeight: '700' }}>Katalog detayı →</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(tabs)/stok' as never)} style={{ marginTop: 6 }}>
                <Text style={{ color: colors.tint, fontWeight: '700' }}>Stoka git →</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 32 },
  intro: { marginBottom: 12, lineHeight: 20 },
  banner: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  weekCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14 },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  title: { fontWeight: '800', fontSize: 16 },
  flag: { marginTop: 8, fontWeight: '700', fontSize: 13 },
  actions: { marginTop: 10 },
});
