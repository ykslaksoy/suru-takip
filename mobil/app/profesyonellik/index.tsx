import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { ProfesyonellikAltDock } from '@/bilesenler/profesyonellik/ProfesyonellikAltDock';
import { AsamaOzetKarti } from '@/bilesenler/profesyonellik/AsamaOzetKarti';
import {
  analizEt,
  getAsamaPaketi,
  getProfesyonellikDurum,
  setProfesyonellikPaket,
  sonrakiAsama,
  type AsamaPaketBoyutu,
  type ProfesyonellikDurum,
} from '@/kaynak/profesyonellik';

export default function ProfesyonellikHubScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [durum, setDurum] = useState<ProfesyonellikDurum | null>(null);

  const yukle = useCallback(async () => {
    setDurum(await getProfesyonellikDurum());
  }, []);

  useFocusEffect(
    useCallback(() => {
      yukle();
    }, [yukle])
  );

  if (!durum) return null;

  const liste = getAsamaPaketi(durum.paket);
  const analiz =
    Object.keys(durum.cevaplar).length > 0 ? analizEt(durum.cevaplar, durum.paket) : null;
  const mevcut =
    analiz?.mevcutAsama ??
    (durum.mevcutAsamaId ? liste.find((a) => a.id === durum.mevcutAsamaId) ?? null : null);
  const onayli = new Set(durum.onaylananAsamaIdler);
  let sonraki = analiz?.sonraki ?? sonrakiAsama(durum.mevcutAsamaId, durum.paket);
  while (sonraki && onayli.has(sonraki.id)) {
    sonraki = sonrakiAsama(sonraki.id, durum.paket);
  }

  const paketDegistir = async (paket: AsamaPaketBoyutu) => {
    setDurum(await setProfesyonellikPaket(paket));
  };

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.lead, { color: colors.text }]}>Profesyonellik yolu</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Bugünkü sistemini gir → aşamanı gör → bir üst adımı onayla → görevler açılsın.
        </Text>

        <Text style={[styles.etiket, { color: colors.textSecondary }]}>Aşama paketi</Text>
        <View style={styles.paketRow}>
          {([5, 10] as AsamaPaketBoyutu[]).map((p) => {
            const on = durum.paket === p;
            return (
              <Pressable
                key={p}
                onPress={() => paketDegistir(p)}
                style={[
                  styles.paketBtn,
                  {
                    backgroundColor: on ? colors.tint : colors.card,
                    borderColor: on ? colors.tint : colors.border,
                  },
                ]}>
                <Text style={{ color: on ? '#fff' : colors.text, fontWeight: '800' }}>
                  {p} aşama
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Öneri: sahada {durum.paket === 5 ? '5 (varsayılan)' : '10 ince'}. 10, aynı yolun alt
          adımlarıdır.
        </Text>

        {mevcut ? (
          <>
            <Text style={[styles.etiket, { color: colors.textSecondary }]}>Şu an</Text>
            <AsamaOzetKarti asama={mevcut} vurgu="mevcut" />
          </>
        ) : (
          <Text style={[styles.bos, { color: colors.textSecondary }]}>
            Henüz analiz yok. Önce sistemini gir.
          </Text>
        )}

        <View style={{ marginTop: 8, gap: 8 }}>
          <AnaButon title="Sistemimi gir" onPress={() => router.push('/profesyonellik/sistemim' as never)} />
          {mevcut ? (
            <AnaButon
              title="Sonucu gör"
              variant="secondary"
              onPress={() => router.push('/profesyonellik/sonuc' as never)}
            />
          ) : null}
          {sonraki && !onayli.has(sonraki.id) ? (
            <AnaButon
              title={`Üst aşama: ${sonraki.baslik}`}
              variant="secondary"
              onPress={() => router.push('/profesyonellik/oneri' as never)}
            />
          ) : null}
        </View>

        <Text style={[styles.etiket, { color: colors.textSecondary, marginTop: 20 }]}>
          Yol haritası ({liste.length})
        </Text>
        {liste.map((a) => (
          <View
            key={a.id}
            style={[
              styles.satir,
              {
                borderColor: onayli.has(a.id) ? colors.success : colors.border,
                backgroundColor: colors.card,
              },
            ]}>
            <Text style={[styles.satirSira, { color: colors.tint }]}>{a.sira}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.satirBaslik, { color: colors.text }]}>{a.baslik}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>
                {onayli.has(a.id) ? 'Onaylandı · görevler açık' : a.ozet}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <ProfesyonellikAltDock />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 28 },
  lead: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  sub: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 16 },
  etiket: { fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
  paketRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  paketBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: 12, lineHeight: 17, marginBottom: 16 },
  bos: { marginBottom: 12, lineHeight: 20 },
  satir: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  satirSira: { fontSize: 18, fontWeight: '800', width: 28, textAlign: 'center' },
  satirBaslik: { fontSize: 15, fontWeight: '700' },
});
