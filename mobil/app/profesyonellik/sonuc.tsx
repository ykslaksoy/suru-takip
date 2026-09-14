import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { ProfesyonellikAltDock } from '@/bilesenler/profesyonellik/ProfesyonellikAltDock';
import { AsamaOzetKarti } from '@/bilesenler/profesyonellik/AsamaOzetKarti';
import {
  analizEt,
  getProfesyonellikDurum,
  type AnalizSonuc,
} from '@/kaynak/profesyonellik';

export default function SonucScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [sonuc, setSonuc] = useState<AnalizSonuc | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const d = await getProfesyonellikDurum();
        if (!d.mevcutAsamaId && Object.keys(d.cevaplar).length === 0) {
          setSonuc(null);
          return;
        }
        setSonuc(analizEt(d.cevaplar, d.paket));
      })();
    }, [])
  );

  if (!sonuc) {
    return (
      <View style={[styles.shell, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.lead, { color: colors.text }]}>Sonuç yok</Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
            Önce sistemini gir; sonra aşamanı burada görürsün.
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
        <Text style={[styles.kucuk, { color: colors.tint }]}>Bildirim</Text>
        <Text style={[styles.lead, { color: colors.text }]}>
          Şu an Aşama {sonuc.mevcutSira}’desin
        </Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          {sonuc.mevcutAsama.baslik} — {sonuc.mevcutAsama.ozet}
        </Text>

        <AsamaOzetKarti asama={sonuc.mevcutAsama} vurgu="mevcut" />

        {sonuc.sonraki ? (
          <>
            <Text style={[styles.kucuk, { color: colors.textSecondary }]}>Sıradaki</Text>
            <AsamaOzetKarti asama={sonuc.sonraki} vurgu="sonraki" />
            <AnaButon
              title="Üst aşamayı gör ve onayla"
              onPress={() => router.push('/profesyonellik/oneri' as never)}
            />
          </>
        ) : (
          <Text style={{ color: colors.success, fontWeight: '700', marginTop: 8 }}>
            Tüm aşamalar tamam — tebrikler.
          </Text>
        )}

        <View style={{ marginTop: 8 }}>
          <AnaButon
            title="Geri: hub"
            variant="ghost"
            onPress={() => router.replace('/profesyonellik' as never)}
          />
        </View>
      </ScrollView>
      <ProfesyonellikAltDock />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 28 },
  kucuk: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
  lead: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  sub: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 16 },
});
