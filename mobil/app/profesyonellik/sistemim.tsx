import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { ProfesyonellikAltDock } from '@/bilesenler/profesyonellik/ProfesyonellikAltDock';
import {
  SISTEM_SORULAR,
  analizEt,
  getProfesyonellikDurum,
  kaydetSistemCevaplari,
  type SistemCevaplari,
  type SistemSoruId,
} from '@/kaynak/profesyonellik';

export default function SistemimScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [cevaplar, setCevaplar] = useState<SistemCevaplari>({});
  const [paket, setPaket] = useState<5 | 10>(5);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const d = await getProfesyonellikDurum();
        setCevaplar(d.cevaplar);
        setPaket(d.paket);
      })();
    }, [])
  );

  const sec = (soruId: SistemSoruId, secenekId: string) => {
    setCevaplar((prev) => ({ ...prev, [soruId]: secenekId }));
  };

  const cevapSayisi = SISTEM_SORULAR.filter((s) => cevaplar[s.id]).length;
  const hazir = cevapSayisi >= 4;

  const analizVeKaydet = async () => {
    const sonuc = analizEt(cevaplar, paket);
    await kaydetSistemCevaplari(cevaplar, sonuc.mevcutAsama.id);
    router.push('/profesyonellik/sonuc' as never);
  };

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.lead, { color: colors.text }]}>Sistemimi gir</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Bugün nasıl çalışıyorsun? Büyük butonlara dokun — az yazı.
        </Text>

        {SISTEM_SORULAR.map((soru) => (
          <View key={soru.id} style={styles.blok}>
            <Text style={[styles.soru, { color: colors.text }]}>{soru.baslik}</Text>
            <View style={styles.secenekler}>
              {soru.secenekler.map((secenek) => {
                const on = cevaplar[soru.id] === secenek.id;
                return (
                  <Pressable
                    key={secenek.id}
                    onPress={() => sec(soru.id, secenek.id)}
                    style={({ pressed }) => [
                      styles.secBtn,
                      {
                        backgroundColor: on ? colors.tint : colors.card,
                        borderColor: on ? colors.tint : colors.border,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}>
                    <Text
                      style={{
                        color: on ? '#fff' : colors.text,
                        fontWeight: '700',
                        fontSize: 15,
                        textAlign: 'center',
                      }}>
                      {secenek.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={{ marginTop: 8 }}>
          <AnaButon
            title={hazir ? 'Analiz et' : `En az 4 soru (${cevapSayisi}/4)`}
            disabled={!hazir}
            onPress={analizVeKaydet}
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
  lead: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  sub: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 18 },
  blok: { marginBottom: 18 },
  soru: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  secenekler: { gap: 8 },
  secBtn: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
});
