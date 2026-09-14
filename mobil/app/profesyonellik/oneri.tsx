import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { ProfesyonellikAltDock } from '@/bilesenler/profesyonellik/ProfesyonellikAltDock';
import { AsamaOzetKarti } from '@/bilesenler/profesyonellik/AsamaOzetKarti';
import {
  analizEt,
  asamaOnaylaVeGorevAc,
  etiketMetin,
  getProfesyonellikDurum,
  sonrakiAsama,
  type ProfesyonellikAsama,
} from '@/kaynak/profesyonellik';

export default function OneriScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [hedef, setHedef] = useState<ProfesyonellikAsama | null>(null);
  const [zatenOnay, setZatenOnay] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const d = await getProfesyonellikDurum();
        const analiz = Object.keys(d.cevaplar).length
          ? analizEt(d.cevaplar, d.paket)
          : null;
        const aday =
          analiz?.sonraki ?? sonrakiAsama(d.mevcutAsamaId, d.paket);
        setHedef(aday);
        setZatenOnay(aday ? d.onaylananAsamaIdler.includes(aday.id) : false);
      })();
    }, [])
  );

  const onayla = async () => {
    if (!hedef || yukleniyor) return;
    setYukleniyor(true);
    try {
      const { gorevIdleri, hatirlatma } = await asamaOnaylaVeGorevAc(hedef);
      Alert.alert(
        'Onaylandı',
        `${gorevIdleri.length} görev eklendi.${
          hatirlatma ? ' Hatırlatma kuruldu.' : ' (Web’de bildirim yok — görevler listesinde.)'
        }`
      );
      router.push('/gorevler' as never);
    } finally {
      setYukleniyor(false);
    }
  };

  if (!hedef) {
    return (
      <View style={[styles.shell, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.lead, { color: colors.text }]}>Öneri yok</Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
            Önce sistem analizi yap veya tüm aşamalar tamam.
          </Text>
          <AnaButon title="Sistemimi gir" onPress={() => router.push('/profesyonellik/sistemim' as never)} />
        </ScrollView>
        <ProfesyonellikAltDock />
      </View>
    );
  }

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.kucuk, { color: colors.tint }]}>Bir üst aşama</Text>
        <Text style={[styles.lead, { color: colors.text }]}>{hedef.baslik}</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Onaylarsan bu işler görev listene eklenir ve hatırlatılır.
        </Text>

        <AsamaOzetKarti asama={hedef} vurgu="sonraki" />

        <Text style={[styles.bolum, { color: colors.text }]}>Ne yapılacak</Text>
        {hedef.eylemler.map((e) => {
          const et = etiketMetin(e.etiket);
          return (
            <View
              key={e.id}
              style={[styles.madde, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {et ? (
                <Text style={[styles.badge, { color: colors.tint }]}>{et}</Text>
              ) : null}
              <Text style={[styles.maddeBaslik, { color: colors.text }]}>{e.baslik}</Text>
              <Text style={{ color: colors.textSecondary, lineHeight: 18 }}>{e.aciklama}</Text>
            </View>
          );
        })}

        <Text style={[styles.bolum, { color: colors.text }]}>Avantaj / getiri</Text>
        {hedef.avantajlar.map((a) => (
          <View
            key={a.id}
            style={[styles.madde, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.maddeBaslik, { color: colors.text }]}>{a.metin}</Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 18 }}>{a.getiri}</Text>
          </View>
        ))}

        {zatenOnay ? (
          <Text style={{ color: colors.success, fontWeight: '700', marginVertical: 12 }}>
            Bu aşama zaten onaylı — görevler açık.
          </Text>
        ) : (
          <View style={{ marginTop: 8, gap: 8 }}>
            <AnaButon
              title={yukleniyor ? 'Ekleniyor…' : 'Onayla — görevlere ekle'}
              disabled={yukleniyor}
              onPress={onayla}
            />
            <AnaButon
              title="Şimdilik geç"
              variant="ghost"
              onPress={() => router.back()}
            />
          </View>
        )}
      </ScrollView>
      <ProfesyonellikAltDock />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 28 },
  kucuk: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  lead: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4, marginTop: 4 },
  sub: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 14 },
  bolum: { fontSize: 16, fontWeight: '800', marginTop: 8, marginBottom: 8 },
  madde: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  badge: { fontSize: 11, fontWeight: '800', marginBottom: 4 },
  maddeBaslik: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
});
